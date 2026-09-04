import Groq from 'groq-sdk'

let groqClient: Groq | null = null

export function getGroqClient(): Groq {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      throw new Error('Missing GROQ_API_KEY environment variable')
    }
    groqClient = new Groq({ apiKey })
  }
  return groqClient
}

// Default model per ADR-004
export const GROQ_MODEL = 'llama-3.3-70b-versatile'
export const GROQ_TEMPERATURE = 0.1
export const GROQ_MAX_TOKENS = 1500
