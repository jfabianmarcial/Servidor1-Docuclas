use common::Config;
use mongodb::Database;
use proto_gen::document::{
    document_service_server::DocumentService,
    DeleteDocumentRequest, DeleteDocumentResponse,
    DocumentResponse, DownloadDocumentRequest,
    DownloadDocumentResponse, ListDocumentsRequest,
    ListDocumentsResponse, UploadDocumentRequest,
};
use tonic::{Request, Response, Status};

use crate::handlers::DocHandler;

pub struct DocServiceImpl {
    handler: DocHandler,
}

impl DocServiceImpl {
    pub fn new(db: &Database, config: Config) -> Self {
        Self {
            handler: DocHandler::new(db, config),
        }
    }
}

#[tonic::async_trait]
impl DocumentService for DocServiceImpl {
    async fn upload_document(
        &self,
        request: Request<UploadDocumentRequest>,
    ) -> Result<Response<DocumentResponse>, Status> {
        self.handler.upload_document(request).await
    }

    async fn download_document(
        &self,
        request: Request<DownloadDocumentRequest>,
    ) -> Result<Response<DownloadDocumentResponse>, Status> {
        self.handler.download_document(request).await
    }

    async fn list_documents(
        &self,
        request: Request<ListDocumentsRequest>,
    ) -> Result<Response<ListDocumentsResponse>, Status> {
        self.handler.list_documents(request).await
    }

    async fn delete_document(
        &self,
        request: Request<DeleteDocumentRequest>,
    ) -> Result<Response<DeleteDocumentResponse>, Status> {
        self.handler.delete_document(request).await
    }
}