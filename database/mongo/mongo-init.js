// Inicialización de la base de datos scidocs
db = db.getSiblingDB('scidocs');

// Crear colecciones con validación
db.createCollection('users', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['username', 'password', 'email', 'role', 'created_at'],
            properties: {
                username:   { bsonType: 'string' },
                password:   { bsonType: 'string' },
                email:      { bsonType: 'string' },
                role:       { bsonType: 'string', enum: ['admin', 'user'] },
                created_at: { bsonType: 'date' }
            }
        }
    }
});

db.createCollection('topics', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['name', 'user_id', 'keywords', 'created_at'],
            properties: {
                name:       { bsonType: 'string' },
                user_id:    { bsonType: 'string' },
                parent_id:  { bsonType: ['string', 'null'] },
                keywords:   { bsonType: 'array' },
                created_at: { bsonType: 'date' }
            }
        }
    }
});

db.createCollection('documents', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['user_id', 'filename', 'topic_id', 'topic_name', 'gridfs_id', 'uploaded_at'],
            properties: {
                user_id:     { bsonType: 'string' },
                filename:    { bsonType: 'string' },
                topic_id:    { bsonType: 'string' },
                topic_name:  { bsonType: 'string' },
                gridfs_id:   { bsonType: 'string' },
                keywords:    { bsonType: 'array' },
                uploaded_at: { bsonType: 'date' }
            }
        }
    }
});

// Índices para búsquedas rápidas
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ email: 1 },    { unique: true });

db.topics.createIndex({ user_id: 1 });
db.topics.createIndex({ parent_id: 1 });
db.topics.createIndex({ user_id: 1, name: 1 });

db.documents.createIndex({ user_id: 1 });
db.documents.createIndex({ topic_id: 1 });
db.documents.createIndex({ user_id: 1, topic_id: 1 });

// Crear usuario administrador por defecto
db.users.insertOne({
    username:   'admin',
    password:   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4oZ3B6pQoS',
    email:      'admin@scidocs.com',
    role:       'admin',
    created_at: new Date()
});

print('Base de datos scidocs inicializada correctamente');
print('Usuario admin creado con password: admin123');