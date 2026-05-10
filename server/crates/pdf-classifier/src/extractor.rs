use anyhow::Result;
use regex::Regex;
use unicode_normalization::UnicodeNormalization;

/// Extrae el texto completo de un PDF en bytes
pub fn extract_text_from_pdf(pdf_bytes: &[u8]) -> Result<String> {
    let text = pdf_extract::extract_text_from_mem(pdf_bytes)
        .map_err(|e| anyhow::anyhow!("Error extrayendo texto del PDF: {}", e))?;
    Ok(text)
}

/// Extrae keywords del texto limpiando stopwords y normalizando
pub fn extract_keywords(pdf_bytes: &[u8]) -> Result<Vec<String>> {
    let text = extract_text_from_pdf(pdf_bytes)?;
    let keywords = process_text(&text);
    Ok(keywords)
}

fn process_text(text: &str) -> Vec<String> {
    // Normalizar unicode y pasar a minúsculas
    let normalized: String = text.nfc().collect::<String>().to_lowercase();

    // Solo letras y espacios
    let re = Regex::new(r"[^a-záéíóúüñ\s]").unwrap();
    let clean = re.replace_all(&normalized, " ");

    // Filtrar stopwords y palabras cortas
    let stopwords = stopwords();
    clean
        .split_whitespace()
        .filter(|w| w.len() > 3)
        .filter(|w| !stopwords.contains(&w.to_string()))
        .map(|w| w.to_string())
        .collect::<std::collections::HashSet<String>>()
        .into_iter()
        .collect()
}

fn stopwords() -> std::collections::HashSet<String> {
    vec![
        "para", "como", "este", "esta", "estos", "estas",
        "that", "this", "with", "from", "have", "been",
        "which", "their", "there", "where", "when", "then",
        "also", "more", "than", "into", "over", "after",
        "about", "such", "each", "they", "will", "some",
        "were", "what", "your", "them", "these", "other",
    ]
    .into_iter()
    .map(|s| s.to_string())
    .collect()
}