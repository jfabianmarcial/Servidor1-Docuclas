
/// Representa una temática con sus keywords asociadas
#[derive(Debug, Clone)]
pub struct Topic {
    pub id:       String,
    pub name:     String,
    pub keywords: Vec<String>,
}

/// Clasifica un documento comparando sus keywords con las temáticas del usuario.
/// Retorna el topic_id que más coincidencias tenga.
/// Si no hay coincidencias retorna None (se asignará a "General").
pub fn classify_document(
    doc_keywords: &[String],
    topics:       &[Topic],
) -> Option<String> {
    if topics.is_empty() || doc_keywords.is_empty() {
        return None;
    }

    let doc_set: std::collections::HashSet<String> = doc_keywords
        .iter()
        .map(|k| k.to_lowercase())
        .collect();

    let mut best_match: Option<(String, usize)> = None;

    for topic in topics {
        let topic_keywords: std::collections::HashSet<String> = topic
            .keywords
            .iter()
            .map(|k| k.to_lowercase())
            .collect();

        let matches = doc_set.intersection(&topic_keywords).count();

        if matches > 0 {
            match &best_match {
                None => {
                    best_match = Some((topic.id.clone(), matches));
                }
                Some((_, best_count)) => {
                    if matches > *best_count {
                        best_match = Some((topic.id.clone(), matches));
                    }
                }
            }
        }
    }

    best_match.map(|(id, _)| id)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_classify_finds_best_match() {
        let topics = vec![
            Topic {
                id:       "1".to_string(),
                name:     "Redes".to_string(),
                keywords: vec!["protocolo".to_string(), "tcp".to_string(), "router".to_string()],
            },
            Topic {
                id:       "2".to_string(),
                name:     "Sistemas Operativos".to_string(),
                keywords: vec!["kernel".to_string(), "proceso".to_string(), "memoria".to_string()],
            },
        ];

        let doc_keywords = vec![
            "protocolo".to_string(),
            "tcp".to_string(),
            "kernel".to_string(),
        ];

        let result = classify_document(&doc_keywords, &topics);
        assert_eq!(result, Some("1".to_string()));
    }

    #[test]
    fn test_classify_returns_none_when_no_match() {
        let topics = vec![Topic {
            id:       "1".to_string(),
            name:     "Redes".to_string(),
            keywords: vec!["protocolo".to_string()],
        }];

        let doc_keywords = vec!["electronica".to_string(), "circuito".to_string()];
        let result = classify_document(&doc_keywords, &topics);
        assert_eq!(result, None);
    }
}