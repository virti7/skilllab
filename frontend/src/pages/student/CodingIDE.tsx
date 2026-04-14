import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { codingApi, CodingQuestionFull, RunCodeResult, CodingSubmitResult } from "@/lib/api";
import { Loader2, Play, Send, ArrowLeft, CheckCircle, XCircle, AlertCircle, Sparkles, Sun, Moon, Copy, History, Lightbulb, FileCode, Clock, Bug, Maximize2, Minimize2, BarChart3, Zap, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LANGUAGES = [
  { value: "python", label: "Python", monaco: "python" },
  { value: "java", label: "Java", monaco: "java" },
  { value: "cpp", label: "C++", monaco: "cpp" },
  { value: "c", label: "C", monaco: "c" },
];



const LANGUAGE_IDS: Record<string, number> = {
  python: 71,
  java: 62,
  cpp: 54,
  c: 50,
};

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

interface Submission {
  id: string;
  code: string;
  language: string;
  passed: number;
  total: number;
  status: string;
  submittedAt: string;
}

function getDifficultyColor(difficulty: string): string {
  const colors: Record<string, string> = {
    easy: "bg-green-500/10 text-green-600 dark:text-green-400",
    medium: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    hard: "bg-red-500/10 text-red-600 dark:text-red-400",
  };
  return colors[difficulty.toLowerCase()] || colors.easy;
}

function getDifficultyTextColor(difficulty: string): string {
  const colors: Record<string, string> = {
    easy: "text-green-500",
    medium: "text-yellow-500",
    hard: "text-red-500",
  };
  return colors[difficulty.toLowerCase()] || colors.easy;
}

const initialCodeMap: Record<string, string> = {
  python: "",
  java: "",
  cpp: "",
  c: ""
};

export default function CodingIDE() {
  const navigate = useNavigate();
  const { questionId } = useParams();
  const [question, setQuestion] = useState<CodingQuestionFull | null>(null);
  const [codeMap, setCodeMap] = useState<Record<string, string>>(initialCodeMap);
  const [language, setLanguage] = useState("python");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runResult, setRunResult] = useState<RunCodeResult | null>(null);
  const [submitResult, setSubmitResult] = useState<CodingSubmitResult | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [hint, setHint] = useState<string | null>(null);
  const [gettingHint, setGettingHint] = useState(false);
  const [activeTab, setActiveTab] = useState("description");
  const [activeIdeTab, setActiveIdeTab] = useState("output");
  const [copied, setCopied] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [editorWidth, setEditorWidth] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  useEffect(() => {
    if (questionId) {
      loadQuestion();
      loadSubmissions();
    }
  }, [questionId]);

  useEffect(() => {
    if (!isFullScreen && containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const leftPanelWidth = containerWidth * 0.4;
      setEditorWidth(containerWidth - leftPanelWidth);
    }
  }, [isFullScreen]);

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

async function loadQuestion() {
    if (!questionId) return;
    try {
      const data = await codingApi.getQuestionById(questionId);
      setQuestion(data);
      
      const starterCode = data.starterCode;
      const newCodeMap: Record<string, string> = { python: '', java: '', cpp: '', c: '' };
      
      if (starterCode) {
        if (typeof starterCode === 'string') {
          Object.keys(newCodeMap).forEach(lang => {
            newCodeMap[lang] = BOILERPLATES[lang] || '';
          });
          newCodeMap.python = starterCode;
        } else if (typeof starterCode === 'object') {
          Object.keys(newCodeMap).forEach(lang => {
            newCodeMap[lang] = starterCode[lang as keyof typeof starterCode] || BOILERPLATES[lang] || '';
          });
        }
      } else {
        Object.keys(newCodeMap).forEach(lang => {
          newCodeMap[lang] = BOILERPLATES[lang] || '';
        });
      }
      setCodeMap(newCodeMap);
    } catch (err) {
      console.error('Failed to load question:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadSubmissions() {
    if (!questionId) return;
    try {
      const token = localStorage.getItem('skilllab_token');
      const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${BASE_URL}/coding/submissions/${questionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
      }
    } catch (err) {
      console.warn("Could not load submissions:", err);
    }
  }

  function handleLanguageChange(lang: string) {
    setLanguage(lang);
    const starterCode = question?.starterCode;
    
    if (starterCode) {
      if (typeof starterCode === 'string') {
        setCodeMap(prev => ({ ...prev, [lang]: starterCode }));
      } else if (typeof starterCode === 'object') {
        const langCode = starterCode[lang as keyof typeof starterCode];
        setCodeMap(prev => ({ ...prev, [lang]: langCode || BOILERPLATES[lang] || '' }));
      }
    } else {
      setCodeMap(prev => ({ ...prev, [lang]: BOILERPLATES[lang] || '' }));
    }
    
    setRunResult(null);
    setSubmitResult(null);
  }

  function getCurrentCode(): string {
    return codeMap[language] || "";
  }

  function setCurrentCode(value: string) {
    setCodeMap(prev => ({ ...prev, [language]: value }));
  }

  async function handleRun() {
    const currentCode = getCurrentCode();
    if (!currentCode.trim()) return;
    setRunning(true);
    setRunResult(null);
    setActiveIdeTab("output");
    try {
      const result = await codingApi.runCode(currentCode, language, questionId || undefined);
      setRunResult(result);
    } catch (err: any) {
      console.error("Run error:", err);
      setRunResult({
        results: [],
        status: "Error",
        executionTime: null,
        memory: null,
        error: err.message,
      });
    } finally {
      setRunning(false);
    }
  }

  async function handleSubmit() {
    const currentCode = getCurrentCode();
    if (!questionId || !currentCode.trim()) return;
    setSubmitting(true);
    setSubmitResult(null);
    setActiveIdeTab("submit");
    try {
      const result = await codingApi.submitCode(questionId, currentCode, language);
      setSubmitResult(result);
      loadSubmissions();
    } catch (err) {
      console.error("Submit error:", err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGetHint() {
    if (!question) return;
    setGettingHint(true);
    setHint(null);
    try {
      const token = localStorage.getItem('skilllab_token');
      const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${BASE_URL}/coding/hint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          questionId: question.id,
          description: question.description,
          title: question.title,
          code: getCurrentCode()
        })
      });
      const data = await res.json();
      setHint(data.hint || data.message || "No hint available");
    } catch (err) {
      console.error("Hint error:", err);
      setHint("Failed to get hint");
    } finally {
      setGettingHint(false);
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(getCurrentCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-lg font-semibold mb-2">Question Not Found</p>
          <Button onClick={() => navigate("/student/coding")}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background flex flex-col h-screen ${isFullScreen ? 'fixed inset-0 z-50' : ''}`}>
      <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => isFullScreen ? setIsFullScreen(false) : navigate("/student/coding")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-semibold text-foreground text-sm md:text-base">{question.title}</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className={`${getDifficultyTextColor(question.difficulty)} text-[10px] px-1 py-0`}>
                {question.difficulty}
              </Badge>
              <span className="capitalize hidden sm:inline">{question.topic}</span>
              <span className="capitalize hidden sm:inline">{question.type}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value} className="text-xs">
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsFullScreen(!isFullScreen)}
            title={isFullScreen ? "Minimize" : "Maximize"}
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      </header>

      <div className={`flex-1 flex overflow-hidden ${isFullScreen ? 'bg-background' : ''}`} ref={containerRef}>
        {!isFullScreen && (
          <>
            <div className="w-[40%] min-w-[300px] max-w-[500px] border-r border-border flex flex-col bg-card" style={{ width: editorWidth ? undefined : undefined }}>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-2 h-10">
              <TabsTrigger value="description" className="text-xs px-2 h-8">Description</TabsTrigger>
              <TabsTrigger value="testcases" className="text-xs px-2 h-8">Test Cases</TabsTrigger>
              <TabsTrigger value="hints" className="text-xs px-2 h-8">Hints</TabsTrigger>
              <TabsTrigger value="submissions" className="text-xs px-2 h-8">Submissions</TabsTrigger>
            </TabsList>
            
            <ScrollArea className="flex-1">
              <TabsContent value="description" className="m-0 p-4 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className={getDifficultyTextColor(question.difficulty)}>
                      {question.difficulty}
                    </Badge>
                    <span className="text-xs text-muted-foreground capitalize">{question.topic}</span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{question.description}</p>
                </div>

                {(question as any).timeComplexity && (
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">Time Complexity</p>
                    <p className="text-sm font-mono">{(question as any).timeComplexity}</p>
                  </div>
                )}
                {(question as any).spaceComplexity && (
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">Space Complexity</p>
                    <p className="text-sm font-mono">{(question as any).spaceComplexity}</p>
                  </div>
                )}

                {question.constraints && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Constraints</h4>
                    <pre className="bg-muted p-3 rounded-lg text-xs font-mono whitespace-pre-wrap">{question.constraints}</pre>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="testcases" className="m-0 p-4">
                <h4 className="font-semibold text-sm mb-3">Test Cases</h4>
                {(question.testCases || []).length > 0 ? (
                  <div className="space-y-3">
                    {question.testCases.map((tc, i) => (
                      <div key={i} className="border rounded-lg overflow-hidden">
                        <div className="bg-muted px-3 py-2 flex items-center justify-between">
                          <span className="text-xs font-medium">Test Case {i + 1}</span>
                        </div>
                        <div className="p-3 space-y-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Input:</span>
                            <pre className="mt-1 bg-muted/50 p-2 rounded font-mono whitespace-pre-wrap">{tc.input || "(none)"}</pre>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Output:</span>
                            <pre className="mt-1 bg-muted/50 p-2 rounded font-mono whitespace-pre-wrap">{tc.expectedOutput}</pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No test cases defined</p>
                )}
              </TabsContent>
              
              <TabsContent value="hints" className="m-0 p-4">
                <div className="space-y-4">
                  {question.hints ? (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Hints</h4>
                      <p className="text-sm text-muted-foreground">{question.hints}</p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Lightbulb className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                      <p className="text-sm text-muted-foreground mb-3">Need a hint?</p>
                    </div>
                  )}
                  <Button 
                    onClick={handleGetHint} 
                    disabled={gettingHint}
                    variant="outline" 
                    className="w-full"
                  >
                    {gettingHint ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Get AI Hint
                  </Button>
                  {hint && (
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <p className="text-sm">{hint}</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="submissions" className="m-0 p-4">
                <h4 className="font-semibold text-sm mb-3">Submission History</h4>
                {submissions.length > 0 ? (
                  <div className="space-y-2">
                    {submissions.map((sub, i) => (
                      <div 
                        key={sub.id || i} 
                        className="p-3 border rounded-lg flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          {sub.status === 'success' ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          <div>
                            <p className="text-xs font-medium">
                              {sub.passed}/{sub.total} passed
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {sub.language} • {new Date(sub.submittedAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">
                          {sub.language}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <History className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-muted-foreground">No submissions yet</p>
                  </div>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
        </>
        )}

        {!isFullScreen && (
          <div
            className="w-1 hover:w-1.5 bg-border hover:bg-primary cursor-col-resize transition-colors flex-shrink-0"
            onMouseDown={startResizing}
          />
        )}

        <div className={`flex-1 flex flex-col min-w-0 ${isFullScreen ? 'w-full' : ''}`} style={editorWidth && !isFullScreen ? { width: editorWidth } : undefined}>
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language={language === "cpp" ? "cpp" : language}
              value={getCurrentCode()}
              onChange={(value) => setCurrentCode(value || "")}
              theme={theme === "dark" ? "vs-dark" : "light"}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                wordWrap: "on",
                padding: { top: 10 },
              }}
            />
          </div>

          <div className="h-[200px] border-t border-border bg-card flex flex-col">
            <Tabs value={activeIdeTab} onValueChange={setActiveIdeTab} className="flex flex-col h-full">
              <div className="flex items-center justify-between px-3 py-1 border-b border-border">
                <TabsList className="h-8 bg-transparent">
                  <TabsTrigger value="output" className="text-xs h-6 px-2">Output</TabsTrigger>
                  <TabsTrigger value="submit" className="text-xs h-6 px-2">Results</TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleRun}
                    disabled={running || !getCurrentCode().trim()}
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                  >
                    {running ? (
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    ) : (
                      <Play className="w-3 h-3 mr-1" />
                    )}
                    Run
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting || !getCurrentCode().trim()}
                    size="sm"
                    className="h-7 text-xs"
                  >
                    {submitting ? (
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    ) : (
                      <Send className="w-3 h-3 mr-1" />
                    )}
                    Submit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyCode}
                    className="h-7 w-7 p-0"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              
              <ScrollArea className="flex-1 p-3">
                <TabsContent value="output" className="m-0">
                  {running && (
                    <div className="flex flex-col items-center justify-center py-10 space-y-3">
                      <div className="relative">
                        <Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" />
                        <Loader2 className="w-10 h-10 animate-spin text-primary absolute inset-0 [animation-delay:-0.3s]" />
                      </div>
                      <p className="text-sm text-muted-foreground animate-pulse font-medium">Executing your code...</p>
                    </div>
                  )}
                  
                  {runResult && !running && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Status:</span>
                        {runResult.status === "Passed" ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                        <span className={runResult.status === "Passed" ? "text-green-500 font-bold" : "text-red-500 font-bold"}>
                          {runResult.status}
                        </span>
                      </div>
                      
                      {runResult.results && runResult.results.length > 0 && (
                        <div className="space-y-2">
                          {runResult.results.map((result, i) => (
                            <div key={i} className={`p-3 rounded-lg border ${result.passed ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium">Test Case {i + 1}</span>
                                {result.passed ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-500" />
                                )}
                              </div>
                              <div className="text-xs space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Input:</span>
                                  <span className="font-mono ml-2">{result.input || "(none)"}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Expected:</span>
                                  <span className="font-mono ml-2">{result.expectedOutput || "(none)"}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Output:</span>
                                  <span className="font-mono ml-2">{result.actualOutput || "(none)"}</span>
                                </div>
                                {result.error && (
                                  <div className="text-red-400 mt-1">{result.error}</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {runResult.error && (
                        <div className="bg-destructive/10 p-3 rounded-lg border border-destructive/20 shadow-sm">
                          <p className="text-[10px] text-destructive mb-1 font-bold uppercase tracking-widest flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Error
                          </p>
                          <pre className="text-sm font-mono whitespace-pre-wrap text-destructive">
                            {runResult.error}
                          </pre>
                        </div>
                      )}

                      {runResult.executionTime && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-card border border-border px-2 py-1 rounded inline-flex shadow-sm">
                          <Zap className="w-3 h-3" />
                          <span>Time: <span className="font-mono font-bold text-foreground">{runResult.executionTime}ms</span></span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {!runResult && !running && (
                    <div className="flex flex-col items-center justify-center py-10 opacity-40">
                      <Play className="w-10 h-10 mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Ready to execute. Click "Run" or "Submit".
                      </p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="submit" className="m-0">
                  {submitting && (
                    <div className="flex flex-col items-center justify-center py-10 space-y-3">
                      <div className="relative">
                        <Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" />
                        <Loader2 className="w-10 h-10 animate-spin text-primary absolute inset-0 [animation-delay:-0.3s]" />
                      </div>
                      <p className="text-sm text-muted-foreground animate-pulse font-medium">Evaluating your solution...</p>
                    </div>
                  )}
                  
                  {submitResult && !submitting && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {submitResult.status === "Accepted" ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                          <span className="text-sm font-medium">
                            {submitResult.passed}/{submitResult.total} passed
                          </span>
                          <Badge className={submitResult.status === "Accepted" ? "bg-green-500" : "bg-yellow-500"}>
                            {Math.round(submitResult.accuracy)}%
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {submitResult.executionTime && (
                            <span className="flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              {submitResult.executionTime}ms
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {submitResult.results.map((tr, i) => (
                          <div
                            key={i}
                            className={`p-2 rounded-lg text-xs ${
                              tr.passed ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"
                            } border`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {tr.passed ? (
                                  <CheckCircle className="w-3 h-3 text-green-500" />
                                ) : (
                                  <XCircle className="w-3 h-3 text-red-500" />
                                )}
                                <span className="font-medium">Test Case {i + 1}</span>
                              </div>
                              <span className="text-[10px] text-muted-foreground">
                                {tr.status} {tr.runtime ? `(${tr.runtime}ms)` : ''}
                              </span>
                            </div>
                            {!tr.passed && (
                              <div className="mt-1 pl-5 space-y-1">
                                <div><span className="text-muted-foreground">Expected:</span> <span className="font-mono">{tr.expectedOutput}</span></div>
                                <div><span className="text-muted-foreground">Actual:</span> <span className="font-mono">{tr.actualOutput}</span></div>
                                {tr.error && <div className="text-red-400">{tr.error}</div>}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {submitResult.analytics && (
                        <div className="bg-primary/10 p-3 rounded-lg border border-primary/20">
                          <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <span className="font-semibold text-sm">AI Analytics</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <span className="text-muted-foreground">Time:</span>
                              <span className="font-mono font-medium">{submitResult.analytics.timeComplexity}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Cpu className="w-3 h-3 text-muted-foreground" />
                              <span className="text-muted-foreground">Space:</span>
                              <span className="font-mono font-medium">{submitResult.analytics.spaceComplexity}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <BarChart3 className="w-3 h-3 text-muted-foreground" />
                              <span className="text-muted-foreground">Score:</span>
                              <span className="font-mono font-medium">{submitResult.analytics.codeQualityScore || 'N/A'}/10</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Zap className="w-3 h-3 text-muted-foreground" />
                              <span className="text-muted-foreground">Status:</span>
                              <span className="font-mono font-medium">{submitResult.analytics.optimization}</span>
                            </div>
                          </div>
                          {submitResult.analytics.suggestions && submitResult.analytics.suggestions.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-primary/20">
                              <p className="text-[10px] text-muted-foreground mb-1">Suggestions:</p>
                              <ul className="text-xs space-y-1">
                                {submitResult.analytics.suggestions.map((s, i) => (
                                  <li key={i} className="flex items-start gap-1">
                                    <span className="text-primary">•</span>
                                    <span>{s}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {!submitResult && !submitting && (
                    <p className="text-muted-foreground text-sm">
                      Click "Submit" to test your solution
                    </p>
                  )}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}