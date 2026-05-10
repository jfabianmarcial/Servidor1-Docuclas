use chrono::{DateTime, Utc};
use mongodb::bson::oid::ObjectId;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UserDocument {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id:         Option<ObjectId>,
    pub username:   String,
    pub password:   String,
    pub email:      String,
    pub role:       String,
    pub created_at: DateTime<Utc>,
}

impl UserDocument {
    pub fn new(username: String, password: String, email: String, role: String) -> Self {
        Self {
            id: None,
            username,
            password,
            email,
            role,
            created_at: Utc::now(),
        }
    }
}