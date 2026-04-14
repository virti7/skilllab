// Judge0 service - disabled
// Local execution is handled by compiler.service.js using Node.js spawn

export const runCode = async ({ code, language, input = "" }) => {
  return {
    output: "Code execution is currently disabled. Please use local execution.",
    status: "Disabled",
    runtime: null,
    memory: null
  };
};

export async function submitCode(code, language, testCases) {
  return {
    results: testCases.map(tc => ({
      input: tc.input,
      expectedOutput: tc.expectedOutput || tc.output || '',
      actualOutput: '',
      passed: false,
      runtime: null,
      memory: null,
      error: 'Code execution is disabled'
    })),
    passed: 0,
    total: testCases.length,
    accuracy: 0,
    runtime: null,
    memory: null,
  };
}

export function validateLanguage(language) {
  return ['c', 'cpp', 'java', 'python'].includes(language.toLowerCase());
}

export function getSupportedLanguages() {
  return ['c', 'cpp', 'java', 'python'];
}