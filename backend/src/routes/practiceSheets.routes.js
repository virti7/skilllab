import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { generatePracticeSheetMCQs, generateCodingQuestion } from '../services/groq.service.js';

const router = Router();

router.use(authenticate);

// GET /api/practice-sheets/batches - Get batches for the institute
router.get('/batches', requireRole('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
    try {
        const { instituteId } = req.user;

        if (!instituteId) {
            return res.status(400).json({ error: 'Admin must belong to an institute' });
        }

        const batches = await prisma.batch.findMany({
            where: { instituteId },
            include: {
                _count: {
                    select: { batchStudents: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return res.json(
            batches.map((b) => ({
                id: b.id,
                name: b.name,
                inviteCode: b.inviteCode,
                studentCount: b._count.batchStudents,
                createdAt: b.createdAt,
            }))
        );
    } catch (err) {
        console.error('Get practice sheet batches error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/practice-sheets/generate - Generate practice sheet using AI
router.post('/generate', requireRole('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
    try {
        const {
            sheetType,
            instituteName,
            sheetTitle,
            totalMarks,
            topics,
            difficulties,
            includeAnswerKey,
            includeWriteSpace,
            showDifficulty,
            showStudentInfo,
            showMarksPerQuestion,
            batchId,
            mcqCount,
            codingCount,
            debugCount,
            codingLanguage,
            concepts,
            curriculum
        } = req.body;

        console.log('==========================================');
        console.log('=== BACKEND RECEIVED REQUEST ===');
        console.log('==========================================');
        console.log('Full request body keys:', Object.keys(req.body));
        console.log('Full request body:', JSON.stringify(req.body));
        console.log('topics from frontend:', topics);
        console.log('concepts:', concepts);
        console.log('curriculum:', curriculum);
        console.log('typeof concepts:', typeof concepts);
        console.log('Array.isArray(concepts):', Array.isArray(concepts));
        console.log('concepts length:', concepts?.length);
        console.log('curriculum length:', curriculum?.length);
        console.log('batchId:', batchId);
        console.log('==========================================');

        if (!sheetType || !['mcq', 'coding', 'debug', 'mixed'].includes(sheetType)) {
            return res.status(400).json({ error: 'Valid sheetType is required (mcq, coding, debug, mixed)' });
        }

        // If batch is selected, get batch details and its associated curriculum/concepts
        let batchInfo = null;
        if (batchId) {
            batchInfo = await prisma.batch.findUnique({
                where: { id: batchId },
                include: {
                    tests: {
                        where: { isActive: true },
                        include: {
                            questions: {
                                select: { topic: true }
                            }
                        }
                    }
                }
            });
        }

        // CRITICAL: Log what's received for debugging
        console.log('==========================================');
        console.log('=== TOPICS DEBUG ===');
        console.log('Concepts received:', concepts);
        console.log('Curriculum received:', curriculum);
        console.log('topics received:', topics);
        console.log('Batch topics:', batchInfo?.tests?.flatMap(t => t.questions.map(q => q.topic)) || []);
        console.log('==========================================');

        // Merge topics: from concepts, curriculum, batch - NOT from the default topics array
        let effectiveTopics = [];

        // Add custom concepts first (user's main input)
        if (concepts && Array.isArray(concepts) && concepts.length > 0) {
            console.log('Adding concepts to effectiveTopics:', concepts);
            effectiveTopics = [...effectiveTopics, ...concepts];
        } else {
            console.log('No concepts provided or concepts is empty');
        }

        // Add curriculum topics
        if (curriculum && Array.isArray(curriculum) && curriculum.length > 0) {
            console.log('Adding curriculum to effectiveTopics:', curriculum);
            effectiveTopics = [...effectiveTopics, ...curriculum];
        } else {
            console.log('No curriculum provided or curriculum is empty');
        }

        // Add topics from batch's tests/curriculum (only if no concepts/curriculum provided)
        if (effectiveTopics.length === 0 && batchInfo?.tests) {
            const batchTopics = batchInfo.tests
                .flatMap(t => t.questions.map(q => q.topic))
                .filter(Boolean);
            console.log('Adding batch topics to effectiveTopics:', batchTopics);
            effectiveTopics = [...effectiveTopics, ...batchTopics];
        }

        // Remove duplicates while preserving order
        effectiveTopics = [...new Set(effectiveTopics)];

        // Default only if nothing was provided
        if (effectiveTopics.length === 0) {
            console.log('!!! WARNING: effectiveTopics is empty, falling back to General Programming !!!');
            effectiveTopics = ['General Programming'];
        } else {
            console.log('!!! SUCCESS: Using user-provided topics:', effectiveTopics);
        }

        // FORCE override: if user provided concepts/curriculum, use ONLY those
        if (concepts && concepts.length > 0) {
            console.log('>>> FORCING topics from concepts:', concepts);
            effectiveTopics = [...concepts];
        }
        if (curriculum && curriculum.length > 0 && effectiveTopics.length === 0) {
            console.log('>>> FORCING topics from curriculum:', curriculum);
            effectiveTopics = [...curriculum];
        }

        console.log('Final effectiveTopics:', effectiveTopics);
        console.log('==========================================');

        const result = {
            sheetType,
            instituteName: instituteName || 'SkillLab Institute',
            sheetTitle: sheetTitle || 'Practice Sheet',
            totalMarks: totalMarks || 50,
            topics: effectiveTopics,
            batchName: batchInfo?.name || null,
            difficulties: difficulties || ['easy', 'medium', 'hard'],
            codingLanguage: codingLanguage || 'JavaScript',
            options: {
                includeAnswerKey: includeAnswerKey !== false,
                includeWriteSpace: includeWriteSpace !== false,
                showDifficulty: showDifficulty !== false,
                showStudentInfo: showStudentInfo !== false,
                showMarksPerQuestion: showMarksPerQuestion !== false,
            },
            mcq: [],
            coding: [],
            debug: [],
        };

        // Calculate questions per section based on sheet type and total marks, or use explicit counts
        const marksPerMcq = 1;
        const marksPerCoding = 5;
        const marksPerDebug = 5;

        // Determine question counts - prioritize explicit counts, otherwise calculate from marks
        let targetMcqCount = mcqCount;
        let targetCodingCount = codingCount;
        let targetDebugCount = debugCount;

        if (!targetMcqCount && !targetCodingCount && !targetDebugCount) {
            // Fallback to mark-based calculation
            if (sheetType === 'mcq') {
                targetMcqCount = Math.floor(totalMarks / marksPerMcq);
            } else if (sheetType === 'coding') {
                targetCodingCount = Math.floor(totalMarks / marksPerCoding);
            } else if (sheetType === 'debug') {
                targetDebugCount = Math.floor(totalMarks / marksPerDebug);
            } else if (sheetType === 'mixed') {
                targetMcqCount = Math.max(5, Math.floor(totalMarks * 0.5 / marksPerMcq));
                targetCodingCount = Math.max(2, Math.floor(totalMarks * 0.25 / marksPerCoding));
                targetDebugCount = Math.max(2, Math.floor(totalMarks * 0.25 / marksPerDebug));
            }
        }

        // Generate MCQ questions
        if (sheetType === 'mcq' || sheetType === 'mixed') {
            const mcqTopics = effectiveTopics.length > 0 ? effectiveTopics : ['General Programming'];

            console.log('=== MCQ CONFIG ===');
            console.log('curriculum:', curriculum);
            console.log('concepts:', concepts);
            console.log('effectiveTopics:', mcqTopics);
            console.log('targetMcqCount:', targetMcqCount);
            console.log('difficulties:', difficulties);
            console.log('==================');

            try {
                console.log('=== CALLING AI FOR MCQs ===');
                console.log('Using curriculum:', curriculum);
                console.log('Using concepts:', concepts);
                console.log('Requested count:', targetMcqCount || 10);
                console.log('============================');

                const questions = await generatePracticeSheetMCQs(
                    curriculum || [],
                    concepts || [],
                    difficulties || ['easy', 'medium', 'hard'],
                    targetMcqCount || 10
                );

                console.log('=== AI RESPONSE ===');
                console.log('Questions count:', questions.length);
                console.log('First question:', questions[0]?.question?.substring(0, 100));
                console.log('Topics:', [...new Set(questions.map(q => q.topic))]);
                console.log('==================');

                result.mcq.push(...questions.map((q, idx) => ({
                    id: `mcq-${Date.now()}-${idx}`,
                    questionText: q.question,
                    optionA: q.options.A,
                    optionB: q.options.B,
                    optionC: q.options.C,
                    optionD: q.options.D,
                    correctOption: q.correctAnswer,
                    topic: q.topic,
                    type: 'mcq',
                    marks: marksPerMcq,
                })));

                console.log('Total MCQs generated:', result.mcq.length);
            } catch (err) {
                console.error('MCQ generation error:', err.message);
                throw new Error('Failed to generate MCQ questions: ' + err.message);
            }
        }

        // Generate Coding questions
        if (sheetType === 'coding' || sheetType === 'mixed') {
            const lang = (codingLanguage || 'javascript').toLowerCase();
            const langLabel = lang.charAt(0).toUpperCase() + lang.slice(1);

            // For coding, use concepts only if they seem programming-related
            // Otherwise use default programming concepts
            const programmingKeywords = ['loop', 'array', 'function', 'variable', 'string', 'number', 'object', 'class', 'algorithm', 'data', 'structure', 'recursion', 'sort', 'search', 'tree', 'graph', 'hash', 'stack', 'queue'];
            const isProgrammingRelated = (concepts || []).some(c =>
                programmingKeywords.some(kw => c.toLowerCase().includes(kw))
            );

            let codingConcepts = isProgrammingRelated && effectiveTopics.length > 0
                ? effectiveTopics
                : ['Variables', 'Functions', 'Loops', 'Arrays', 'Conditionals'];

            // Get difficulty for coding (use first selected difficulty or default to medium)
            const codingDifficulty = difficulties.includes('easy') || difficulties.includes('medium') || difficulties.includes('hard')
                ? difficulties[0]
                : 'medium';

            try {
                const codingProblems = [];
                for (let i = 0; i < (targetCodingCount || 3); i++) {
                    const problem = await generateCodingQuestion(
                        codingConcepts[i % codingConcepts.length],
                        codingDifficulty,
                        langLabel
                    );
                    codingProblems.push(problem);
                }

                result.coding.push(...codingProblems.map((p, idx) => ({
                    id: `coding-${Date.now()}-${idx}`,
                    title: p.title,
                    description: p.description,
                    difficulty: codingDifficulty,
                    topic: codingConcepts[idx % codingConcepts.length],
                    language: langLabel,
                    type: 'coding',
                    marks: marksPerCoding,
                    testCases: p.testCases || [],
                    constraints: p.constraints || "Time Limit: 1s | Memory: 256MB",
                    starterCode: p.starterCode,
                    hints: p.hints || [],
                    solution: p.solution || '',
                })));
            } catch (err) {
                console.error('Coding question generation error:', err.message);

                // Better fallback descriptions based on concept
                const fallbackDescriptions = {
                    'arrays': (topic, lang) => `Write a ${lang} program to process an array of integers. Given an input array, perform the following: iterate through elements, apply required logic, return the result. Test with: [1,2,3,4,5] -> output varies based on problem. Handle empty arrays and negative numbers.`,
                    'loops': (topic, lang) => `Write a ${lang} program using loops (for/while). Create a solution that processes data iteratively. Example: calculate sum from 1 to n, or find factorial. Input: 5, Output: 120. Handle edge cases like n=0 or n=1.`,
                    'functions': (topic, lang) => `Create a ${lang} function that takes input, processes it according to ${topic} logic, and returns the result. Define proper parameters and return type. Example input/output should be clearly defined.`,
                    'variables': (topic, lang) => `Write a ${lang} program that declares appropriate variables and performs calculations. Use correct data types. Example: store values, perform arithmetic operations, output result.`,
                    'conditionals': (topic, lang) => `Write a ${lang} program using if-else conditions. Handle multiple test cases based on different input conditions. Example: check if number is positive/negative/zero.`,
                    'strings': (topic, lang) => `Write a ${lang} program to process strings. Handle operations like reverse, palindrome check, or character counting. Input: "hello" -> Output varies. Handle empty strings.`,
                    'objects': (topic, lang) => `Create a ${lang} class/object with properties and methods to solve the ${topic} problem. Define constructor and required methods.`,
                    'recursion': (topic, lang) => `Write a recursive ${lang} function to solve the ${topic} problem. Define proper base case and recursive case. Handle edge cases.`,
                };

                // Fallback if AI fails
                for (let i = 0; i < Math.min(targetCodingCount || 3, codingConcepts.length); i++) {
                    const concept = codingConcepts[i % codingConcepts.length].toLowerCase();
                    const difficulty = difficulties[i % difficulties.length] || codingDifficulty;

                    // Find matching fallback or create generic one
                    const matchingKey = Object.keys(fallbackDescriptions).find(k => concept.includes(k));
                    const desc = matchingKey
                        ? fallbackDescriptions[matchingKey](concept, langLabel)
                        : `Write a ${lang} program to solve a ${concept} problem. Your solution should handle edge cases properly. Input/output will vary based on specific problem requirements.`;

                    result.coding.push({
                        id: `coding-${Date.now()}-${i}`,
                        title: `${codingConcepts[i % codingConcepts.length]} Problem (${difficulty})`,
                        description: desc,
                        difficulty: difficulty,
                        topic: codingConcepts[i % codingConcepts.length],
                        language: langLabel,
                        type: 'coding',
                        marks: marksPerCoding,
                        testCases: [
                            { input: '[1, 2, 3, 4, 5]', output: 'varies' },
                            { input: '[]', output: 'handle empty' }
                        ],
                        constraints: "Time Limit: 1 second\nMemory Limit: 256MB",
                        starterCode: lang === 'python'
                            ? `# ${concept}\ndef solve(input):\n    # Your code here\n    pass`
                            : lang === 'java'
                                ? `// ${concept}\npublic class Solution {\n    public static void main(String[] args) {}\n}`
                                : `// ${concept}\nfunction solve(input) {\n  // Your code here\n}`,
                        solution: `Approach: Use ${concept} logic to solve this problem.`,
                    });
                }
            }
        }

        // Generate Debug questions
        if (sheetType === 'debug' || sheetType === 'mixed') {
            const debugTopics = effectiveTopics.length > 0 ? effectiveTopics : ['JavaScript', 'Python', 'SQL'];

            for (let i = 0; i < Math.min(targetDebugCount || 3, debugTopics.length); i++) {
                const topic = debugTopics[i % debugTopics.length];
                const difficulty = difficulties[i % difficulties.length] || 'medium';

                result.debug.push({
                    id: `debug-${Date.now()}-${i}`,
                    title: `Debug Challenge ${i + 1}: ${topic}`,
                    description: `The following ${topic} code has bugs. Find and fix all the errors to produce the correct output.`,
                    difficulty: difficulty,
                    topic: topic,
                    type: 'debug',
                    marks: marksPerDebug,
                    buggyCode: difficulty === 'easy'
                        ? `// Buggy ${topic} code\nfunction calculate(n) {\n  if (n < 0) {\n    return "Invalid";\n  }\n  let sum = 0;\n  for (let i = 1; i <= n; i++) {\n    sum += i;\n  }\n  return sum;\n}`
                        : difficulty === 'hard'
                            ? `// Complex buggy ${topic} code\nclass DataProcessor {\n  process(data) {\n    let result = [];\n    for (let i = 0; i < data.length; i++) {\n      if (this.validate(data[i])) {\n        result.push(this.transform(data[i]));\n      }\n    }\n    return result.sort((a, b) => a.priority - b.priority);\n  }\n  validate(item) {\n    return item && item.value !== null;\n  }\n}`
                            : `// ${topic} with bugs\nfunction findDuplicates(arr) {\n  let seen = {};\n  let duplicates = [];\n  for (let item of arr) {\n    if (seen[item]) {\n      duplicates.push(item);\n    }\n    seen[item] = true;\n  }\n  return duplicates;\n}`,
                    expectedOutput: `// Correct output should be:\n// The function should return all duplicate values in the array\n// Ensure each duplicate appears only once in the result`,
                    hints: difficulty === 'easy'
                        ? ['Check the loop boundaries', 'Look at the condition carefully']
                        : ['Consider edge cases', 'Review the algorithm logic', 'Test with various inputs'],
                });
            }
        }

        return res.json(result);
    } catch (err) {
        console.error('Generate practice sheet error:', err);
        return res.status(500).json({ error: 'Failed to generate practice sheet: ' + err.message });
    }
});

// GET /api/practice-sheets/topics - Get available topics
router.get('/topics', async (req, res) => {
    try {
        // Return common programming topics
        const topics = [
            'JavaScript',
            'Python',
            'Java',
            'C++',
            'Data Structures',
            'Algorithms',
            'SQL',
            'HTML/CSS',
            'React',
            'Node.js',
            'Excel',
            'General Programming',
        ];
        return res.json(topics);
    } catch (err) {
        console.error('Get topics error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/practice-sheets/batch-details/:batchId - Get batch's topics/curriculum
router.get('/batch-details/:batchId', requireRole('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
    try {
        const { batchId } = req.params;

        if (!batchId) {
            return res.status(400).json({ error: 'Batch ID is required' });
        }

        // Get batch with its tests and questions to extract topics
        const batch = await prisma.batch.findUnique({
            where: { id: batchId },
            include: {
                tests: {
                    where: { isActive: true },
                    include: {
                        questions: {
                            select: { topic: true }
                        }
                    }
                }
            }
        });

        if (!batch) {
            return res.status(404).json({ error: 'Batch not found' });
        }

        // Extract unique topics from all questions in batch's tests
        const topics = [...new Set(
            batch.tests
                .flatMap(t => t.questions.map(q => q.topic))
                .filter(Boolean)
        )];

        // Also get topic counts for each topic
        const topicCounts = {};
        batch.tests.forEach(test => {
            test.questions.forEach(q => {
                if (q.topic) {
                    topicCounts[q.topic] = (topicCounts[q.topic] || 0) + 1;
                }
            });
        });

        return res.json({
            batchId: batch.id,
            batchName: batch.name,
            topics,
            topicCounts,
            testCount: batch.tests.length,
            questionCount: batch.tests.reduce((acc, t) => acc + t.questions.length, 0),
        });
    } catch (err) {
        console.error('Get batch details error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
