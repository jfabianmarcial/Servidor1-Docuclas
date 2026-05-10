use common::Config;
use mongodb::Database;
use proto_gen::auth::{
    auth_service_server::AuthService,
    AuthResponse, LoginRequest, RegisterRequest,
    ValidateTokenRequest, ValidateTokenResponse,
};
use tonic::{Request, Response, Status};

use crate::handlers::AuthHandler;

pub struct AuthServiceImpl {
    handler: AuthHandler,
}

impl AuthServiceImpl {
    pub fn new(db: &Database, config: Config) -> Self {
        Self {
            handler: AuthHandler::new(db, config),
        }
    }
}

#[tonic::async_trait]
impl AuthService for AuthServiceImpl {
    async fn register(
        &self,
        request: Request<RegisterRequest>,
    ) -> Result<Response<AuthResponse>, Status> {
        self.handler.register(request).await
    }

    async fn login(
        &self,
        request: Request<LoginRequest>,
    ) -> Result<Response<AuthResponse>, Status> {
        self.handler.login(request).await
    }

    async fn validate_token(
        &self,
        request: Request<ValidateTokenRequest>,
    ) -> Result<Response<ValidateTokenResponse>, Status> {
        self.handler.validate_token(request).await
    }
}