FROM rust:1.95 as rust-builder

WORKDIR /app/server

COPY server/Cargo.toml .
COPY server/crates/ crates/
COPY server/services/ services/
COPY server/proto/ proto/

RUN apt-get update && apt-get install -y protobuf-compiler
RUN cargo build --release

FROM envoyproxy/envoy:v1.29-latest

RUN apt-get update && apt-get install -y \
    libssl3 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=rust-builder /app/server/target/release/auth-service .
COPY --from=rust-builder /app/server/target/release/topic-service .
COPY --from=rust-builder /app/server/target/release/doc-service .
COPY --from=rust-builder /app/server/target/release/admin-service .

COPY server/start-services.sh .
COPY gateway/envoy-internal.yaml /etc/envoy/envoy.yaml

RUN chmod +x start-services.sh

EXPOSE 8080

CMD ["./start-services.sh"]