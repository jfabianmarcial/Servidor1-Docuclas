from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

app = FastAPI()

print("Cargando modelo multilingüe...")
model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
print("Modelo cargado.")


class Topic(BaseModel):
    id:       str
    name:     str
    keywords: list[str]


class ClassifyRequest(BaseModel):
    text:   str
    topics: list[Topic]


class ClassifyResponse(BaseModel):
    topic_id:   str | None
    topic_name: str
    score:      float


def build_topic_text(topic: Topic) -> str:
    parts = [topic.name]
    if topic.keywords:
        parts.extend(topic.keywords)
    return " ".join(parts)


def extract_sentences(text: str, max_sentences: int = 20) -> str:
    sentences = [s.strip() for s in text.replace('\n', '. ').split('.') if len(s.strip()) > 10]
    return ". ".join(sentences[:max_sentences])


@app.post("/classify", response_model=ClassifyResponse)
def classify(req: ClassifyRequest):
    if not req.topics or not req.text.strip():
        return ClassifyResponse(topic_id=None, topic_name="General", score=0.0)

    # Usar primeras oraciones más representativas
    text = extract_sentences(req.text)
    if not text:
        text = " ".join(req.text.split()[:200])

    # Embedding del documento
    doc_embedding = model.encode([text], convert_to_numpy=True)

    best_id    = None
    best_name  = "General"
    best_score = 0.0

    for topic in req.topics:
        topic_text     = build_topic_text(topic)
        topic_embedding = model.encode([topic_text], convert_to_numpy=True)
        score           = float(cosine_similarity(doc_embedding, topic_embedding)[0][0])

        if score > best_score:
            best_score = score
            best_id    = topic.id
            best_name  = topic.name

    # Umbral mínimo — si no supera 0.30 va a General
    if best_score < 0.30:
        return ClassifyResponse(topic_id=None, topic_name="General", score=best_score)

    return ClassifyResponse(topic_id=best_id, topic_name=best_name, score=best_score)


@app.get("/health")
def health():
    return {"status": "ok", "model": "paraphrase-multilingual-MiniLM-L12-v2"}