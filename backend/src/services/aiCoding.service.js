import { analyzeCodeWithAI } from './groq.service.js';

export async function analyzeCode(code, language, problemDescription) {
  try {
    const prompt = `Analyze the following ${language} code for a coding problem and provide feedback in JSON format:

Problem: ${problemDescription}

Code:
\`\`\`${language}
${code}
\`\`\`

Return a JSON object with:
{
  "timeComplexity": "O(n) description",
  "spaceComplexity": "O(n) description", 
  "mistakes": ["list of mistakes or bugs found"],
  "suggestions": ["optimization suggestions"],
  "score": number (0-100 overall quality score)
}`;

    const result = await analyzeCodeWithAI(prompt);
    
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
    }
    
    return {
      timeComplexity: 'Unable to analyze',
      spaceComplexity: 'Unable to analyze',
      mistakes: [],
      suggestions: [],
      score: 0,
      rawFeedback: result,
    };
  } catch (error) {
    console.error('AI code analysis error:', error);
    return {
      timeComplexity: 'Error',
      spaceComplexity: 'Error',
      mistakes: ['AI analysis failed'],
      suggestions: [],
      score: 0,
      error: error.message,
    };
  }
}