use dotenv::dotenv;
use std::env;

#[derive(Debug, Clone)]
pub struct Config {
    pub mongo_uri:      String,
    pub mongo_db_name:  String,
    pub jwt_secret:     String,
    pub jwt_expiration: i64,
}

impl Config {
    pub fn from_env() -> Self {
        dotenv().ok();

        Self {
            mongo_uri: env::var("MONGO_URI")
                .unwrap_or_else(|_| "mongodb://localhost:27020/?directConnection=true".to_string()),

            mongo_db_name: env::var("MONGO_DB_NAME")
                .unwrap_or_else(|_| "scidocs".to_string()),

            jwt_secret: env::var("JWT_SECRET")
                .unwrap_or_else(|_| "super_secret_key".to_string()),

            jwt_expiration: env::var("JWT_EXPIRATION")
                .unwrap_or_else(|_| "86400".to_string())
                .parse()
                .unwrap_or(86400),
        }
    }
}