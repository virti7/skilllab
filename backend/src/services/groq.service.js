import fetch from 'node-fetch';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

async function makeRequest(payload) {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is missing in environment variables');
  }

  const currentPayload = { ...payload, model: MODEL };
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(currentPayload),
  });
  
  const data = await response.json();
  return { response, data };
}

export const generateHint = async (question, code) => {
  try {
    const { response, data } = await makeRequest({
      messages: [
        {
          role: "system",
          content: "You are a coding mentor. Give hints only, do not provide full solutions."
        },
        {
          role: "user",
          content: `Problem: ${question}\nUser Code: ${code}`
        }
      ],
      temperature: 0.5
    });

    if (!response.ok) {
      const errorMsg = data?.error?.message || data?.error?.type || response.statusText;
      console.error('Groq API Error:', { status: response.status, error: data });
      return "AI service temporarily unavailable";
    }

    return data.choices?.[0]?.message?.content || "No hint available";
  } catch (error) {
    console.error("Groq error:", error);
    return "AI service temporarily unavailable";
  }
};

export async function generateTestQuestions(
  subject,
  topic,
  difficulty,
  numberOfQuestions
) {
  const prompt = `Generate ${numberOfQuestions} multiple choice questions for a ${difficulty} difficulty level test.

Subject: ${subject}
Topic: ${topic}
Difficulty: ${difficulty}

Generate ONLY valid JSON array. No markdown, no explanations, no code blocks. Return ONLY the JSON array.

Each question must follow this exact format:
{
  "question": "The question text here",
  "options": {
    "A": "First option",
    "B": "Second option",
    "C": "Third option",
    "D": "Fourth option"
  },
  "correctAnswer": "A"
}

Rules:
- Make questions clear and unambiguous
- Options should be plausible (no obviously wrong options)
- Ensure only ONE correct answer
- Distribute correct answers across A, B, C, D
- For ${difficulty} difficulty: ${difficulty === 'easy'
      ? 'use basic recall questions'
      : difficulty === 'medium'
        ? 'mix recall with application questions'
        : difficulty === 'hard'
          ? 'include complex application and analysis questions'
          : 'mix all difficulty levels evenly'
    }
- Questions should test genuine understanding, not just trivia

Return JSON array:`;

  try {
    const { response, data } = await makeRequest({
      messages: [
        {
          role: 'system',
          content: 'You are an expert test question generator. Generate high-quality MCQ questions in valid JSON format only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    });

    if (!response.ok) {
      const errorMsg = data?.error?.message || data?.error?.type || response.statusText;
      console.error('Groq API Error:', { status: response.status, error: data });
      throw new Error('AI service temporarily unavailable');
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No content in Groq API response');
    }

    let cleanedContent = content.trim();
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.slice(7);
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.slice(3);
    }
    if (cleanedContent.endsWith('```')) {
      cleanedContent = cleanedContent.slice(0, -3);
    }
    cleanedContent = cleanedContent.trim();

    try {
      const questions = JSON.parse(cleanedContent);
      if (!Array.isArray(questions)) {
        throw new Error('AI returned invalid response format (not an array)');
      }

      const validQuestions = questions.filter((q) => {
        if (typeof q !== 'object' || q === null) return false;
        return (
          typeof q.question === 'string' &&
          q.question.length > 0 &&
          typeof q.options === 'object' &&
          q.options !== null &&
          ['A', 'B', 'C', 'D'].every((opt) => typeof q.options[opt] === 'string') &&
          ['A', 'B', 'C', 'D'].includes(q.correctAnswer)
        );
      });

      if (validQuestions.length === 0) {
        throw new Error('AI generated no valid questions');
      }

      return validQuestions.map((q) => ({
        question: q.question,
        options: {
          A: q.options.A,
          B: q.options.B,
          C: q.options.C,
          D: q.options.D,
        },
        correctAnswer: q.correctAnswer.toUpperCase(),
      }));
    } catch (err) {
      console.error('Failed to parse questions JSON:', cleanedContent);
      throw new Error('Failed to parse AI-generated questions as JSON');
    }
  } catch (error) {
    console.error('Groq API error:', error);
    throw new Error('AI service temporarily unavailable');
  }
}

export async function generateTestFeedback(score, total, topicStats, weakTopics, detailedAnswers) {
  const percentage = Math.round((score / total) * 100);
  const topicStatsJson = JSON.stringify(topicStats, null, 2);

  const incorrectAnswers = detailedAnswers
    .filter(a => !a.isCorrect)
    .slice(0, 5)
    .map(a => `Q: ${a.question.substring(0, 100)}... - Correct: ${a.correct}`)
    .join('\n');

  const prompt = `Analyze this student test performance and provide personalized improvement tips.

Score: ${score}/${total} (${percentage}%)
Topic Performance:
${topicStatsJson}

Weak Topics: ${weakTopics.length > 0 ? weakTopics.join(', ') : 'None'}
Incorrect Answers Sample:
${incorrectAnswers || 'None'}

Provide a JSON response with this exact format:
{
  "strengths": "What the student did well (1-2 sentences)",
  "weaknesses": "What needs improvement (1-2 sentences)",
  "suggestions": "Specific study suggestions (2-3 sentences)"
}

Rules:
- Be specific about the score and percentage
- Highlight strong and weak topics
- Give actionable, practical suggestions
- Keep it encouraging but honest
- Focus on helping them improve

Return ONLY JSON:`;

  try {
    const { response, data } = await makeRequest({
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational tutor. Analyze student performance and provide helpful, actionable feedback in valid JSON format only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 1024,
    });

    if (!response.ok) {
      const errorMsg = data?.error?.message || data?.error?.type || response.statusText;
      console.error('Groq API Error:', { status: response.status, error: data });
      return {
        strengths: 'Keep practicing consistently.',
        weaknesses: weakTopics.length > 0 ? `Focus on: ${weakTopics.join(', ')}` : 'Keep building your knowledge base.',
        suggestions: 'Review the topics you missed and practice more questions in those areas.',
      };
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No content in Groq API response');
    }

    let cleanedContent = content.trim();
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.slice(7);
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.slice(3);
    }
    if (cleanedContent.endsWith('```')) {
      cleanedContent = cleanedContent.slice(0, -3);
    }
    cleanedContent = cleanedContent.trim();

    try {
      const feedback = JSON.parse(cleanedContent);
      return {
        strengths: typeof feedback.strengths === 'string' ? feedback.strengths : 'Keep practicing consistently.',
        weaknesses: typeof feedback.weaknesses === 'string' ? feedback.weaknesses : 'Focus on improving your weaker areas.',
        suggestions: typeof feedback.suggestions === 'string' ? feedback.suggestions : 'Review incorrect answers and practice more questions.',
      };
    } catch (err) {
      console.error('Failed to parse feedback JSON:', cleanedContent);
      return {
        strengths: 'Keep practicing consistently.',
        weaknesses: weakTopics.length > 0 ? `Focus on: ${weakTopics.join(', ')}` : 'Keep building your knowledge base.',
        suggestions: 'Review the topics you missed and practice more questions in those areas.',
      };
    }
  } catch (error) {
    console.error('Groq API error:', error);
    return {
      strengths: 'Keep practicing consistently.',
      weaknesses: weakTopics.length > 0 ? `Focus on: ${weakTopics.join(', ')}` : 'Keep building your knowledge base.',
      suggestions: 'Review the topics you missed and practice more questions in those areas.',
    };
  }
}

export async function analyzeCodeWithAI(promptText) {
  try {
    const { response, data } = await makeRequest({
      messages: [
        {
          role: 'system',
          content: 'You are an expert code reviewer. Analyze code and provide helpful feedback in valid JSON format only.',
        },
        {
          role: 'user',
          content: promptText,
        },
      ],
      temperature: 0.3,
      max_tokens: 2048,
    });

    if (!response.ok) {
      const errorMsg = data?.error?.message || data?.error?.type || response.statusText;
      console.error('Groq API Error:', { status: response.status, error: data });
      throw new Error('AI service temporarily unavailable');
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No content in Groq API response');
    }

    return content;
  } catch (error) {
    console.error('Groq API error:', error);
    throw new Error('AI service temporarily unavailable');
  }
}

export async function analyzeStudentPerformance(
  studentName,
  answers,
  topics
) {
  const answersSummary = answers.map((a, i) =>
    `Q${i + 1}: ${a.question} - ${a.isCorrect ? 'Correct' : 'Incorrect'}`
  ).join('\n');

  const prompt = `Analyze student performance and provide insights.

Student Name: ${studentName}
Topics Covered: ${topics.join(', ')}
Total Questions: ${answers.length}
Correct Answers: ${answers.filter(a => a.isCorrect).length}
Incorrect Answers: ${answers.filter(a => !a.isCorrect).length}

Answers:
${answersSummary}

Provide a JSON response with this exact format:
{
  "weakTopics": ["topic1", "topic2"],
  "strongTopics": ["topic3"],
  "suggestions": ["suggestion1", "suggestion2"],
  "overallScore": 75
}

Rules:
- weakTopics: Topics where the student made mistakes (max 5)
- strongTopics: Topics where student performed well (max 3)
- suggestions: Specific, actionable improvement suggestions (max 5)
- overallScore: Percentage of correct answers (0-100)
- Be specific about which topics need work
- Suggestions should be practical and actionable

Return ONLY JSON:`;

  try {
    const { response, data } = await makeRequest({
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational analyst. Analyze student performance and provide actionable insights in valid JSON format only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 2048,
    });

    if (!response.ok) {
      const errorMsg = data?.error?.message || data?.error?.type || response.statusText;
      console.error('Groq API Error:', { status: response.status, error: data });
      return {
        weakTopics: [],
        strongTopics: [],
        suggestions: ['Focus on reviewing incorrect answers'],
        overallScore: Math.round((answers.filter(a => a.isCorrect).length / answers.length) * 100),
      };
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No content in Groq API response');
    }

    let cleanedContent = content.trim();
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.slice(7);
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.slice(3);
    }
    if (cleanedContent.endsWith('```')) {
      cleanedContent = cleanedContent.slice(0, -3);
    }
    cleanedContent = cleanedContent.trim();

    try {
      const analysis = JSON.parse(cleanedContent);
      return {
        weakTopics: Array.isArray(analysis.weakTopics) ? analysis.weakTopics : [],
        strongTopics: Array.isArray(analysis.strongTopics) ? analysis.strongTopics : [],
        suggestions: Array.isArray(analysis.suggestions) ? analysis.suggestions : [],
        overallScore: typeof analysis.overallScore === 'number' ? analysis.overallScore : 0,
      };
    } catch (err) {
      console.error('Failed to parse analysis JSON:', cleanedContent);
      return {
        weakTopics: [],
        strongTopics: [],
        suggestions: ['Focus on reviewing incorrect answers'],
        overallScore: Math.round((answers.filter(a => a.isCorrect).length / answers.length) * 100),
      };
    }
  } catch (error) {
    console.error('Groq API error:', error);
    return {
      weakTopics: [],
      strongTopics: [],
      suggestions: ['Focus on reviewing incorrect answers'],
      overallScore: Math.round((answers.filter(a => a.isCorrect).length / answers.length) * 100),
    };
  }
}

export async function generateCodingQuestion(topic, difficulty, language) {
  const languageMap = {
    c: 'C',
    cpp: 'C++',
    java: 'Java',
    python: 'Python',
  };

  const langName = languageMap[language.toLowerCase()] || language;
  const difficultyCap = difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
  const topicCap = topic.charAt(0).toUpperCase() + topic.slice(1).toLowerCase();

  const prompt = `Generate a coding problem in JSON format.

Topic: ${topicCap}
Difficulty: ${difficultyCap}
Language: ${langName}

Return ONLY JSON with this exact structure:
{
  "title": "Problem title",
  "description": "Problem description with examples and constraints",
  "starterCode": "Starting code snippet in ${langName}",
  "testCases": [
    { "input": "test input", "output": "expected output" },
    { "input": "test input", "output": "expected output" },
    { "input": "test input", "output": "expected output" }
  ]
}

Rules:
- Title should be clear and descriptive
- Description should include problem statement, example(s), and constraints
- starterCode should be a functional code snippet with function signature
- Provide exactly 3 test cases
- Language should match: ${langName}
- Difficulty: ${difficultyCap}

Return ONLY JSON:`;

  try {
    const { response, data } = await makeRequest({
      messages: [
        {
          role: 'system',
          content: 'You are an expert coding problem generator. Generate high-quality coding problems with clear descriptions and starter code in valid JSON format only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    });

    if (!response.ok) {
      const errorMsg = data?.error?.message || data?.error?.type || response.statusText;
      console.error('Groq API Error:', { status: response.status, error: data });
      throw new Error('AI service temporarily unavailable');
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No content in Groq API response');
    }

    let cleanedContent = content.trim();
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.slice(7);
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.slice(3);
    }
    if (cleanedContent.endsWith('```')) {
      cleanedContent = cleanedContent.slice(0, -3);
    }
    cleanedContent = cleanedContent.trim();

    try {
      const question = JSON.parse(cleanedContent);

      if (!question.title || !question.description || !question.starterCode) {
        throw new Error('Missing required fields in AI response');
      }

      const testCases = Array.isArray(question.testCases) ? question.testCases : [];
      const validTestCases = testCases
        .filter(tc => tc.input && tc.output)
        .slice(0, 3);

      return {
        title: question.title,
        description: question.description,
        starterCode: question.starterCode,
        testCases: validTestCases.map(tc => ({
          input: String(tc.input),
          output: String(tc.output),
        })),
      };
    } catch (err) {
      console.error('Failed to parse coding question JSON:', cleanedContent);
      throw new Error('Failed to parse AI-generated coding question');
    }
  } catch (error) {
    console.error('Groq API error:', error);
    throw new Error('AI service temporarily unavailable');
  }
}