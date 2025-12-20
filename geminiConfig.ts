export const DEFAULT_MODEL = 'gemini-3-flash-preview';

export const DEFAULT_TIMEOUT_MS = 60000; // 60 seconds

/**
 * Resolve Gemini API key from environment.
 * Prefer GEMINI_API_KEY but fall back to API_KEY for backward compatibility.
 */
export const getGeminiApiKey = (): string => {
  const key = (process.env.GEMINI_API_KEY || process.env.API_KEY || '').trim();
  return key;
};

export const isGeminiApiKeyAvailable = (): boolean => {
  return getGeminiApiKey().length > 0;
};

export const getMissingKeyMessage = (): string => {
  return 'API Key is missing. Please set GEMINI_API_KEY (recommended) or API_KEY in your .env.local file. See README.md for setup instructions.';
};


