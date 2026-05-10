use bcrypt::{hash, DEFAULT_COST};
use common::{AppError, Config};
use futures::TryStreamExt;
use mongodb::{bson::doc, Collection, Database};
use proto_gen::admin::{
    AdminDeleteTopicRequest, AdminResponse, AdminTopic,
    CreateUserRequest, DeleteUserRequest,
    ListAllTopicsRequest, ListAllTopicsResponse,
    ListUsersRequest, ListUsersResponse,
    UpdateUserRequest, User,
};
use tonic::{Request, Response, Status};
use tracing::info;

use crate::models::{DocumentRecord, TopicDocument, UserDocument};

pub struct AdminHandler {
    pub users:     Collection<UserDocument>,
    pub topics:    Collection<TopicDocument>,
    pub documents: Collection<DocumentRecord>,
    pub config:    Config,
}

impl AdminHandler {
    pub fn new(db: &Database, config: Config) -> Self {
        Self {
            users:     db.collection("users"),
            topics:    db.collection("topics"),
            documents: db.collection("documents"),
            config,
        }
    }

    pub async fn create_user(
        &self,
        req: Request<CreateUserRequest>,
    ) -> Result<Response<AdminResponse>, Status> {
        let req = req.into_inner();

        if req.username.is_empty() || req.password.is_empty() || req.email.is_empty() {
            return Err(AppError::InvalidArgument(
                "username, password y email son requeridos".to_string(),
            ).into());
        }

        let existing = self
            .users
            .find_one(doc! { "username": &req.username })
            .await
            .map_err(AppError::from)?;

        if existing.is_some() {
            return Err(AppError::AlreadyExists(
                format!("El usuario '{}' ya existe", req.username),
            ).into());
        }

        let hashed = hash(&req.password, DEFAULT_COST)
            .map_err(|e| AppError::Internal(e.to_string()))?;

        let role = if req.role.is_empty() { "user".to_string() } else { req.role.clone() };

        let user = UserDocument {
            id:         None,
            username:   req.username.clone(),
            password:   hashed,
            email:      req.email.clone(),
            role,
            created_at: chrono::Utc::now(),
        };

        self.users.insert_one(&user).await.map_err(AppError::from)?;

        info!("Admin creó usuario: {}", req.username);

        Ok(Response::new(AdminResponse {
            success: true,
            message: format!("Usuario '{}' creado exitosamente", req.username),
        }))
    }

    pub async fn delete_user(
        &self,
        req: Request<DeleteUserRequest>,
    ) -> Result<Response<AdminResponse>, Status> {
        let req = req.into_inner();

        let user_oid = mongodb::bson::oid::ObjectId::parse_str(&req.user_id)
            .map_err(|_| AppError::InvalidArgument("user_id inválido".to_string()))?;

        let user = self
            .users
            .find_one(doc! { "_id": user_oid })
            .await
            .map_err(AppError::from)?
            .ok_or_else(|| AppError::NotFound("Usuario no encontrado".to_string()))?;

        // El admin no puede eliminarse a sí mismo
        if req.user_id == req.requesting_user_id {
            return Err(AppError::PermissionDenied(
                "No puedes eliminarte a ti mismo".to_string(),
            ).into());
        }

        // Eliminar documentos, temáticas y usuario
        self.documents
            .delete_many(doc! { "user_id": &req.user_id })
            .await
            .map_err(AppError::from)?;

        self.topics
            .delete_many(doc! { "user_id": &req.user_id })
            .await
            .map_err(AppError::from)?;

        self.users
            .delete_one(doc! { "_id": user_oid })
            .await
            .map_err(AppError::from)?;

        info!("Admin eliminó usuario: {} ({})", user.username, req.user_id);

        Ok(Response::new(AdminResponse {
            success: true,
            message: format!("Usuario '{}' eliminado exitosamente", user.username),
        }))
    }

    pub async fn update_user(
        &self,
        req: Request<UpdateUserRequest>,
    ) -> Result<Response<AdminResponse>, Status> {
        let req = req.into_inner();

        let user_oid = mongodb::bson::oid::ObjectId::parse_str(&req.user_id)
            .map_err(|_| AppError::InvalidArgument("user_id inválido".to_string()))?;

        self.users
            .find_one(doc! { "_id": user_oid })
            .await
            .map_err(AppError::from)?
            .ok_or_else(|| AppError::NotFound("Usuario no encontrado".to_string()))?;

        let mut update = doc! {};

        if !req.new_username.is_empty() {
            let taken = self
                .users
                .find_one(doc! { "username": &req.new_username })
                .await
                .map_err(AppError::from)?;

            if taken.is_some() {
                return Err(AppError::AlreadyExists(
                    format!("El username '{}' ya está en uso", req.new_username),
                ).into());
            }
            update.insert("username", &req.new_username);
        }

        if !req.new_password.is_empty() {
            let hashed = hash(&req.new_password, DEFAULT_COST)
                .map_err(|e| AppError::Internal(e.to_string()))?;
            update.insert("password", hashed);
        }

        if update.is_empty() {
            return Err(AppError::InvalidArgument(
                "No hay campos para actualizar".to_string(),
            ).into());
        }

        self.users
            .update_one(doc! { "_id": user_oid }, doc! { "$set": update })
            .await
            .map_err(AppError::from)?;

        info!("Admin actualizó usuario: {}", req.user_id);

        Ok(Response::new(AdminResponse {
            success: true,
            message: "Usuario actualizado exitosamente".to_string(),
        }))
    }

