import { describe, expect, test, mock } from "bun:test";
import { AIService } from "../services/aiService";
import type { AIServiceConfig } from "../types";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

describe("AIService", () => {
  const mockConfig: AIServiceConfig = {
    apiKey: "test-api-key",
    provider: "gemini",
  };

  describe("parseAIResponse", () => {
    const service = new AIService(mockConfig);

    test("should parse valid JSON correctly", () => {
      const validJson = JSON.stringify({
        ideas_de_contenido: [
          {
            categoria: "Test Category",
            formato_sugerido: "Reel",
            titulo_gancho: "Test Hook",
            descripcion_ejecucion: "Test Description",
          },
        ],
      });
      const result = service.parseAIResponse(validJson);
      expect(result).toHaveLength(1);
      expect(result[0]!.categoria).toBe("Test Category");
    });

    test("should parse JSON wrapped in markdown", () => {
      const markdownJson = `
      Here is the response:
      \`\`\`json
      {
        "ideas_de_contenido": [
          {
            "categoria": "Test Category",
            "formato_sugerido": "Reel",
            "titulo_gancho": "Test Hook",
            "descripcion_ejecucion": "Test Description"
          }
        ]
      }
      \`\`\`
      `;
      const result = service.parseAIResponse(markdownJson);
      expect(result).toHaveLength(1);
      expect(result[0]!.categoria).toBe("Test Category");
    });

    test("should throw error for malformed JSON", () => {
      const malformedJson = "{ \u0027ideas_de_contenido\u0027: [ ... "; // Invalid JSON
      expect(() => service.parseAIResponse(malformedJson)).toThrow();
    });

    test("should throw error if \u0027ideas_de_contenido\u0027 is missing", () => {
      const invalidStructure = JSON.stringify({
        wrong_key: [],
      });
      expect(() => service.parseAIResponse(invalidStructure)).toThrow(
        "La respuesta no contiene el campo \u0027ideas_de_contenido\u0027 o no es un array"
      );
    });

    test("should throw error if \u0027ideas_de_contenido\u0027 is empty", () => {
      const emptyArray = JSON.stringify({
        ideas_de_contenido: [],
      });
      expect(() => service.parseAIResponse(emptyArray)).toThrow(
        "La IA no generó ninguna idea"
      );
    });
  });

  describe("generateIdeas with Gemini", () => {
    test("should return ideas when API call is successful", async () => {
        const mockGenerateContent = mock(async () => ({
            text: JSON.stringify({
                ideas_de_contenido: [{
                    categoria: "Gemini Cat",
                    formato_sugerido: "Post",
                    titulo_gancho: "Hook",
                    descripcion_ejecucion: "Desc"
                }]
            })
        }));

        const mockGeminiClient = {
            models: {
                generateContent: mockGenerateContent
            }
        } as unknown as GoogleGenAI;

        const service = new AIService({ ...mockConfig, provider: "gemini" }, mockGeminiClient);
        const ideas = await service.generateIdeas("bakery");

        expect(ideas).toHaveLength(1);
        expect(ideas[0]!.categoria).toBe("Gemini Cat");
        expect(mockGenerateContent).toHaveBeenCalled();
    });

    test("should handle API errors", async () => {
        const mockGenerateContent = mock(async () => {
            throw new Error("API Timeout");
        });

        const mockGeminiClient = {
            models: {
                generateContent: mockGenerateContent
            }
        } as unknown as GoogleGenAI;

        const service = new AIService({ ...mockConfig, provider: "gemini" }, mockGeminiClient);

        // Expect the promise to reject with the specific error format defined in AIService
        expect(service.generateIdeas("bakery")).rejects.toThrow("Gemini API Error: API Timeout");
    });
  });

  describe("generateIdeas with OpenAI", () => {
      test("should return ideas when API call is successful", async () => {
          const mockCreate = mock(async () => ({
              choices: [{
                  message: {
                      content: JSON.stringify({
                          ideas_de_contenido: [{
                              categoria: "OpenAI Cat",
                              formato_sugerido: "Story",
                              titulo_gancho: "Hook",
                              descripcion_ejecucion: "Desc"
                          }]
                      })
                  }
              }]
          }));

          const mockOpenAIClient = {
              chat: {
                  completions: {
                      create: mockCreate
                  }
              }
          } as unknown as OpenAI;

          const service = new AIService({ ...mockConfig, provider: "openai" }, undefined, mockOpenAIClient);
          const ideas = await service.generateIdeas("gym");

          expect(ideas).toHaveLength(1);
          expect(ideas[0]!.categoria).toBe("OpenAI Cat");
          expect(mockCreate).toHaveBeenCalled();
      });

      test("should handle API errors", async () => {
        const mockCreate = mock(async () => {
            throw new Error("Rate Limit Exceeded");
        });

        const mockOpenAIClient = {
            chat: {
                completions: {
                    create: mockCreate
                }
            }
        } as unknown as OpenAI;

        const service = new AIService({ ...mockConfig, provider: "openai" }, undefined, mockOpenAIClient);

        expect(service.generateIdeas("gym")).rejects.toThrow("OpenAI API Error: Rate Limit Exceeded");
    });
  });
});
