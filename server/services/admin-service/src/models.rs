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

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TopicDocument {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id:        Option<ObjectId>,
    pub name:      String,
    pub user_id:   String,
    pub parent_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DocumentRecord {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id:       Option<ObjectId>,
    pub user_id:  String,
    pub filename: String,
    pub topic_id: String,
}