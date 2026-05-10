pub mod auth {
    tonic::include_proto!("auth");
}

pub mod topic {
    tonic::include_proto!("topic");
}

pub mod document {
    tonic::include_proto!("document");
}

pub mod admin {
    tonic::include_proto!("admin");
}