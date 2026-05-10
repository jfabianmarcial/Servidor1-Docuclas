use chrono::{DateTime, Utc};
use mongodb::bson::oid::ObjectId;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TopicDocument {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id:           Option<ObjectId>,
    pub name:         String,
    pub user_id:      String,
    pub parent_id:    Option<String>,
    pub keywords:     Vec<String>,
    pub created_at:   DateTime<Utc>,
}

impl TopicDocument {
    pub fn new(name: String, user_id: String, parent_id: Option<String>) -> Self {
        Self {
            id: None,
            name,
            user_id,
            parent_id,
            keywords: Vec::new(),
            created_at: Utc::now(),
        }
    }

    pub fn new_with_keywords(
        name:      String,
        user_id:   String,
        parent_id: Option<String>,
        keywords:  Vec<String>,
    ) -> Self {
        Self {
            id: None,
            name,
            user_id,
            parent_id,
            keywords,
            created_at: Utc::now(),
        }
    }
}