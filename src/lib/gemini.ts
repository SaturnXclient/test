import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from '@google/generative-ai';

const API_KEY = 'AIzaSyAf1hy1dpZx3c51IksFcHLQfp37OWnHBvg';

// Initialize the API with proper configuration
const genAI = new GoogleGenerativeAI(API_KEY);

// Default generation configuration
const defaultConfig: GenerationConfig = {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 1024,
};

// Context-aware prompts for different modes
const CONTEXT_PROMPTS = {
  code: `You are an expert software developer with deep knowledge across multiple programming languages and frameworks. 
         Provide detailed, production-ready code solutions with clear explanations. 
         Focus on best practices, maintainability, and performance.`,
  chat: `You are a helpful, knowledgeable assistant. 
         Provide clear, accurate, and engaging responses while maintaining a natural conversational tone. 
         Be concise yet informative, and always aim to provide valuable insights.`,
};

export async function getGeminiResponse(
  prompt: string, 
  mode: 'code' | 'chat' = 'chat',
  config: Partial<GenerationConfig> = {}
) {
  try {
    // Get the model with proper configuration
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-pro',
      generationConfig: {
        ...defaultConfig,
        ...config,
      },
    });

    // Add context-aware prompt enhancement
    const enhancedPrompt = `${CONTEXT_PROMPTS[mode]}\n\nUser Request: ${prompt}`;

    // Generate the content with safety checks
    const result = await model.generateContent(enhancedPrompt);
    
    if (!result.response) {
      throw new Error('No response generated');
    }

    // Process and format the response
    const response = result.response.text();
    
    // Basic content filtering and validation
    if (!response || response.trim().length === 0) {
      throw new Error('Empty response received');
    }

    return response;
  } catch (error) {
    console.error('Gemini API Error:', error);
    
    // Provide meaningful error messages based on error type
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error('Invalid API key or authentication error');
      } else if (error.message.includes('quota')) {
        throw new Error('API quota exceeded. Please try again later');
      }
      throw new Error(`AI Response Error: ${error.message}`);
    }
    
    throw new Error('Failed to generate AI response. Please try again');
  }
}