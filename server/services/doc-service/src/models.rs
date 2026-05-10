use chrono::{DateTime, Utc};
use mongodb::bson::oid::ObjectId;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DocumentRecord {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id:          Option<ObjectId>,
    pub user_id:     String,
    pub filename:    String,
    pub topic_id:    String,
    pub topic_name:  String,
    pub gridfs_id:   String,
    pub keywords:    Vec<String>,
    pub uploaded_at: DateTime<Utc>,
}

impl DocumentRecord {
    pub fn new(
        user_id:    String,
        filename:   String,
        topic_id:   String,
        topic_name: String,
        gridfs_id:  String,
        keywords:   Vec<String>,
    ) -> Self {
        Self {
            id: None,
            user_id,
            filename,
            topic_id,
            topic_name,
            gridfs_id,
            keywords,
            uploaded_at: Utc::now(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TopicDocument {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id:       Option<ObjectId>,
    pub name:     String,
    pub user_id:  String,
    pub keywords: Vec<String>,
}