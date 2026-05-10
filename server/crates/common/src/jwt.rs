use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use crate::error::AppError;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub:  String,
    pub role: String,
    pub exp:  usize,
    pub iat:  usize,
}

pub fn create_token(
    user_id:    &str,
    role:       &str,
    secret:     &str,
    expiration: i64,
) -> Result<String, AppError> {
    let now        = Utc::now();
    let expiration = now + Duration::seconds(expiration);

    let claims = Claims {
        sub:  user_id.to_string(),
        role: role.to_string(),
        exp:  expiration.timestamp() as usize,
        iat:  now.timestamp() as usize,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .map_err(|e| AppError::Internal(e.to_string()))
}

pub fn validate_token(token: &str, secret: &str) -> Result<Claims, AppError> {
    decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::default(),
    )
    .map(|data| data.claims)
    .map_err(|e| AppError::Unauthenticated(e.to_string()))
}