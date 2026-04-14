import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';

const COMPILE_TIMEOUT = 5000;
const EXECUTION_TIMEOUT = 2000;
const isWindows = process.platform === 'win32';

function formatInput(input) {
  const trimmed = (input || '').trim();
  
  if (!trimmed) {
    return input;
  }
  
  if (trimmed.startsWith('[')) {
    try {
      const arr = JSON.parse(trimmed);
      if (Array.isArray(arr)) {
        const formattedInput = arr.length + "\n" + arr.join(" ");
        console.log("Formatted Input:", formattedInput);
        return formattedInput;
      }
    } catch (e) {
      return input;
    }
  }
  
  return input;
}

function wrapCodeIfNeeded(code, language) {
  const lang = language.toLowerCase();
  const trimmed = code.trim();
  
  if (lang === 'python') {
    if (trimmed.includes('if __name__') || trimmed.includes('def main()')) {
      return code;
    }
    return `import sys

${code}

def main():
    data = sys.stdin.read().strip()
    if not data:
        return
    lines = data.strip().split('\\n')
    n = int(lines[0].strip())
    arr = list(map(int, lines[1].strip().split()))[:n]
    result = solve(arr)
    print(result, end='')

if __name__ == "__main__":
    main()
`;
  }
  
  if (lang === 'cpp') {
    if (trimmed.includes('int main(') || trimmed.includes('void main(')) {
      return code;
    }
    return `#include <bits/stdc++.h>
using namespace std;

${code}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    
    int n;
    if (!(cin >> n)) return 0;
    vector<int> arr(n);
    for (int i = 0; i < n; i++) cin >> arr[i];
    
    int result = solve(arr);
    cout << result;
    return 0;
}`;
  }
  
  if (lang === 'c') {
    if (trimmed.includes('int main(') || trimmed.includes('void main(')) {
      return code;
    }
    return `#include <stdio.h>
#include <stdlib.h>

${code}

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    int* arr = (int*)malloc(n * sizeof(int));
    for (int i = 0; i < n; i++) scanf("%d", &arr[i]);
    
    int result = solve(arr, n);
    printf("%d", result);
    
    free(arr);
    return 0;
}`;
  }
  
  if (lang === 'java') {
    if (trimmed.includes('public static void main') || trimmed.includes('class Main')) {
      return code;
    }
    return `import java.io.*;
import java.util.*;

public class Main {
    ${code}
    
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String line = br.readLine();
        if (line == null || line.isEmpty()) return;
        
        int n = Integer.parseInt(line.trim());
        int[] arr = new int[n];
        String[] parts = br.readLine().trim().split(" ");
        for (int i = 0; i < n; i++) {
            arr[i] = Integer.parseInt(parts[i]);
        }
        
        int result = solve(arr);
        System.out.print(result);
    }
}`;
  }
  
  return code;
}

const languageConfig = {
  c: {
    extension: 'c',
    filename: 'main.c',
    compile: isWindows 
      ? ['g++', 'main.c', '-o', 'main.exe']
      : ['gcc', 'main.c', '-o', 'main'],
    run: isWindows ? ['main.exe'] : ['./main'],
  },
  cpp: {
    extension: 'cpp',
    filename: 'main.cpp',
    compile: isWindows
      ? ['g++', 'main.cpp', '-o', 'main.exe']
      : ['g++', 'main.cpp', '-o', 'main'],
    run: isWindows ? ['main.exe'] : ['./main'],
  },
  java: {
    extension: 'java',
    filename: 'Main.java',
    compile: ['javac', 'Main.java'],
    run: ['java', 'Main'],
  },
  python: {
    extension: 'py',
    filename: 'main.py',
    compile: null,
    run: ['python', 'main.py'],
  },
};

function validateLanguage(language) {
  return language.toLowerCase() in languageConfig;
}

async function createTempDir() {
  const tempDir = path.join(os.tmpdir(), `compiler_${randomUUID()}`);
  await fs.mkdir(tempDir, { recursive: true });
  return tempDir;
}

async function cleanup(tempDir) {
  if (!tempDir) return;
  
  await new Promise(resolve => setTimeout(resolve, 100));
  
  try {
    await fs.rm(tempDir, { recursive: true, force: true });
  } catch (error) {
    console.error('Cleanup warning:', error.message);
  }
}

