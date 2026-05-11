use common::Config;
use mongodb::{Client, options::ClientOptions};
use proto_gen::admin::admin_service_server::AdminServiceServer;
use tonic::transport::Server;
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

    let addr = "0.0.0.0:50054".parse()?;
    let admin_service = server::AdminServiceImpl::new(&db, config);

    info!("Admin Service escuchando en {}", addr);

    Server::builder()
        .add_service(AdminServiceServer::new(admin_service))
        .serve(addr)
        .await?;

    Ok(())
}