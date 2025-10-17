# Ideas Business AI - Backend API

Backend API construido con **Bun**, **TypeScript** y **Elysia** para generar ideas de publicaciones en redes sociales usando IA (Gemini o OpenAI).

## 🚀 Características

- ⚡ **Rápido**: Construido con Bun y Elysia
- 🤖 **IA Integrada**: Soporte para Gemini y OpenAI
- 🔒 **Seguro**: Variables de entorno para API keys
- 🌐 **CORS**: Configuración flexible para frontend
- 📝 **TypeScript**: Tipado completo
- 🎯 **Simple**: API fácil de usar

## 📋 Requisitos Previos

- [Bun](https://bun.sh/) v1.0.0 o superior
- API Key de [Google Gemini](https://makersuite.google.com/app/apikey) o [OpenAI](https://platform.openai.com/api-keys)

## 🛠️ Instalación

1. **Clonar el repositorio** (si aún no lo has hecho)

2. **Instalar dependencias:**

   ```bash
   bun install
   ```

3. **Configurar variables de entorno:**

   Crea un archivo `.env` en la raíz del proyecto backend:

   ```bash
   cp .env.example .env
   ```

4. **Editar el archivo `.env`:**

   ```env
   # API Key para el servicio de IA (requerido)
   AI_API_KEY=tu_api_key_aqui

   # Proveedor de IA: "gemini" o "openai" (por defecto: gemini)
   AI_PROVIDER=gemini

   # Puerto del servidor (por defecto: 3000)
   PORT=3000

   # Entorno (development o production)
   NODE_ENV=development

   # Orígenes permitidos para CORS (separados por comas)
   ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
   ```

## 🎮 Uso

### Modo Desarrollo (con hot reload)

```bash
bun run dev
```

### Modo Producción

```bash
bun run start
```

### Verificar tipos

```bash
bun run typecheck
```

### Build

```bash
bun run build
```

## 📡 API Endpoints

### 1. **GET /** - Información de la API

Retorna información básica sobre la API.

**Respuesta:**

```json
{
  "message": "Ideas Business AI - API Backend",
  "version": "1.0.0",
  "docs": "/api/status"
}
```

### 2. **GET /api/status** - Status del servidor

Verifica que el servidor esté en línea.

**Respuesta:**

```json
{
  "status": "online",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0"
}
```

### 3. **POST /api/generate-ideas** - Generar ideas

Genera 5 ideas de publicaciones para un tipo de negocio específico.

**Request Body:**

```json
{
  "businessType": "Cafetería de especialidad"
}
```

**Validaciones:**

- `businessType` es requerido
- Debe ser un string no vacío
- Máximo 100 caracteres

**Respuesta Exitosa (200):**

```json
{
  "success": true,
  "businessType": "Cafetería de especialidad",
  "ideas": [
    {
      "categoria": "consejo útil",
      "formato_sugerido": "Reel de 15s",
      "titulo_gancho": "El secreto del café perfecto",
      "descripcion_ejecucion": "Muestra en cámara rápida el proceso de preparación del café: molienda, temperatura del agua, y tiempo de extracción. CTA: Comparte tu método favorito en comentarios."
    },
    {
      "categoria": "pregunta interactiva",
      "formato_sugerido": "Story con encuesta",
      "titulo_gancho": "¿Cuál es tu café favorito?",
      "descripcion_ejecucion": "Crea una encuesta entre Cappuccino vs Americano con fotos atractivas de ambos. Comparte los resultados al día siguiente con un dato curioso sobre el ganador. CTA: Vota y etiqueta a tu compañero cafetero."
    },
    {
      "categoria": "promoción especial",
      "formato_sugerido": "Carrusel de 3 imágenes",
      "titulo_gancho": "2x1 en Lattes este finde",
      "descripcion_ejecucion": "Imagen 1: Oferta destacada con precio, Imagen 2: Variedad de lattes disponibles, Imagen 3: Horario y condiciones. CTA: Guarda este post y trae a un amigo."
    },
    {
      "categoria": "contenido educativo",
      "formato_sugerido": "Post estático con infografía",
      "titulo_gancho": "Diferencias: Lavado vs Natural",
      "descripcion_ejecucion": "Explica con una infografía simple cómo el proceso de café lavado y natural afecta el sabor. Usa íconos visuales y colores diferenciados. CTA: Link en bio para artículo completo."
    },
    {
      "categoria": "detrás de cámaras",
      "formato_sugerido": "Video en vivo de 10 min",
      "titulo_gancho": "Un día en la vida de tu barista",
      "descripcion_ejecucion": "Transmite en vivo tu rutina matinal: preparación del espacio, prueba de granos del día, y primeros clientes. Responde preguntas sobre café en tiempo real. CTA: Pregunta cualquier cosa sobre café."
    }
  ]
}
```

**Respuesta de Error (400):**

```json
{
  "success": false,
  "error": "Bad Request",
  "message": "El campo 'businessType' es requerido y debe ser un string"
}
```

**Respuesta de Error (500):**

```json
{
  "success": false,
  "error": "Internal Server Error",
  "message": "Error al generar ideas"
}
```

**Respuesta de Error (503):**

```json
{
  "success": false,
  "error": "Service Unavailable",
  "message": "El servicio de IA no está configurado correctamente"
}
```

## 🧪 Ejemplos de uso

### Con cURL

```bash
curl -X POST http://localhost:3000/api/generate-ideas \
  -H "Content-Type: application/json" \
  -d '{"businessType": "Tienda de ropa vintage"}'
```

### Con JavaScript (fetch)

```javascript
const response = await fetch("http://localhost:3000/api/generate-ideas", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    businessType: "Panadería artesanal",
  }),
});

const data = await response.json();
console.log(data.ideas);
```

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── config/               # Configuración centralizada
│   │   ├── env.ts           # Variables de entorno
│   │   └── cors.ts          # Configuración de CORS
│   ├── controllers/          # Lógica de negocio
│   │   ├── healthController.ts    # Health checks y status
│   │   └── ideasController.ts     # Generación de ideas
│   ├── middleware/           # Funciones intermedias
│   │   ├── errorHandler.ts  # Manejo centralizado de errores
│   │   ├── logger.ts        # Logging de requests
│   │   └── validation.ts    # Validaciones de datos
│   ├── routes/              # Definición de rutas
│   │   ├── index.ts         # Centralizador de rutas
│   │   ├── healthRoutes.ts  # Rutas de health/status
│   │   └── ideasRoutes.ts   # Rutas de ideas
│   ├── services/            # Servicios externos
│   │   └── aiService.ts     # Integración con IA (Gemini/OpenAI)
│   ├── types/               # Definiciones de tipos TypeScript
│   │   └── index.ts         # Tipos e interfaces
│   └── index.ts             # Punto de entrada principal
├── .env                     # Variables de entorno (no committed)
├── .env.example             # Ejemplo de variables de entorno
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

### Arquitectura

El backend sigue una **arquitectura en capas** con separación de responsabilidades:

- **Config**: Configuración centralizada y variables de entorno
- **Routes**: Definición de endpoints HTTP
- **Controllers**: Lógica de negocio de cada dominio
- **Middleware**: Funciones intermedias (logging, validación, errores)
- **Services**: Integración con servicios externos (APIs de IA)
- **Types**: Definiciones de tipos TypeScript compartidos

## 🔧 Configuración de Proveedores de IA

### Gemini (Google)

1. Obtén tu API key en: https://makersuite.google.com/app/apikey
2. En `.env` configura:
   ```env
   AI_API_KEY=tu_api_key_de_gemini
   AI_PROVIDER=gemini
   ```

### OpenAI

1. Obtén tu API key en: https://platform.openai.com/api-keys
2. En `.env` configura:
   ```env
   AI_API_KEY=tu_api_key_de_openai
   AI_PROVIDER=openai
   ```

## 🐛 Solución de Problemas

### Error: "AI_API_KEY no está configurada"

- Asegúrate de haber creado el archivo `.env`
- Verifica que la variable `AI_API_KEY` esté configurada correctamente

### Error: CORS

- Verifica que tu frontend esté en uno de los orígenes permitidos en `ALLOWED_ORIGINS`
- Asegúrate de separar múltiples orígenes con comas

### Error al llamar a la API de IA

- Verifica que tu API key sea válida
- Revisa los logs del servidor para más detalles
- Asegúrate de tener créditos disponibles en tu cuenta de IA

## 🚀 Deploy

### Variables de entorno en producción

Asegúrate de configurar estas variables en tu plataforma de hosting:

- `AI_API_KEY`
- `AI_PROVIDER`
- `PORT`
- `NODE_ENV=production`
- `ALLOWED_ORIGINS`

## 📝 Licencia

MIT

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request.