function spawnWithTimeout(command, args, options, timeout, inputData = null) {
  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    let resolved = false;
    let proc;

    const cleanupAndResolve = (data) => {
      if (resolved) return;
      resolved = true;
      if (proc && !proc.killed) {
        try {
          proc.kill('SIGKILL');
        } catch (e) {}
      }
      resolve(data);
    };

    try {
      const spawnOptions = {
        ...options,
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true,
      };

      proc = spawn(command, args, spawnOptions);

      const timer = setTimeout(() => {
        if (!resolved) {
          cleanupAndResolve({ stdout, stderr, exitCode: null, timedOut: true });
        }
      }, timeout);

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        clearTimeout(timer);
        cleanupAndResolve({ stdout, stderr, exitCode: code, timedOut: false });
      });

      proc.on('error', (error) => {
        clearTimeout(timer);
        if (!resolved) {
          resolved = true;
          reject(error);
        }
      });

      if (inputData !== null && proc.stdin) {
        if (inputData) {
          const formattedInput = formatInput(inputData);
          proc.stdin.write(formattedInput);
        }
        proc.stdin.end();
      } else if (proc.stdin) {
        proc.stdin.end();
      }

    } catch (error) {
      reject(error);
    }
  });
}

async function compileCode(tempDir, config) {
  if (!config.compile) {
    return { success: true, stderr: '', stdout: '' };
  }

  const result = await spawnWithTimeout(
    config.compile[0],
    config.compile.slice(1),
    { cwd: tempDir },
    COMPILE_TIMEOUT
  );

  if (result.timedOut) {
    return { success: false, error: 'Compilation timed out', timedOut: true };
  }

  if (result.exitCode !== 0) {
    const errorOutput = result.stderr || result.stdout || 'Compilation failed';
    return { success: false, error: errorOutput, timedOut: false };
  }

  return { success: true, stderr: result.stderr, stdout: result.stdout };
}

async function executeCode(tempDir, config, input) {
  const result = await spawnWithTimeout(
    config.run[0],
    config.run.slice(1),
    { cwd: tempDir },
    EXECUTION_TIMEOUT,
    input
  );

  if (result.timedOut) {
    return { stdout: result.stdout, stderr: '', timedOut: true, exitCode: null };
  }

  return {
    stdout: result.stdout,
    stderr: result.stderr,
    timedOut: false,
    exitCode: result.exitCode
  };
}

function trimOutput(output) {
  if (!output) return '';
  return output.toString().trim();
}

async function runSingleTest({ code, language, input }) {
  const lang = language.toLowerCase();
  
  if (!validateLanguage(lang)) {
    return {
      input,
      output: '',
      expectedOutput: '',
      actualOutput: '',
      passed: false,
      status: 'Compilation Error',
      error: `Unsupported language: ${language}`,
      runtime: null,
    };
  }

  const config = languageConfig[lang];
  const tempDir = await createTempDir();

  try {
    const wrappedCode = wrapCodeIfNeeded(code, lang);
    const filePath = path.join(tempDir, config.filename);
    await fs.writeFile(filePath, wrappedCode, 'utf8');

    const compileResult = await compileCode(tempDir, config);
    
    if (!compileResult.success) {
      return {
        input,
        output: '',
        expectedOutput: '',
        actualOutput: '',
        passed: false,
        status: 'Compilation Error',
        error: compileResult.error,
        runtime: null,
      };
    }

    const startTime = Date.now();
    const runResult = await executeCode(tempDir, config, input);
    const duration = Date.now() - startTime;

    if (runResult.timedOut) {
      return {
        input,
        output: '',
        expectedOutput: '',
        actualOutput: '',
        passed: false,
        status: 'TLE',
        error: 'Time Limit Exceeded',
        runtime: duration,
      };
    }

    if (runResult.stderr && runResult.exitCode !== 0) {
      return {
        input,
        output: runResult.stdout,
        expectedOutput: '',
        actualOutput: trimOutput(runResult.stdout),
        passed: false,
        status: 'Runtime Error',
        error: runResult.stderr,
        runtime: duration,
      };
    }

    return {
      input,
      output: runResult.stdout,
      expectedOutput: '',
      actualOutput: trimOutput(runResult.stdout),
      passed: null,
      status: 'Success',
      error: null,
      runtime: duration,
    };

  } catch (error) {
    console.error('Run error:', error);
    return {
      input,
      output: '',
      expectedOutput: '',
      actualOutput: '',
      passed: false,
      status: 'Runtime Error',
      error: error.message,
      runtime: null,
    };
  } finally {
    await cleanup(tempDir);
  }
}

