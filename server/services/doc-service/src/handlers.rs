use common::{AppError, Config};
use futures::TryStreamExt;
use mongodb::{bson::doc, Collection, Database};
use pdf_classifier::extract_keywords;
use proto_gen::document::{
    Document, DocumentResponse, DownloadDocumentRequest,
    DownloadDocumentResponse, ListDocumentsRequest,
    ListDocumentsResponse, UploadDocumentRequest,
};
use tonic::{Request, Response, Status};
use tracing::info;

use crate::classifier_client::{classify_document, TopicInput};
use crate::models::{DocumentRecord, TopicDocument};
use crate::storage::GridFsStorage;

pub struct DocHandler {
    pub docs:    Collection<DocumentRecord>,
    pub topics:  Collection<TopicDocument>,
    pub storage: GridFsStorage,
    pub config:  Config,
}

impl DocHandler {
    pub fn new(db: &Database, config: Config) -> Self {
        Self {
            docs:    db.collection("documents"),
            topics:  db.collection("topics"),
            storage: GridFsStorage::new(db),
            config,
        }
    }

    pub async fn upload_document(
        &self,
        req: Request<UploadDocumentRequest>,
    ) -> Result<Response<DocumentResponse>, Status> {
        let req = req.into_inner();

        if req.user_id.is_empty() || req.filename.is_empty() || req.content.is_empty() {
            return Err(AppError::InvalidArgument(
                "user_id, filename y content son requeridos".to_string(),
            )
            .into());
        }

        // Extraer texto del PDF
        let keywords = extract_keywords(&req.content)
            .map_err(|e| AppError::Internal(format!("Error procesando PDF: {}", e)))?;

        let text = keywords.join(" ");
        info!("Texto extraído del PDF: {} palabras", keywords.len());

        // Obtener temáticas del usuario
        let cursor = self
            .topics
            .find(doc! { "user_id": &req.user_id })
            .await
            .map_err(AppError::from)?;

        let topic_docs: Vec<TopicDocument> = cursor
            .try_collect()
            .await
            .map_err(AppError::from)?;

        // Convertir a formato del clasificador Python
        let classifier_topics: Vec<TopicInput> = topic_docs
            .iter()
            .map(|t| TopicInput {
                id:       t.id.as_ref().unwrap().to_hex(),
                name:     t.name.clone(),
                keywords: t.keywords.clone(),
            })
            .collect();

        // Clasificar con el microservicio Python
        let (topic_id, topic_name) = if classifier_topics.is_empty() {
            ("general".to_string(), "General".to_string())
        } else {
            match classify_document(&text, classifier_topics).await {
                Ok(result) => {
                    info!(
                        "Clasificado en '{}' con score {:.2}",
                        result.topic_name, result.score
                    );
                    match result.topic_id {
                        Some(id) => (id, result.topic_name),
                        None     => ("general".to_string(), "General".to_string()),
                    }
                }
                Err(e) => {
                    tracing::warn!("Error clasificando, usando General: {}", e);
                    ("general".to_string(), "General".to_string())
                }
            }
        };

        // Subir a GridFS
        let gridfs_id = self
            .storage
            .upload(&req.filename, &req.content)
            .await
            .map_err(|e| AppError::Internal(e.to_string()))?;

        // Guardar registro en MongoDB
        let record = DocumentRecord::new(
            req.user_id.clone(),
            req.filename.clone(),
            topic_id.clone(),
            topic_name.clone(),
            gridfs_id,
            keywords,
        );

        let result = self
            .docs
            .insert_one(&record)
            .await
            .map_err(AppError::from)?;

        let doc_id = result
            .inserted_id
            .as_object_id()
            .ok_or_else(|| AppError::Internal("Error obteniendo ID".to_string()))?
            .to_hex();

        info!("Documento guardado: {} -> {}", req.filename, doc_id);

        Ok(Response::new(DocumentResponse {
            success: true,
            message: format!("Documento clasificado en '{}'", topic_name),
            document: Some(Document {
                document_id: doc_id,
                user_id:     req.user_id,
                filename:    req.filename,
                topic_id,
                topic_name,
                uploaded_at: chrono::Utc::now().to_rfc3339(),
            }),
        }))
    }

    pub async fn download_document(
        &self,
        req: Request<DownloadDocumentRequest>,
    ) -> Result<Response<DownloadDocumentResponse>, Status> {
        let req = req.into_inner();

        let doc_oid = mongodb::bson::oid::ObjectId::parse_str(&req.document_id)
            .map_err(|_| AppError::InvalidArgument("document_id inválido".to_string()))?;

        let record = self
            .docs
            .find_one(doc! { "_id": doc_oid })
            .await
            .map_err(AppError::from)?
            .ok_or_else(|| AppError::NotFound("Documento no encontrado".to_string()))?;

        if record.user_id != req.user_id {
            return Err(AppError::PermissionDenied(
                "No tienes permisos para descargar este documento".to_string(),
            )
            .into());
        }

        let content = self
            .storage
            .download(&record.gridfs_id)
            .await
            .map_err(|e| AppError::Internal(e.to_string()))?;

        info!("Documento descargado: {}", req.document_id);

        Ok(Response::new(DownloadDocumentResponse {
            filename: record.filename,
            content,
            message: "Documento descargado exitosamente".to_string(),
        }))
    }

    pub async fn list_documents(
        &self,
        req: Request<ListDocumentsRequest>,
    ) -> Result<Response<ListDocumentsResponse>, Status> {
        let req = req.into_inner();

        let filter = if req.topic_id.is_empty() {
            doc! { "user_id": &req.user_id }
        } else {
            doc! { "user_id": &req.user_id, "topic_id": &req.topic_id }
        };

        let cursor = self
            .docs
            .find(filter)
            .await
            .map_err(AppError::from)?;

        let records: Vec<DocumentRecord> = cursor
            .try_collect()
            .await
            .map_err(AppError::from)?;

        let documents: Vec<Document> = records
            .into_iter()
            .map(|r| Document {
                document_id: r.id.unwrap().to_hex(),
                user_id:     r.user_id,
                filename:    r.filename,
                topic_id:    r.topic_id,
                topic_name:  r.topic_name,
                uploaded_at: r.uploaded_at.to_rfc3339(),
            })
            .collect();

        Ok(Response::new(ListDocumentsResponse { documents }))
    }
    
      pub async fn delete_document(
        &self,
        req: Request<proto_gen::document::DeleteDocumentRequest>,
    ) -> Result<Response<proto_gen::document::DeleteDocumentResponse>, Status> {
        let req = req.into_inner();

        let doc_oid = mongodb::bson::oid::ObjectId::parse_str(&req.document_id)
            .map_err(|_| AppError::InvalidArgument("document_id inválido".to_string()))?;

        let record = self
            .docs
            .find_one(doc! { "_id": doc_oid })
            .await
            .map_err(AppError::from)?
            .ok_or_else(|| AppError::NotFound("Documento no encontrado".to_string()))?;

        if record.user_id != req.user_id {
            return Err(AppError::PermissionDenied(
                "No tienes permisos para eliminar este documento".to_string(),
            )
            .into());
        }

        self.storage
            .delete(&record.gridfs_id)
            .await
            .map_err(|e| AppError::Internal(e.to_string()))?;

        self.docs
            .delete_one(doc! { "_id": doc_oid })
            .await
            .map_err(AppError::from)?;

        info!("Documento eliminado: {}", req.document_id);

        Ok(Response::new(proto_gen::document::DeleteDocumentResponse {
            success: true,
            message: "Documento eliminado exitosamente".to_string(),
        }))
    }
}

