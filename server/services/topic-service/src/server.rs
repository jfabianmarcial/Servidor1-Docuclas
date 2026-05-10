use common::Config;
use mongodb::Database;
use proto_gen::topic::{
    topic_service_server::TopicService,
    CreateSubTopicRequest, CreateTopicRequest,
    DeleteTopicRequest, DeleteTopicResponse,
    ListTopicsRequest, ListTopicsResponse,
    TopicResponse,
};
use tonic::{Request, Response, Status};

use crate::handlers::TopicHandler;

pub struct TopicServiceImpl {
    handler: TopicHandler,
}

impl TopicServiceImpl {
    pub fn new(db: &Database, config: Config) -> Self {
        Self {
            handler: TopicHandler::new(db, config),
        }
    }
}

#[tonic::async_trait]
impl TopicService for TopicServiceImpl {
    async fn create_topic(
        &self,
        request: Request<CreateTopicRequest>,
    ) -> Result<Response<TopicResponse>, Status> {
        self.handler.create_topic(request).await
    }

    async fn create_sub_topic(
        &self,
        request: Request<CreateSubTopicRequest>,
    ) -> Result<Response<TopicResponse>, Status> {
        self.handler.create_sub_topic(request).await
    }

    async fn delete_topic(
        &self,
        request: Request<DeleteTopicRequest>,
    ) -> Result<Response<DeleteTopicResponse>, Status> {
        self.handler.delete_topic(request).await
    }

    async fn list_topics(
        &self,
        request: Request<ListTopicsRequest>,
    ) -> Result<Response<ListTopicsResponse>, Status> {
        self.handler.list_topics(request).await
    }
}