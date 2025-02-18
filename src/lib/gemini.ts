import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI('AIzaSyAf1hy1dpZx3c51IksFcHLQfp37OWnHBvg');

export async function getGeminiResponse(prompt: string, mode: 'code' | 'chat') {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    let formattedPrompt = prompt;
    if (mode === 'code') {
      formattedPrompt = `You are an expert programmer. Please provide code and explanations for the following request: ${prompt}`;
    }

    const result = await model.generateContent(formattedPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error getting Gemini response:', error);
    throw new Error('Failed to get AI response');
  }
}