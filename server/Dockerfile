FROM rust:1.95 as builder

WORKDIR /app

# Copiar workspace
COPY Cargo.toml .
COPY crates/ crates/
COPY services/ services/
COPY proto/ proto/

# Instalar protoc
RUN apt-get update && apt-get install -y protobuf-compiler

# Compilar todos los servicios
RUN cargo build --release

# Imagen final ligera
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    libssl3 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar binarios compilados
COPY --from=builder /app/target/release/auth-service .
COPY --from=builder /app/target/release/topic-service .
COPY --from=builder /app/target/release/doc-service .
COPY --from=builder /app/target/release/admin-service .

# Por defecto corre auth-service
# Se sobreescribe con la variable SERVICE_NAME
CMD ["./auth-service"]