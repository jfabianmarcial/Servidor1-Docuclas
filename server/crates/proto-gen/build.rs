fn main() -> Result<(), Box<dyn std::error::Error>> {
    tonic_build::configure()
        .build_server(true)
        .build_client(true)
        .compile_protos(
            &[
                "../../proto/auth.proto",
                "../../proto/topic.proto",
                "../../proto/document.proto",
                "../../proto/admin.proto",
            ],
            &["../../proto"],
        )?;
    Ok(())
}