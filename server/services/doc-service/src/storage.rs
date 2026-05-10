use anyhow::Result;
use futures::AsyncWriteExt;
use futures::AsyncReadExt;
use mongodb::{
    bson::oid::ObjectId,
    gridfs::GridFsBucket,
    Database,
};
use tracing::info;

pub struct GridFsStorage {
    bucket: GridFsBucket,
}

impl GridFsStorage {
    pub fn new(db: &Database) -> Self {
        let bucket = db.gridfs_bucket(None);
        Self { bucket }
    }

    pub async fn upload(&self, filename: &str, data: &[u8]) -> Result<String> {
        let mut upload_stream = self.bucket.open_upload_stream(filename).await?;

        upload_stream.write_all(data).await?;
        upload_stream.close().await?;

        let file_id = upload_stream.id().as_object_id()
            .ok_or_else(|| anyhow::anyhow!("Error obteniendo ID de GridFS"))?
            .to_hex();

        info!("Archivo subido a GridFS: {} -> {}", filename, file_id);
        Ok(file_id)
    }

    pub async fn download(&self, file_id: &str) -> Result<Vec<u8>> {
        let oid = ObjectId::parse_str(file_id)
            .map_err(|_| anyhow::anyhow!("file_id inválido"))?;

        let mut download_stream = self.bucket
            .open_download_stream(mongodb::bson::Bson::ObjectId(oid))
            .await?;

        let mut buffer = Vec::new();
        download_stream.read_to_end(&mut buffer).await?;

        info!("Archivo descargado de GridFS: {}", file_id);
        Ok(buffer)
    }

    pub async fn delete(&self, file_id: &str) -> Result<()> {
        let oid = ObjectId::parse_str(file_id)
            .map_err(|_| anyhow::anyhow!("file_id inválido"))?;

        self.bucket.delete(mongodb::bson::Bson::ObjectId(oid)).await?;
        info!("Archivo eliminado de GridFS: {}", file_id);
        Ok(())
    }
}