async function runCode({ code, language, sampleTestCases = [] }) {
  const lang = language.toLowerCase();
  
  if (!validateLanguage(lang)) {
    return {
      results: [],
      status: 'Compilation Error',
      executionTime: null,
      memory: null,
      error: `Unsupported language: ${language}`,
    };
  }

  const config = languageConfig[lang];
  const tempDir = await createTempDir();

  try {
    const wrappedCode = wrapCodeIfNeeded(code, lang);
    const filePath = path.join(tempDir, config.filename);
    await fs.writeFile(filePath, wrappedCode, 'utf8');

    const compileResult = await compileCode(tempDir, config);
    
    if (!compileResult.success) {
      return {
        results: [],
        status: 'Compilation Error',
        executionTime: null,
        memory: null,
        error: compileResult.error,
      };
    }

    const results = [];
    let totalTime = 0;

    for (const testCase of sampleTestCases) {
      const input = testCase.input || '';
      const expectedOutput = (testCase.expectedOutput || '').trim();
      
      const startTime = Date.now();
      const runResult = await executeCode(tempDir, config, input);
      const duration = Date.now() - startTime;
      totalTime += duration;

      const actualOutput = trimOutput(runResult.stdout);
      const expectedTrimmed = expectedOutput.trim();
      const passed = actualOutput === expectedTrimmed;

      results.push({
        input,
        output: runResult.stdout,
        expectedOutput: expectedOutput,
        actualOutput,
        passed,
        status: runResult.timedOut ? 'TLE' : (passed ? 'Passed' : 'Failed'),
        runtime: duration,
        error: runResult.timedOut ? 'Time Limit Exceeded' : runResult.stderr,
      });
    }

    const passedCount = results.filter(r => r.passed).length;
    const failedCount = results.filter(r => !r.passed).length;

    return {
      results,
      status: failedCount > 0 ? 'Failed' : 'Passed',
      executionTime: totalTime,
      memory: null,
    };

  } catch (error) {
    console.error('Run error:', error);
    return {
      results: [],
      status: 'Runtime Error',
      executionTime: null,
      memory: null,
      error: error.message,
    };
  } finally {
    await cleanup(tempDir);
  }
}

async function submitCode({ code, language, testCases = [] }) {
  const results = [];
  let passed = 0;
  let totalTime = 0;

  for (const testCase of testCases) {
    try {
      const input = testCase.input || '';
      const expectedOutput = (testCase.expectedOutput || '').trim();
      
      const runResult = await runSingleTest({ code, language, input });

      const actualOutput = runResult.actualOutput || '';
      const expectedTrimmed = expectedOutput.trim();
      const passedTest = actualOutput === expectedTrimmed && runResult.status === 'Success';

      if (passedTest) {
        passed++;
      }

      totalTime += runResult.runtime || 0;

      results.push({
        input,
        expectedOutput,
        actualOutput,
        passed: passedTest,
        status: runResult.status,
        runtime: runResult.runtime,
        error: runResult.error,
      });
    } catch (error) {
      results.push({
        input: testCase.input || '',
        expectedOutput: testCase.expectedOutput || '',
        actualOutput: '',
        passed: false,
        status: 'Runtime Error',
        runtime: null,
        error: error.message,
      });
    }
  }

  const total = testCases.length;
  const accuracy = total > 0 ? (passed / total) * 100 : 0;
  const status = passed === total ? 'Accepted' : 'Wrong Answer';

  return {
    results,
    passed,
    total,
    accuracy,
    status,
    executionTime: totalTime,
    memory: null,
  };
}

export {
  runCode,
  submitCode,
  runSingleTest,
  validateLanguage,
  languageConfig,
  wrapCodeIfNeeded,
};