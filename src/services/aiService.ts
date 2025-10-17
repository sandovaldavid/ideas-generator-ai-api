import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import type { AIServiceConfig, Idea } from "../types";
import { logger } from "../utils/logger";

export class AIService {
  private geminiClient: GoogleGenAI | null = null;
  private openaiClient: OpenAI | null = null;
  private provider: "gemini" | "openai";

  constructor(config: AIServiceConfig) {
    this.provider = config.provider;

    if (this.provider === "gemini") {
      this.geminiClient = new GoogleGenAI({ apiKey: config.apiKey });
    } else if (this.provider === "openai") {
      this.openaiClient = new OpenAI({ apiKey: config.apiKey });
    }
  }

  /**
   * Construye un prompt optimizado para generar ideas de publicaciones
   */
  private buildPrompt(businessType: string): string {
    return `# [ROL]
    Actúa como "Social Media Genius", un estratega de marketing de contenidos de élite especializado en pymes. Tu superpoder es transformar conceptos de negocio en contenido viral y de alto engagement que un emprendedor con poco tiempo puede ejecutar fácilmente.

    # [CONTEXTO]
    El objetivo es proporcionar un plan de contenido listo para usar. Piensa que le estás entregando esto a "Alex", el dueño del negocio, quien necesita saber no solo "qué" publicar, sino "cómo" hacerlo de la manera más efectiva y rápida posible.

    # [TAREA]
    Genera EXACTAMENTE 6 ideas de contenido para un negocio de "${businessType}". Las ideas deben ser variadas y cubrir las siguientes categorías (una por idea, sin repetir): "consejo útil", "pregunta interactiva", "promoción especial", "contenido educativo", "detrás de cámaras" y "tendencia viral".

    # [REGLAS DE SALIDA]
    1.  **Respuesta Exclusiva en JSON:** Tu respuesta debe ser ÚNICAMENTE un objeto JSON válido, sin ningún texto, explicación o markdown antes o después.
    2.  **Estructura JSON Estricta:** El JSON debe seguir esta estructura exacta:
        {
          "ideas_de_contenido": [
            {
              "categoria": "El tipo de contenido de la lista de tareas.",
              "formato_sugerido": "El formato ideal para la plataforma (Ej: 'Reel de 15s', 'Carrusel de 3 imágenes', 'Story con encuesta', 'Video en vivo').",
              "titulo_gancho": "Un titular potente y corto (máximo 10 palabras) para captar la atención inmediatamente.",
              "descripcion_ejecucion": "Una guía breve y clara de 1-2 frases sobre cómo crear el contenido. Incluye un llamado a la acción (CTA)."
            }
          ]
        }
    3.  **Sin Texto Adicional:** No incluyas comentarios ni explicaciones fuera del objeto JSON.

    # [ENTRADA DEL USUARIO]
    ${businessType}`;
  }

  /**
   * Llama a la API de Gemini usando la librería oficial
   */
  private async callGemini(prompt: string): Promise<Idea[]> {
    const model = "gemini-2.0-flash-exp";

    if (!this.geminiClient) {
      throw new Error("Cliente de Gemini no inicializado");
    }

    try {
      const result = await this.geminiClient.models.generateContent({
        model: model,
        contents: prompt,
      });

      const text = result.text;

      if (!text) {
        throw new Error("No se recibió respuesta del modelo Gemini");
      }

      return this.parseAIResponse(text);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Gemini API Error: ${errorMessage}`);
    }
  }

  /**
   * Llama a la API de OpenAI usando la librería oficial
   */
  private async callOpenAI(prompt: string): Promise<Idea[]> {
    if (!this.openaiClient) {
      throw new Error("Cliente de OpenAI no inicializado");
    }

    const model = "gpt-4o-mini";

    try {
      const response = await this.openaiClient.chat.completions.create({
        model: model,
        messages: [
          {
            role: "system",
            content:
              "Eres un experto en marketing de redes sociales para pymes. Respondes únicamente en formato JSON válido.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.9,
        max_tokens: 1024,
      });

      const text = response.choices[0]?.message?.content;

      if (!text) {
        throw new Error("No se recibió respuesta del modelo OpenAI");
      }

      return this.parseAIResponse(text);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`OpenAI API Error: ${errorMessage}`);
    }
  }

  /**
   * Parsea la respuesta de la IA y extrae las ideas
   */
  private parseAIResponse(text: string): Idea[] {
    try {
      // Intenta extraer JSON del texto (a veces viene con markdown)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.error("No se encontró JSON en la respuesta de la IA");
        logger.debug("Respuesta recibida:", text.substring(0, 200));
        throw new Error("La respuesta de la IA no contiene JSON válido");
      }

      let parsed;
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        logger.error("Error al parsear JSON", parseError);
        logger.debug("JSON extraído:", jsonMatch[0].substring(0, 200));
        throw new Error("El JSON recibido no es válido");
      }

      // Nuevo formato: ideas_de_contenido
      if (!parsed.ideas_de_contenido || !Array.isArray(parsed.ideas_de_contenido)) {
        logger.error("Formato de respuesta inválido. Estructura recibida:", Object.keys(parsed));
        throw new Error("La respuesta no contiene el campo 'ideas_de_contenido' o no es un array");
      }

      if (parsed.ideas_de_contenido.length === 0) {
        throw new Error("La IA no generó ninguna idea");
      }

      // Valida y limpia las ideas con el nuevo formato
      return parsed.ideas_de_contenido.map((idea: any, index: number) => {
        if (
          !idea.categoria ||
          !idea.formato_sugerido ||
          !idea.titulo_gancho ||
          !idea.descripcion_ejecucion
        ) {
          logger.warn(`Idea #${index + 1} tiene campos faltantes`, idea);
        }

        return {
          categoria: idea.categoria || "Sin categoría",
          formato_sugerido: idea.formato_sugerido || "Post estándar",
          titulo_gancho: idea.titulo_gancho || "Sin título",
          descripcion_ejecucion: idea.descripcion_ejecucion || "Sin descripción",
        };
      });
    } catch (error) {
      // Si es un error que ya lanzamos, lo re-lanzamos tal cual
      if (error instanceof Error) {
        throw error;
      }

      // Error inesperado
      logger.error("Error inesperado al procesar respuesta de IA", error);
      throw new Error("Error inesperado al procesar la respuesta de la IA");
    }
  }

  /**
   * Método principal: genera ideas basadas en el tipo de negocio
   */
  async generateIdeas(businessType: string): Promise<Idea[]> {
    const prompt = this.buildPrompt(businessType);

    if (this.provider === "gemini") {
      return this.callGemini(prompt);
    } else if (this.provider === "openai") {
      return this.callOpenAI(prompt);
    } else {
      throw new Error(`Proveedor de IA no soportado: ${this.provider}`);
    }
  }
}

/**
 * Factory function para crear una instancia del servicio de IA
 */
export function createAIService(): AIService {
  const apiKey = process.env.AI_API_KEY;
  const provider = (process.env.AI_PROVIDER || "gemini") as "gemini" | "openai";

  if (!apiKey) {
    throw new Error("AI_API_KEY no está configurada en las variables de entorno");
  }

  return new AIService({ apiKey, provider });
}
