use common::Config;
use mongodb::{Client, options::ClientOptions};
use proto_gen::topic::topic_service_server::TopicServiceServer;
use tonic::transport::Server;
use tonic_web::GrpcWebLayer;
use tower_http::cors::{CorsLayer, Any};
use http::header::{AUTHORIZATION, CONTENT_TYPE, HeaderName};
use tracing::info;

mod handlers;
mod models;
mod server;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt()
        .with_env_filter("info")
        .init();

    let config = Config::from_env();

    let client_options = ClientOptions::parse(&config.mongo_uri).await?;
    let client = Client::with_options(client_options)?;
    let db     = client.database(&config.mongo_db_name);

    info!("Conectado a MongoDB Atlas: {}", config.mongo_db_name);

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_headers([
            AUTHORIZATION,
            CONTENT_TYPE,
            HeaderName::from_static("x-grpc-web"),
            HeaderName::from_static("x-user-agent"),
        ])
        .allow_methods(Any);

    let addr = "0.0.0.0:50052".parse()?;
    let topic_service = server::TopicServiceImpl::new(&db, config);

    info!("Topic Service escuchando en {}", addr);

    Server::builder()
        .accept_http1(true)
        .layer(cors)
        .layer(GrpcWebLayer::new())
        .add_service(TopicServiceServer::new(topic_service))
        .serve(addr)
        .await?;

    Ok(())
}