use common::Config;
use mongodb::{Client, options::ClientOptions};
use proto_gen::auth::auth_service_server::AuthServiceServer;
use tonic::transport::Server;
use tracing::info;
use std::env;

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

    let port = env::var("PORT").unwrap_or_else(|_| "50051".to_string());
    let addr = format!("0.0.0.0:{}", port).parse()?;

    let auth_service = server::AuthServiceImpl::new(&db, config);

    info!("Auth Service escuchando en {}", addr);

    Server::builder()
        .add_service(AuthServiceServer::new(auth_service))
        .serve(addr)
        .await?;

    Ok(())
}   