import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { codingApi, CodingTestWithQuestions, RunCodeResult, CodingSubmitResult } from '@/lib/api';
import { Loader2, Play, Send, ArrowLeft, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const LANGUAGES = [
  { value: 'python', label: 'Python', monaco: 'python' },
  { value: 'java', label: 'Java', monaco: 'java' },
  { value: 'cpp', label: 'C++', monaco: 'cpp' },
  { value: 'c', label: 'C', monaco: 'c' },
];

const BOILERPLATES: Record<string, string> = {
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {

    return 0;
}`,

  c: `#include <stdio.h>

int main() {

    return 0;
}`,

  java: `import java.util.*;

public class Main {
    public static void main(String[] args) {

    }
}`,

  python: `def solve():
    pass

if __name__ == "__main__":
    solve()`,
};

const INITIAL_CODE: Record<string, string> = {
  python: `# Write your Python code here
def solve(arr):
    # Your solution
    pass
`,
  java: `public class Solution {
    public int solve(int[] arr) {
        // Your solution
        return 0;
    }
}
`,
  cpp: `#include <vector>
#include <iostream>
using namespace std;

int solve(vector<int>& arr) {
    // Your solution
    return 0;
}
`,
  c: `#include <stdio.h>

int solve(int* arr, int n) {
    // Your solution
    return 0;
}
`,
};

export default function CodingTestPage() {
  const navigate = useNavigate();
  const { testId } = useParams();
  const [test, setTest] = useState<CodingTestWithQuestions | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [codeMap, setCodeMap] = useState<Record<string, string>>({});
  const [language, setLanguage] = useState('python');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runResult, setRunResult] = useState<RunCodeResult | null>(null);
  const [submitResult, setSubmitResult] = useState<CodingSubmitResult | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submissions, setSubmissions] = useState<Record<string, CodingSubmitResult>>({});
  const [editorWidth, setEditorWidth] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const questions = test?.questions || [];
  const currentQuestion = questions[currentQuestionIndex]?.codingQuestion;

  useEffect(() => {
    if (testId) {
      loadTest();
    }
  }, [testId]);

  useEffect(() => {
    if (test) {
      setTimeLeft(test.duration * 60);
    }
  }, [test]);

  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [tabWarning, setTabWarning] = useState<string | null>(null);

  useEffect(() => {
    if (submitted) return;

    const handleVisibility = () => {
      if (document.hidden) {
        setTabSwitchCount(prev => {
          const newCount = prev + 1;
          if (newCount === 1) {
            setTabWarning('Warning: Do not switch tabs during the test.');
            setTimeout(() => setTabWarning(null), 3000);
          } else if (newCount >= 2) {
            setTabWarning('Test auto-submitted due to tab switching.');
            setTimeout(() => {
              handleAutoSubmit();
            }, 2000);
          }
          return newCount;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [submitted]);

  useEffect(() => {
    if (submitted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [submitted, timeLeft]);

  async function loadTest() {
    if (!testId) return;
    try {
      const data = await codingApi.getTestById(testId);
      setTest(data);
      const initialCodeMap: Record<string, string> = {};
      data.questions.forEach((q) => {
        const lang = q.codingQuestion.language || 'python';
        const starterCode = q.codingQuestion.starterCode;
        if (starterCode && typeof starterCode === 'object') {
          initialCodeMap[q.codingQuestion.id] = starterCode[lang] || BOILERPLATES[lang] || '';
        } else if (starterCode && typeof starterCode === 'string') {
          initialCodeMap[q.codingQuestion.id] = starterCode;
        } else {
          initialCodeMap[q.codingQuestion.id] = BOILERPLATES[lang] || '';
        }
      });
      setCodeMap(initialCodeMap);
    } catch (err) {
      console.error('Failed to load test:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const leftPanelWidth = containerWidth * 0.4;
      setEditorWidth(containerWidth - leftPanelWidth - 4);
    }
  }, [loading]);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    startX.current = e.clientX;
    startWidth.current = editorWidth || 0;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const delta = e.clientX - startX.current;
      const newWidth = Math.max(300, Math.min(startWidth.current + delta, 800));
      setEditorWidth(newWidth);
    };
    
    const handleMouseUp = () => {
      isResizing.current = false;
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [editorWidth]);

  const getCurrentCode = useCallback(() => {
    if (!currentQuestion) return '';
    return codeMap[currentQuestion.id] || '';
  }, [codeMap, currentQuestion]);

  const setCurrentCode = useCallback((value: string) => {
    if (!currentQuestion) return;
    setCodeMap((prev) => ({ ...prev, [currentQuestion.id]: value }));
  }, [currentQuestion]);

  const handleLanguageChange = useCallback((newLang: string) => {
    setLanguage(newLang);
    if (!currentQuestion) return;
    
    const q = questions[currentQuestionIndex];
    const starterCode = q.codingQuestion.starterCode;
    let newCode = '';
    
    if (starterCode) {
      if (typeof starterCode === 'object') {
        newCode = starterCode[newLang] || BOILERPLATES[newLang] || '';
      } else {
        newCode = starterCode;
      }
    } else {
      newCode = BOILERPLATES[newLang] || '';
    }
    
    setCodeMap(prev => ({ ...prev, [currentQuestion.id]: newCode }));
    setRunResult(null);
    setSubmitResult(null);
  }, [currentQuestion, questions, currentQuestionIndex]);

  async function handleRun() {
    const code = getCurrentCode();
    if (!currentQuestion || !code.trim()) return;
    setRunning(true);
    setRunResult(null);
    try {
      const result = await codingApi.runCode(code, language, currentQuestion.id);
      setRunResult(result);
    } catch (err) {
      console.error('Run error:', err);
    } finally {
      setRunning(false);
    }
  }

  async function handleSubmit() {
    const code = getCurrentCode();
    if (!currentQuestion || !testId || !code.trim()) return;
    setSubmitting(true);
    try {
      const result = await codingApi.submitCode(currentQuestion.id, code, language, testId);
      setSubmitResult(result);
      setSubmissions((prev) => ({ ...prev, [currentQuestion.id]: result }));
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAutoSubmit() {
    if (submitted) return;
    setSubmitted(true);
    for (const q of questions) {
      const code = codeMap[q.codingQuestion.id] || '';
      if (code.trim()) {
        try {
          const result = await codingApi.submitCode(q.codingQuestion.id, code, language, testId);
          setSubmissions((prev) => ({ ...prev, [q.codingQuestion.id]: result }));
        } catch (err) {
          console.error('Auto submit error:', err);
        }
      }
    }
    navigate('/student/coding/history');
  }

  function handleNextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setRunResult(null);
      setSubmitResult(null);
    }
  }

  function handlePrevQuestion() {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setRunResult(null);
      setSubmitResult(null);
    }
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center'>
        <Loader2 className='w-8 h-8 animate-spin text-primary' />
      </div>
    );
  }

  if (!test || !currentQuestion) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center'>
        <div className='text-center'>
          <AlertCircle className='w-12 h-12 text-destructive mx-auto mb-4' />
          <p className='text-lg font-semibold mb-2'>Test Not Found</p>
          <Button onClick={() => navigate('/student/coding')}>Go Back</Button>
        </div>
      </div>
    );
  }

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const isTimeWarning = mins < 5;

  return (
    <div className='min-h-screen bg-background flex flex-col h-screen'>
      {tabWarning && (
        <div className='fixed top-0 left-0 right-0 z-50 px-4 py-3 bg-red-500 text-white text-center font-semibold animate-pulse'>
          {tabWarning}
        </div>
      )}
      <header className='h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0'>
        <div className='flex items-center gap-3'>
          <button
            onClick={() => navigate('/student/coding')}
            className='flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors'
          >
            <ArrowLeft className='w-4 h-4' />
          </button>
          <div>
            <h1 className='font-semibold text-foreground text-sm md:text-base'>{test.title}</h1>
            <div className='flex items-center gap-2 text-xs text-muted-foreground'>
              <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            </div>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm ${
          isTimeWarning ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'
        }`}>
          <Clock className='w-4 h-4' />
          {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </div>
      </header>

      <div className='flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/30'>
        {questions.map((q, i) => {
          const isSubmitted = submissions[q.codingQuestion.id];
          return (
            <button
              key={q.codingQuestion.id}
              onClick={() => {
                setCurrentQuestionIndex(i);
                setRunResult(null);
                setSubmitResult(null);
              }}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                i === currentQuestionIndex
                  ? 'bg-primary text-primary-foreground'
                  : isSubmitted
                  ? 'bg-green-500/20 text-green-500'
                  : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <div className='flex-1 flex overflow-hidden' ref={containerRef}>
        <div className='w-[40%] min-w-[300px] max-w-[500px] border-r border-border flex flex-col bg-card'>
          <div className='p-4 border-b border-border'>
            <div className='flex items-center gap-2 mb-2'>
              <Badge variant='outline' className={
                currentQuestion.difficulty === 'easy' ? 'text-green-500' :
                currentQuestion.difficulty === 'medium' ? 'text-yellow-500' : 'text-red-500'
              }>
                {currentQuestion.difficulty}
              </Badge>
              <span className='text-xs text-muted-foreground capitalize'>{currentQuestion.topic}</span>
              {submissions[currentQuestion.id] && (
                <CheckCircle className='w-4 h-4 text-green-500 ml-auto' />
              )}
            </div>
            <h2 className='font-semibold text-foreground mb-2'>{currentQuestion.title}</h2>
            <p className='text-sm text-muted-foreground leading-relaxed'>{currentQuestion.description}</p>
          </div>
          
          <div className='p-4 flex-1 overflow-y-auto'>
            <h4 className='font-semibold text-sm mb-3'>Test Cases</h4>
            {(currentQuestion.testCases || []).length > 0 ? (
              <div className='space-y-2'>
                {currentQuestion.testCases.map((tc, i) => (
                  <div key={i} className='border rounded-lg p-3 text-xs'>
                    <div className='text-muted-foreground mb-1'>Input: <span className='font-mono'>{tc.input || '(none)'}</span></div>
                    <div className='text-muted-foreground'>Expected: <span className='font-mono'>{tc.expectedOutput}</span></div>
                  </div>
                ))}
              </div>
            ) : (
              <p className='text-muted-foreground text-sm'>No test cases defined</p>
            )}
          </div>
        </div>

        <div
          className="w-1 hover:w-1.5 bg-border hover:bg-primary cursor-col-resize transition-colors flex-shrink-0"
          onMouseDown={startResizing}
        />

        <div className='flex-1 flex flex-col min-w-0' style={editorWidth ? { width: editorWidth } : undefined}>
          <div className='h-10 border-b border-border flex items-center justify-between px-3 bg-card'>
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className='text-xs bg-background border rounded px-2 py-1'
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>{lang.label}</option>
              ))}
            </select>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className='text-xs text-muted-foreground hover:text-foreground'
            >
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
          </div>

          <div className='flex-1 min-h-0'>
            <Editor
              height='100%'
              language={language === 'cpp' ? 'cpp' : language}
              value={getCurrentCode()}
              onChange={(value) => setCurrentCode(value || '')}
              theme={theme === 'dark' ? 'vs-dark' : 'light'}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                wordWrap: 'on',
                padding: { top: 10 },
              }}
            />
          </div>

          <div className='h-[180px] border-t border-border bg-card flex flex-col p-3'>
            <div className='flex items-center gap-2 mb-2'>
              <Button
                onClick={handleRun}
                disabled={running || !getCurrentCode().trim()}
                size='sm'
                variant='outline'
                className='h-7 text-xs'
              >
                {running ? <Loader2 className='w-3 h-3 animate-spin mr-1' /> : <Play className='w-3 h-3 mr-1' />}
                Run
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !getCurrentCode().trim()}
                size='sm'
                className='h-7 text-xs'
              >
                {submitting ? <Loader2 className='w-3 h-3 animate-spin mr-1' /> : <Send className='w-3 h-3 mr-1' />}
                Submit
              </Button>
              <div className='flex-1' />
              <Button
                onClick={handlePrevQuestion}
                disabled={currentQuestionIndex === 0}
                variant='outline'
                size='sm'
                className='h-7 text-xs'
              >
                Prev
              </Button>
              <Button
                onClick={handleNextQuestion}
                disabled={currentQuestionIndex === questions.length - 1}
                variant='outline'
                size='sm'
                className='h-7 text-xs'
              >
                Next
              </Button>
            </div>

            <div className='flex-1 overflow-y-auto text-xs'>
              {runResult && (
                <div className='space-y-2'>
                  <div className='flex items-center gap-2'>
                    <span className='text-muted-foreground'>Status:</span>
                    {runResult.status === 'Passed' ? (
                      <CheckCircle className='w-4 h-4 text-green-500' />
                    ) : (
                      <XCircle className='w-4 h-4 text-red-500' />
                    )}
                    <span className={runResult.status === 'Passed' ? 'text-green-500' : 'text-red-500'}>
                      {runResult.status}
                    </span>
                  </div>
                </div>
              )}
              {submitResult && (
                <div className='space-y-2'>
                  <div className='flex items-center gap-2'>
                    <span className='text-muted-foreground'>Result:</span>
                    {submitResult.status === 'Accepted' ? (
                      <CheckCircle className='w-4 h-4 text-green-500' />
                    ) : (
                      <XCircle className='w-4 h-4 text-red-500' />
                    )}
                    <span>{submitResult.passed}/{submitResult.total} passed</span>
                    <Badge className={submitResult.status === 'Accepted' ? 'bg-green-500' : 'bg-yellow-500'}>
                      {Math.round(submitResult.accuracy)}%
                    </Badge>
                  </div>
                </div>
              )}
              {!runResult && !submitResult && (
                <p className='text-muted-foreground'>Click Run or Submit to test your code</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}