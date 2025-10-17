import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { createAIService } from "./services/aiService";
import { registerRoutes } from "./routes";
import { config } from "./config/env";
import { corsConfig } from "./config/cors";
import { logRequest } from "./middleware/logger";
import { handleError } from "./middleware/errorHandler";
import { logger } from "./utils/logger";

// Crear instancia del servicio de IA
let aiService: ReturnType<typeof createAIService> | null = null;

try {
  aiService = createAIService();
  logger.info("Servicio de IA inicializado correctamente");
} catch (error) {
  logger.error("Error al inicializar el servicio de IA", error);
  logger.warn("Asegúrate de configurar AI_API_KEY en el archivo .env");
}

// Rate limiter store: IP -> array de timestamps de peticiones
interface RateLimitStore {
  [key: string]: number[];
}

const rateLimitStore: RateLimitStore = {};
const REQUESTS_PER_MINUTE = 6;
const WINDOW_MS = 60 * 1000; // 1 minuto en milisegundos

/**
 * Obtiene la IP del cliente desde la request
 */
function getClientIp(request: any): string {
  return (
    request.headers?.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers?.get("x-real-ip") ||
    request.ip ||
    "unknown"
  );
}

/**
 * Middleware de rate limiting
 */
function rateLimiterMiddleware(context: any) {
  // Solo aplicar rate limit al endpoint de generación de ideas
  if (!context.request?.url?.includes("/api/generate-ideas")) {
    return;
  }

  const ip = getClientIp(context.request);
  const now = Date.now();

  // Inicializar el array de timestamps si no existe
  if (!rateLimitStore[ip]) {
    rateLimitStore[ip] = [];
  }

  // Limpiar timestamps fuera de la ventana de tiempo
  rateLimitStore[ip] = rateLimitStore[ip].filter((timestamp) => now - timestamp < WINDOW_MS);

  // Verificar si se ha excedido el límite
  if (rateLimitStore[ip].length >= REQUESTS_PER_MINUTE) {
    logger.warn(`Rate limit exceeded for IP: ${ip}`);
    throw new Error(
      `Rate limited: Has excedido el límite de ${REQUESTS_PER_MINUTE} peticiones por minuto. Intenta de nuevo en 60 segundos.`,
    );
  }

  // Registrar el nuevo timestamp
  rateLimitStore[ip].push(now);

  // Limpiar entradas antiguas del store periódicamente para evitar memory leak
  if (Object.keys(rateLimitStore).length > 1000) {
    Object.keys(rateLimitStore).forEach((key) => {
      if (rateLimitStore[key]?.length === 0) {
        delete rateLimitStore[key];
      }
    });
  }
}

// Crear aplicación Elysia
const app = new Elysia()
  // Configurar CORS
  .use(cors(corsConfig))
  // Middleware de rate limiting
  .derive(rateLimiterMiddleware)
  // Middleware de logging
  .onRequest(logRequest)
  // Middleware de manejo de errores
  .onError(handleError);

// Registrar todas las rutas
registerRoutes(app, aiService);

// Iniciar servidor
app.listen(config.port);

logger.info("=".repeat(70));
logger.info(`🚀 Servidor corriendo en http://${app.server?.hostname}:${app.server?.port}`);
logger.info("=".repeat(70));
logger.info("📍 Endpoints disponibles:");
logger.info("   GET  /                        - Información de la API");
logger.info("   GET  /api/status              - Estado del servidor");
logger.info("   POST /api/generate-ideas      - Generar ideas de negocio");
logger.info("-".repeat(70));
logger.info("🔧 Configuración:");
logger.info(`   - Puerto: ${config.port}`);
logger.info(`   - Entorno: ${config.nodeEnv}`);
logger.info(`   - Proveedor IA: ${config.aiProvider}`);
logger.info(`   - CORS: ${config.allowedOrigins.join(", ")}`);
logger.info(`   - Rate Limit: ${REQUESTS_PER_MINUTE} peticiones por minuto`);
logger.info("=".repeat(70));
