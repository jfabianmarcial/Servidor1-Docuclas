FROM rust:1.95 as rust-builder

WORKDIR /app/server

COPY server/Cargo.toml .
COPY server/crates/ crates/
COPY server/services/ services/
COPY server/proto/ proto/

RUN apt-get update && apt-get install -y protobuf-compiler

RUN cargo build --release

FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    libssl3 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=rust-builder /app/server/target/release/auth-service .
COPY --from=rust-builder /app/server/target/release/topic-service .
COPY --from=rust-builder /app/server/target/release/doc-service .
COPY --from=rust-builder /app/server/target/release/admin-service .

COPY classifier/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')"

COPY classifier/main.py .

COPY server/start-services.sh .
RUN chmod +x start-services.sh

EXPOSE 50051 50052 50053 50054 8090

CMD ["./start-services.sh"]