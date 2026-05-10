use common::{AppError, Config};
use futures::TryStreamExt;
use mongodb::{bson::doc, Collection, Database};
use proto_gen::topic::{
    CreateSubTopicRequest, CreateTopicRequest,
    DeleteTopicRequest, DeleteTopicResponse,
    ListTopicsRequest, ListTopicsResponse,
    Topic, TopicResponse,
};
use tonic::{Request, Response, Status};
use tracing::info;

use crate::models::TopicDocument;

pub struct TopicHandler {
    pub collection: Collection<TopicDocument>,
    pub config:     Config,
}

impl TopicHandler {
    pub fn new(db: &Database, config: Config) -> Self {
        Self {
            collection: db.collection("topics"),
            config,
        }
    }

    pub async fn create_topic(
        &self,
        req: Request<CreateTopicRequest>,
    ) -> Result<Response<TopicResponse>, Status> {
        let req = req.into_inner();

        if req.name.is_empty() || req.user_id.is_empty() {
            return Err(AppError::InvalidArgument(
                "name y user_id son requeridos".to_string(),
            )
            .into());
        }

        // Verificar que no exista la misma temática para este usuario
        let existing = self
            .collection
            .find_one(doc! {
                "user_id":   &req.user_id,
                "name":      &req.name,
                "parent_id": null,
            })
            .await
            .map_err(AppError::from)?;

        if existing.is_some() {
            return Err(AppError::AlreadyExists(
                format!("La temática '{}' ya existe", req.name),
            )
            .into());
        }

        // Crear keywords automáticas del nombre
        let keywords = generate_keywords(&req.name);

        let topic = TopicDocument::new_with_keywords(
            req.name.clone(),
            req.user_id.clone(),
            None,
            keywords,
        );

        let result = self
            .collection
            .insert_one(&topic)
            .await
            .map_err(AppError::from)?;

        let topic_id = result
            .inserted_id
            .as_object_id()
            .ok_or_else(|| AppError::Internal("Error obteniendo ID".to_string()))?
            .to_hex();

        info!("Temática creada: {} para usuario {}", req.name, req.user_id);

        Ok(Response::new(TopicResponse {
            success: true,
            message: "Temática creada exitosamente".to_string(),
            topic: Some(Topic {
                id:        topic_id,
                name:      req.name,
                user_id:   req.user_id,
                subtopics: vec![],
            }),
        }))
    }

    pub async fn create_sub_topic(
        &self,
        req: Request<CreateSubTopicRequest>,
    ) -> Result<Response<TopicResponse>, Status> {
        let req = req.into_inner();

        if req.name.is_empty() || req.user_id.is_empty() || req.parent_topic_id.is_empty() {
            return Err(AppError::InvalidArgument(
                "name, user_id y parent_topic_id son requeridos".to_string(),
            )
            .into());
        }

        // Verificar que el padre existe
        let parent_oid = mongodb::bson::oid::ObjectId::parse_str(&req.parent_topic_id)
            .map_err(|_| AppError::InvalidArgument("parent_topic_id inválido".to_string()))?;

        let parent = self
            .collection
            .find_one(doc! { "_id": parent_oid })
            .await
            .map_err(AppError::from)?
            .ok_or_else(|| AppError::NotFound("Temática padre no encontrada".to_string()))?;

        // Verificar que el padre no tiene ya un padre (máximo 2 niveles)
        if parent.parent_id.is_some() {
            return Err(AppError::InvalidArgument(
                "Solo se permiten 2 niveles de temáticas".to_string(),
            )
            .into());
        }

        // Verificar que no exista la misma subtemática
        let existing = self
            .collection
            .find_one(doc! {
                "user_id":   &req.user_id,
                "name":      &req.name,
                "parent_id": &req.parent_topic_id,
            })
            .await
            .map_err(AppError::from)?;

        if existing.is_some() {
            return Err(AppError::AlreadyExists(
                format!("La subtemática '{}' ya existe", req.name),
            )
            .into());
        }

        let keywords = generate_keywords(&req.name);

        let subtopic = TopicDocument::new_with_keywords(
            req.name.clone(),
            req.user_id.clone(),
            Some(req.parent_topic_id.clone()),
            keywords,
        );

        let result = self
            .collection
            .insert_one(&subtopic)
            .await
            .map_err(AppError::from)?;

        let topic_id = result
            .inserted_id
            .as_object_id()
            .ok_or_else(|| AppError::Internal("Error obteniendo ID".to_string()))?
            .to_hex();

        info!("Subtemática creada: {} bajo {}", req.name, req.parent_topic_id);

        Ok(Response::new(TopicResponse {
            success: true,
            message: "Subtemática creada exitosamente".to_string(),
            topic: Some(Topic {
                id:        topic_id,
                name:      req.name,
                user_id:   req.user_id,
                subtopics: vec![],
            }),
        }))
    }

