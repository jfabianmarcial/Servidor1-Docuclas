use common::Config;
use mongodb::Database;
use proto_gen::admin::{
    admin_service_server::AdminService,
    AdminDeleteTopicRequest, AdminResponse,
    CreateUserRequest, DeleteUserRequest,
    ListAllTopicsRequest, ListAllTopicsResponse,
    ListUsersRequest, ListUsersResponse,
    UpdateUserRequest,
};
use tonic::{Request, Response, Status};

use crate::handlers::AdminHandler;

pub struct AdminServiceImpl {
    handler: AdminHandler,
}

impl AdminServiceImpl {
    pub fn new(db: &Database, config: Config) -> Self {
        Self {
            handler: AdminHandler::new(db, config),
        }
    }
}

#[tonic::async_trait]
impl AdminService for AdminServiceImpl {
    async fn create_user(
        &self,
        request: Request<CreateUserRequest>,
    ) -> Result<Response<AdminResponse>, Status> {
        self.handler.create_user(request).await
    }

    async fn delete_user(
        &self,
        request: Request<DeleteUserRequest>,
    ) -> Result<Response<AdminResponse>, Status> {
        self.handler.delete_user(request).await
    }

    async fn update_user(
        &self,
        request: Request<UpdateUserRequest>,
    ) -> Result<Response<AdminResponse>, Status> {
        self.handler.update_user(request).await
    }

    async fn list_users(
        &self,
        request: Request<ListUsersRequest>,
    ) -> Result<Response<ListUsersResponse>, Status> {
        self.handler.list_users(request).await
    }

    async fn delete_topic(
        &self,
        request: Request<AdminDeleteTopicRequest>,
    ) -> Result<Response<AdminResponse>, Status> {
        self.handler.delete_topic(request).await
    }

    async fn list_all_topics(
        &self,
        request: Request<ListAllTopicsRequest>,
    ) -> Result<Response<ListAllTopicsResponse>, Status> {
        self.handler.list_all_topics(request).await
    }
}