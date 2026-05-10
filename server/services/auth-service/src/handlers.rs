use bcrypt::{hash, verify, DEFAULT_COST};
use common::{jwt::create_token, AppError, Config};
use mongodb::{
    bson::doc,
    Collection, Database,
};
use proto_gen::auth::{
    AuthResponse, LoginRequest, RegisterRequest,
    ValidateTokenRequest, ValidateTokenResponse,
};
use tonic::{Request, Response, Status};
use tracing::info;

use crate::models::UserDocument;

pub struct AuthHandler {
    pub collection: Collection<UserDocument>,
    pub config:     Config,
}

impl AuthHandler {
    pub fn new(db: &Database, config: Config) -> Self {
        Self {
            collection: db.collection("users"),
            config,
        }
    }

    pub async fn register(
        &self,
        req: Request<RegisterRequest>,
    ) -> Result<Response<AuthResponse>, Status> {
        let req = req.into_inner();

        // Validar campos vacíos
        if req.username.is_empty() || req.password.is_empty() || req.email.is_empty() {
            return Err(AppError::InvalidArgument(
                "username, password y email son requeridos".to_string(),
            )
            .into());
        }

        // Verificar si ya existe el usuario
        let existing = self
            .collection
            .find_one(doc! { "username": &req.username })
            .await
            .map_err(AppError::from)?;

        if existing.is_some() {
            return Err(AppError::AlreadyExists(
                format!("El usuario '{}' ya existe", req.username),
            )
            .into());
        }

        // Hash de la contraseña
        let hashed = hash(&req.password, DEFAULT_COST)
            .map_err(|e| AppError::Internal(e.to_string()))?;

        // Crear documento
        let user = UserDocument::new(
            req.username.clone(),
            hashed,
            req.email.clone(),
            "user".to_string(),
        );

        let result = self
            .collection
            .insert_one(&user)
            .await
            .map_err(AppError::from)?;

        let user_id = result.inserted_id.as_object_id()
            .ok_or_else(|| AppError::Internal("Error obteniendo ID".to_string()))?
            .to_hex();

        // Generar token
        let token = create_token(
            &user_id,
            "user",
            &self.config.jwt_secret,
            self.config.jwt_expiration,
        )?;

        info!("Usuario registrado: {}", req.username);

        Ok(Response::new(AuthResponse {
            token,
            user_id,
            username: req.username,
            role: "user".to_string(),
            message: "Usuario registrado exitosamente".to_string(),
        }))
    }

    pub async fn login(
        &self,
        req: Request<LoginRequest>,
    ) -> Result<Response<AuthResponse>, Status> {
        let req = req.into_inner();

        // Buscar usuario
        let user = self
            .collection
            .find_one(doc! { "username": &req.username })
            .await
            .map_err(AppError::from)?
            .ok_or_else(|| AppError::NotFound("Usuario no encontrado".to_string()))?;

        // Verificar contraseña
        let valid = verify(&req.password, &user.password)
            .map_err(|e| AppError::Internal(e.to_string()))?;

        if !valid {
            return Err(AppError::Unauthenticated("Contraseña incorrecta".to_string()).into());
        }

        let user_id = user.id
            .ok_or_else(|| AppError::Internal("ID de usuario no encontrado".to_string()))?
            .to_hex();

        // Generar token
        let token = create_token(
            &user_id,
            &user.role,
            &self.config.jwt_secret,
            self.config.jwt_expiration,
        )?;

        info!("Login exitoso: {}", req.username);

        Ok(Response::new(AuthResponse {
            token,
            user_id,
            username: user.username,
            role: user.role,
            message: "Login exitoso".to_string(),
        }))
    }

    pub async fn validate_token(
        &self,
        req: Request<ValidateTokenRequest>,
    ) -> Result<Response<ValidateTokenResponse>, Status> {
        let token = req.into_inner().token;

        match common::jwt::validate_token(&token, &self.config.jwt_secret) {
            Ok(claims) => Ok(Response::new(ValidateTokenResponse {
                valid:   true,
                user_id: claims.sub,
                role:    claims.role,
            })),
            Err(_) => Ok(Response::new(ValidateTokenResponse {
                valid:   false,
                user_id: String::new(),
                role:    String::new(),
            })),
        }
    }
}