# DocuClas — Sistema Distribuido de Clasificación de Documentos Científicos

Sistema distribuido para clasificar y recuperar documentos científicos mediante palabras clave, construido con Rust (gRPC), Python (sentence-transformers) y React.

## Arquitectura
Frontend (Vercel/Local)
↓
Cloudflare Load Balancer
↓         ↓         ↓
Servidor 1  Servidor 2  Servidor 3
(Render)    (Render)    (Render)
↓         ↓         ↓
MongoDB Atlas (3 nodos)
+
Clasificador (Hugging Face)

## Tecnologías

| Componente | Tecnología |
|------------|-----------|
| Servicios backend | Rust + gRPC (tonic) |
| Gateway | Envoy Proxy |
| Clasificador | Python + FastAPI + sentence-transformers |
| Base de datos | MongoDB Atlas (Replica Set 3 nodos) |
| Frontend | React + TypeScript + gRPC-Web |

## Requisitos previos

- Cuenta en [Render](https://render.com) (gratis)
- Acceso al repositorio de GitHub
- Variables de entorno (solicitarlas al equipo)

## Despliegue en Render

### Paso 1 — Crear cuenta en Render
Ve a https://render.com y regístrate con GitHub.

### Paso 2 — Crear nuevo servicio
1. Clic en **New** → **Web Service**
2. Conecta el repositorio `docuclas`
3. Configura:
   - **Name:** `servidorX-docuclas` (X = número de tu servidor)
   - **Root Directory:** `.`
   - **Environment:** `Docker`
   - **Dockerfile Path:** `./Dockerfile`
   - **Plan:** `Free`

### Paso 3 — Variables de entorno
En la sección **Environment** agrega:

| Variable | Valor |
|----------|-------|
| `MONGO_URI` | Solicitar al equipo |
| `MONGO_DB_NAME` | `scidocs` |
| `JWT_SECRET` | Solicitar al equipo |
| `JWT_EXPIRATION` | `86400` |
| `CLASSIFIER_URL` | `https://jofanmg-docuclas-classifier.hf.space` |

### Paso 4 — Crear servicio
Clic en **Create Web Service** y espera ~10 minutos a que compile.

### Paso 5 — Verificar
En los logs deberías ver:
INFO auth_service: Conectado a MongoDB Atlas: scidocs
INFO auth_service: Auth Service escuchando en 0.0.0.0:50051
INFO topic_service: Conectado a MongoDB Atlas: scidocs
INFO topic_service: Topic Service escuchando en 0.0.0.0:50052
INFO doc_service: Conectado a MongoDB Atlas: scidocs
INFO doc_service: Doc Service escuchando en 0.0.0.0:50053
INFO admin_service: Conectado a MongoDB Atlas: scidocs
INFO admin_service: Admin Service escuchando en 0.0.0.0:50054

## Desarrollo local

### Requisitos
- Rust 1.95+
- Python 3.11+
- protoc
- Docker Desktop

### Configurar variables de entorno
Copia el archivo de ejemplo:
```bash
cp server/.env.example server/.env
```
Edita `server/.env` con los valores correctos.

### Levantar todo con un comando
```powershell
cd C:\ruta\del\proyecto
.\start.ps1
```

O manualmente en terminales separadas:

**Terminal 1 — Auth Service:**
```bash
cd server
cargo run -p auth-service
```

**Terminal 2 — Topic Service:**
```bash
cd server
cargo run -p topic-service
```

**Terminal 3 — Doc Service:**
```bash
cd server
cargo run -p doc-service
```

**Terminal 4 — Admin Service:**
```bash
cd server
cargo run -p admin-service
```

**Terminal 5 — Clasificador:**
```bash
cd classifier
venv\Scripts\activate
uvicorn main:app --host 0.0.0.0 --port 8090 --reload
```

**Terminal 6 — Envoy Gateway:**
```bash
cd gateway
docker-compose up
```

**Terminal 7 — Frontend:**
```bash
cd client
npm run dev
```

## Estructura del proyecto
DocuClas/
├── server/                 ← Servicios gRPC en Rust
│   ├── crates/
│   │   ├── common/         ← JWT, config, errores
│   │   ├── proto-gen/      ← Código generado desde .proto
│   │   └── pdf-classifier/ ← Extracción de keywords
│   ├── services/
│   │   ├── auth-service/   ← Puerto 50051
│   │   ├── topic-service/  ← Puerto 50052
│   │   ├── doc-service/    ← Puerto 50053
│   │   └── admin-service/  ← Puerto 50054
│   └── proto/              ← Definiciones gRPC
├── client/                 ← Frontend React + TypeScript
├── classifier/             ← Microservicio Python
├── gateway/                ← Configuración Envoy
├── database/               ← Configuración MongoDB
├── Dockerfile              ← Imagen Docker unificada
└── start.ps1               ← Script para desarrollo local

## Perfiles de usuario

### Administrador
- Dar de alta/baja usuarios
- Modificar usuarios
- Eliminar temáticas de cualquier usuario
- Ver todos los usuarios y temáticas

### Usuario
- Registrarse e iniciar sesión
- Crear temáticas y subtemáticas (máx. 2 niveles)
- Subir documentos PDF (clasificación automática)
- Descargar y eliminar documentos
- Filtrar documentos por temática/subtemática

## Tolerancia a fallas

- **MongoDB Atlas** — Replica set de 3 nodos con failover automático
- **Múltiples servidores** — Si cae un servidor los otros siguen funcionando
- **Clasificador** — Si falla, los documentos se clasifican en "Sin clasificar"

## Equipo
- Servidor 1: [URL de Render]
- Servidor 2: [URL de Render]
- Servidor 3: [URL de Render]
- Clasificador: https://jofanmg-docuclas-classifier.hf.space
- Base de datos: MongoDB Atlas (us-east-1)