import fetch from 'node-fetch';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const GROQ_MODEL = 'llama-3.3-70b-versatile';

export async function generateTestQuestions(
  subject,
  topic,
  difficulty,
  numberOfQuestions
) {
  let apiKey = process.env.GROQ_API_KEY?.trim();

  if (!apiKey) {
    throw new Error('GROQ_API_KEY is missing in environment variables');
  }

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
- For ${difficulty} difficulty: ${
    difficulty === 'easy'
      ? 'use basic recall questions'
      : difficulty === 'medium'
      ? 'mix recall with application questions'
      : difficulty === 'hard'
      ? 'include complex application and analysis questions'
      : 'mix all difficulty levels evenly'
  }
- Questions should test genuine understanding, not just trivia

Return JSON array:`;

  const requestBody = {
    model: GROQ_MODEL,
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
  };

  console.log('=== GROQ API DEBUG ===');
  console.log('Using Groq key:', apiKey.slice(0, 8) + '...');
  console.log('Key length:', apiKey.length);
  console.log('Key prefix:', apiKey.slice(0, 4));
  console.log('Request URL:', GROQ_API_URL);
  console.log('Request payload:', JSON.stringify(requestBody));
  console.log('====================');

  let response;
  try {
    response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
  } catch (err) {
    throw new Error(`Groq API fetch failed: ${err.message}`);
  }

  let data;
  try {
    data = await response.json();
  } catch (err) {
    throw new Error('Failed to parse Groq API response as JSON');
  }

  if (!response.ok) {
    const errorMsg = data?.error?.message || data?.error?.type || response.statusText;
    console.error('=== GROQ API ERROR ===');
    console.error('Status:', response.status);
    console.error('Error response:', JSON.stringify(data, null, 2));
    console.error('====================');
    throw new Error(`Groq API error (${response.status}): ${errorMsg}`);
  }

  console.log('=== GROQ API SUCCESS ===');
  console.log('Response status:', response.status);
  console.log('====================');

  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    console.error('Groq response structure:', JSON.stringify(data, null, 2));
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

  let questions;
  try {
    questions = JSON.parse(cleanedContent);
  } catch (err) {
    console.error('Failed to parse questions JSON:', cleanedContent);
    throw new Error('Failed to parse AI-generated questions as JSON');
  }
  
  if (!Array.isArray(questions)) {
    console.error('Questions is not an array:', questions);
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
    console.error('No valid questions found in response:', questions);
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
}

export async function generateTestFeedback(score, total, topicStats, weakTopics, detailedAnswers) {
  let apiKey = process.env.GROQ_API_KEY?.trim();

  if (!apiKey) {
    throw new Error('GROQ_API_KEY is missing in environment variables');
  }

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

  let response;
  try {
    response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
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
      }),
    });
  } catch (err) {
    throw new Error(`Groq API fetch failed: ${err.message}`);
  }

  let data;
  try {
    data = await response.json();
  } catch (err) {
    throw new Error('Failed to parse Groq API response as JSON');
  }

  if (!response.ok) {
    const errorMsg = data?.error?.message || data?.error?.type || response.statusText;
    console.error('Groq API Error:', { status: response.status, error: data });
    throw new Error(`Groq API error (${response.status}): ${errorMsg}`);
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
}

export async function analyzeStudentPerformance(
  studentName,
  answers,
  topics
) {
  let apiKey = process.env.GROQ_API_KEY?.trim();

  if (!apiKey) {
    throw new Error('GROQ_API_KEY is missing in environment variables');
  }

  console.log('Using Groq key:', apiKey.slice(0, 5) + '...');

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

  let response;
  try {
    response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
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
      }),
    });
  } catch (err) {
    throw new Error(`Groq API fetch failed: ${err.message}`);
  }

  let data;
  try {
    data = await response.json();
  } catch (err) {
    throw new Error('Failed to parse Groq API response as JSON');
  }

  if (!response.ok) {
    const errorMsg = data?.error?.message || data?.error?.type || response.statusText;
    console.error('Groq API Error:', { status: response.status, error: data });
    throw new Error(`Groq API error (${response.status}): ${errorMsg}`);
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
}
