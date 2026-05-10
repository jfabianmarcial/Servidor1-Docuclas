use thiserror::Error;
use tonic::Status;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("No autenticado: {0}")]
    Unauthenticated(String),

    #[error("Sin permisos: {0}")]
    PermissionDenied(String),

    #[error("No encontrado: {0}")]
    NotFound(String),

    #[error("Ya existe: {0}")]
    AlreadyExists(String),

    #[error("Datos inválidos: {0}")]
    InvalidArgument(String),

    #[error("Error de base de datos: {0}")]
    Database(String),

    #[error("Error interno: {0}")]
    Internal(String),
}

impl From<AppError> for Status {
    fn from(err: AppError) -> Self {
        match err {
            AppError::Unauthenticated(msg)  => Status::unauthenticated(msg),
            AppError::PermissionDenied(msg) => Status::permission_denied(msg),
            AppError::NotFound(msg)         => Status::not_found(msg),
            AppError::AlreadyExists(msg)    => Status::already_exists(msg),
            AppError::InvalidArgument(msg)  => Status::invalid_argument(msg),
            AppError::Database(msg)         => Status::internal(msg),
            AppError::Internal(msg)         => Status::internal(msg),
        }
    }
}

impl From<mongodb::error::Error> for AppError {
    fn from(err: mongodb::error::Error) -> Self {
        AppError::Database(err.to_string())
    }
}