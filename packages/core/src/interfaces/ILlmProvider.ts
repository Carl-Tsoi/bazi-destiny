// Pluggable LLM provider — Phase 2 (Claude API), Phase 3 (local Ollama/vLLM)

export interface ILlmProvider {
  /**
   * Generate a vernacular Chinese reading from structured chart data
   * and classical text context. The LLM translates and polishes prose;
   * it MUST NOT re-judge or override any fated conclusions from the engine.
   */
  generate(prompt: string, context: string[]): Promise<string>;
}
