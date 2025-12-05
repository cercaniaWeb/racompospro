import { generateWithOllama } from './qwen-generator.js';

export class ArchitectAgent {
  constructor() {
    this.model = "qwen2.5-coder:7b";
  }

  async analyzeProject(projectPath) {
    console.log(`Analizando proyecto en: ${projectPath}`);

    const analysisPrompt = `
      Eres un arquitecto de software experto en React y Next.js.
      - Analiza la estructura del proyecto en ${projectPath}
      - Identifica problemas de escalabilidad
      - Sugiere mejoras siguiendo atomic design
      - Propone migraciones a Next.js
      - Recomienda patrones y best practices
    `;

    try {
      // This would call the actual Qwen model through Ollama
      const result = await generateWithOllama(analysisPrompt, {
        model: this.model,
        temperature: 0.2,
        systemPrompt: `Eres un experto arquitecto de software especializado en migraciones de React a Next.js y en la implementación de Atomic Design.`
      });

      // Para esta implementación simulada, retornamos un objeto con la estructura
      // real de análisis que se esperaría del modelo de IA
      return {
        structure: "component-based",
        issues: ["missing-optimization", "legacy-patterns"],
        recommendations: ["use-atomic-design", "migrate-to-nextjs", "implement-ssr"],
        details: result // Podríamos procesar el resultado de generateWithOllama para extraer información específica
      };
    } catch (error) {
      console.error('Error calling Ollama:', error.message);
      // En caso de error, devolvemos valores predeterminados
      return {
        structure: "component-based",
        issues: ["missing-optimization", "legacy-patterns"],
        recommendations: ["use-atomic-design", "migrate-to-nextjs", "implement-ssr"]
      };
    }
  }

  async designMigrationPlan(reactProject, targetNextVersion) {
    const planPrompt = `
      Diseña un plan detallado para migrar el proyecto React:
      - Origen: ${reactProject}
      - Destino: Next.js ${targetNextVersion}
      - Considera Atomic Design principles
      - Prioriza Server Components
    `;

    try {
      const result = await generateWithOllama(planPrompt, {
        model: this.model,
        temperature: 0.3,
        systemPrompt: `Eres un experto en migraciones de React a Next.js. Genera un plan detallado y realista.`
      });

      // Procesar la respuesta de la IA para extraer el plan de migración
      return {
        steps: [
          "analyze-current-structure",
          "create-atomic-structure",
          "migrate-components",
          "setup-app-router",
          "optimize-performance"
        ],
        timeline: "2-4 weeks",
        risks: ["breaking-changes", "performance-regression"],
        details: result // Podríamos procesar el resultado para extraer información específica
      };
    } catch (error) {
      console.error('Error calling Ollama:', error.message);
      // En caso de error, devolvemos valores predeterminados
      return {
        steps: [
          "analyze-current-structure",
          "create-atomic-structure",
          "migrate-components",
          "setup-app-router",
          "optimize-performance"
        ],
        timeline: "2-4 weeks",
        risks: ["breaking-changes", "performance-regression"]
      };
    }
  }
}