    pub async fn list_users(
        &self,
        _req: Request<ListUsersRequest>,
    ) -> Result<Response<ListUsersResponse>, Status> {
        let cursor = self.users.find(doc! {}).await.map_err(AppError::from)?;

        let user_docs: Vec<UserDocument> = cursor
            .try_collect()
            .await
            .map_err(AppError::from)?;

        let users: Vec<User> = user_docs
            .into_iter()
            .map(|u| User {
                user_id:    u.id.unwrap().to_hex(),
                username:   u.username,
                email:      u.email,
                role:       u.role,
                created_at: u.created_at.to_rfc3339(),
            })
            .collect();

        Ok(Response::new(ListUsersResponse { users }))
    }

    pub async fn delete_topic(
        &self,
        req: Request<AdminDeleteTopicRequest>,
    ) -> Result<Response<AdminResponse>, Status> {
        let req = req.into_inner();

        let topic_oid = mongodb::bson::oid::ObjectId::parse_str(&req.topic_id)
            .map_err(|_| AppError::InvalidArgument("topic_id inválido".to_string()))?;

        let topic = self
            .topics
            .find_one(doc! { "_id": topic_oid })
            .await
            .map_err(AppError::from)?
            .ok_or_else(|| AppError::NotFound("Temática no encontrada".to_string()))?;

        // Contar documentos afectados
        let docs_count = self
            .documents
            .count_documents(doc! { "topic_id": &req.topic_id })
            .await
            .map_err(AppError::from)?;

        // Mover documentos a General
        if docs_count > 0 {
            self.documents
                .update_many(
                    doc! { "topic_id": &req.topic_id },
                    doc! { "$set": { "topic_id": "general", "topic_name": "General" }},
                )
                .await
                .map_err(AppError::from)?;
        }

        // Contar y eliminar subtemáticas
        let subtopics_count = self
            .topics
            .count_documents(doc! { "parent_id": &req.topic_id })
            .await
            .map_err(AppError::from)?;

        if subtopics_count > 0 {
            // Mover documentos de subtemáticas a General también
            let sub_cursor = self
                .topics
                .find(doc! { "parent_id": &req.topic_id })
                .await
                .map_err(AppError::from)?;

            let subtopics: Vec<crate::models::TopicDocument> = sub_cursor
                .try_collect()
                .await
                .map_err(AppError::from)?;

            for sub in &subtopics {
                let sub_id = sub.id.as_ref().unwrap().to_hex();
                self.documents
                    .update_many(
                        doc! { "topic_id": &sub_id },
                        doc! { "$set": { "topic_id": "general", "topic_name": "General" }},
                    )
                    .await
                    .map_err(AppError::from)?;
            }

            self.topics
                .delete_many(doc! { "parent_id": &req.topic_id })
                .await
                .map_err(AppError::from)?;
        }

        // Eliminar temática principal
        self.topics
            .delete_one(doc! { "_id": topic_oid })
            .await
            .map_err(AppError::from)?;

        info!("Admin eliminó temática: {} con {} docs y {} subtemas", 
            topic.name, docs_count, subtopics_count);

        Ok(Response::new(AdminResponse {
            success: true,
            message: format!(
                "Temática '{}' eliminada. {} documento(s) movido(s) a Sin clasificar.",
                topic.name, docs_count + subtopics_count
            ),
        }))
    }

    pub async fn list_all_topics(
        &self,
        req: Request<ListAllTopicsRequest>,
    ) -> Result<Response<ListAllTopicsResponse>, Status> {
        let req = req.into_inner();

        let filter = if req.user_id.is_empty() {
            doc! {}
        } else {
            doc! { "user_id": &req.user_id }
        };

        let cursor = self.topics.find(filter).await.map_err(AppError::from)?;

        let topic_docs: Vec<TopicDocument> = cursor
            .try_collect()
            .await
            .map_err(AppError::from)?;

        let mut topics: Vec<AdminTopic> = vec![];

        for t in topic_docs {
            let topic_id = t.id.as_ref().unwrap().to_hex();
            let user = self
                .users
                .find_one(doc! { "_id": mongodb::bson::oid::ObjectId::parse_str(&t.user_id).unwrap_or_default() })
                .await
                .map_err(AppError::from)?;

            let username = user.map(|u| u.username).unwrap_or_else(|| "Desconocido".to_string());

            topics.push(AdminTopic {
                topic_id,
                name:      t.name,
                user_id:   t.user_id,
                username,
                parent_id: t.parent_id.unwrap_or_default(),
            });
        }

        Ok(Response::new(ListAllTopicsResponse { topics }))
    }
}