    pub async fn delete_topic(
        &self,
        req: Request<DeleteTopicRequest>,
    ) -> Result<Response<DeleteTopicResponse>, Status> {
        let req = req.into_inner();

        let topic_oid = mongodb::bson::oid::ObjectId::parse_str(&req.topic_id)
            .map_err(|_| AppError::InvalidArgument("topic_id inválido".to_string()))?;

        // Verificar que existe y pertenece al usuario
        let topic = self
            .collection
            .find_one(doc! { "_id": topic_oid })
            .await
            .map_err(AppError::from)?
            .ok_or_else(|| AppError::NotFound("Temática no encontrada".to_string()))?;

        if topic.user_id != req.user_id {
            return Err(AppError::PermissionDenied(
                "No tienes permisos para eliminar esta temática".to_string(),
            )
            .into());
        }

        // Verificar que no tiene documentos (colección documents)
        // Verificar que no tiene subtopics
        let subtopics_count = self
            .collection
            .count_documents(doc! { "parent_id": &req.topic_id })
            .await
            .map_err(AppError::from)?;

        if subtopics_count > 0 {
            return Err(AppError::InvalidArgument(
                "No se puede eliminar una temática con subtemáticas".to_string(),
            )
            .into());
        }

        self.collection
            .delete_one(doc! { "_id": topic_oid })
            .await
            .map_err(AppError::from)?;

        info!("Temática eliminada: {}", req.topic_id);

        Ok(Response::new(DeleteTopicResponse {
            success: true,
            message: "Temática eliminada exitosamente".to_string(),
        }))
    }

    pub async fn list_topics(
        &self,
        req: Request<ListTopicsRequest>,
    ) -> Result<Response<ListTopicsResponse>, Status> {
        let req = req.into_inner();

        // Obtener temáticas raíz (sin padre)
        let cursor = self
            .collection
            .find(doc! {
                "user_id":   &req.user_id,
                "parent_id": null,
            })
            .await
            .map_err(AppError::from)?;

        let root_topics: Vec<TopicDocument> = cursor
            .try_collect()
            .await
            .map_err(AppError::from)?;

        let mut topics: Vec<Topic> = vec![];

        for root in root_topics {
            let root_id = root.id.unwrap().to_hex();

            // Obtener subtemáticas de cada raíz
            let sub_cursor = self
                .collection
                .find(doc! { "parent_id": &root_id })
                .await
                .map_err(AppError::from)?;

            let subtopics_docs: Vec<TopicDocument> = sub_cursor
                .try_collect()
                .await
                .map_err(AppError::from)?;

            let subtopics: Vec<Topic> = subtopics_docs
                .into_iter()
                .map(|s| Topic {
                    id:        s.id.unwrap().to_hex(),
                    name:      s.name,
                    user_id:   s.user_id,
                    subtopics: vec![],
                })
                .collect();

            topics.push(Topic {
                id:      root_id,
                name:    root.name,
                user_id: root.user_id,
                subtopics,
            });
        }

        Ok(Response::new(ListTopicsResponse { topics }))
    }
}

/// Genera keywords automáticas a partir del nombre de la temática
fn generate_keywords(name: &str) -> Vec<String> {
    name.to_lowercase()
        .split_whitespace()
        .filter(|w| w.len() > 2)
        .map(|w| w.to_string())
        .collect()
}