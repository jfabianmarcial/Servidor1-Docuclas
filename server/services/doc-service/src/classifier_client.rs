use anyhow::Result;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
pub struct TopicInput {
    pub id:       String,
    pub name:     String,
    pub keywords: Vec<String>,
}

#[derive(Debug, Serialize)]
pub struct ClassifyRequest {
    pub text:   String,
    pub topics: Vec<TopicInput>,
}

#[derive(Debug, Deserialize)]
pub struct ClassifyResponse {
    pub topic_id:   Option<String>,
    pub topic_name: String,
    pub score:      f32,
}

pub async fn classify_document(
    text:   &str,
    topics: Vec<TopicInput>,
) -> Result<ClassifyResponse> {
    let client = reqwest::Client::new();

    let req = ClassifyRequest {
        text:   text.to_string(),
        topics,
    };

    let response = client
        .post("http://localhost:8090/classify")
        .json(&req)
        .send()
        .await?
        .json::<ClassifyResponse>()
        .await?;

    Ok(response)
}