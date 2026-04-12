import { AppLayout } from "@/components/AppLayout";
import { Plus, Loader2, Trash2, BookOpen, Sparkles, ChevronDown, ChevronUp, Clock, Calendar, BarChart3, AlertTriangle, X } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { testApi, batchApi, testAnalyticsApi, TestSummary, Batch, NewQuestion, aiApi, Difficulty, AIGeneratedQuestion, TestAnalyticsResponse } from "@/lib/api";
import { todayTests } from "@/data/dummy";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const EMPTY_Q: NewQuestion = {
  questionText: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctOption: "A",
};

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
  { value: "mixed", label: "Mixed" },
];

export default function AdminTests() {
  const [tests, setTests] = useState<TestSummary[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  
  // AI Generation state
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiSubject, setAiSubject] = useState("");
  const [aiTopic, setAiTopic] = useState("");
  const [aiDifficulty, setAiDifficulty] = useState<Difficulty>("medium");
  const [aiNumQuestions, setAiNumQuestions] = useState(5);
  const [aiError, setAiError] = useState("");
  
  // Analytics state
  const [selectedTestAnalytics, setSelectedTestAnalytics] = useState<TestAnalyticsResponse | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Delete state
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; testId: string | null; testTitle: string }>({ open: false, testId: null, testTitle: "" });
  const [deleting, setDeleting] = useState(false);

  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(30);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [questions, setQuestions] = useState<NewQuestion[]>([{ ...EMPTY_Q }]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [t, b] = await Promise.all([testApi.get(), batchApi.get()]);
      setTests(t);
      setBatches(b);
    } catch {
      setTests(
        todayTests.map((t) => ({
          id: String(t.id),
          title: t.name,
          duration: 30,
          batchName: t.course,
          questionCount: 5,
          submissionCount: 0,
          status: t.status as "pending" | "completed",
        }))
      );
    } finally {
      setLoading(false);
    }
  }

  function updateQuestion(index: number, field: keyof NewQuestion, value: string) {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, { ...EMPTY_Q }]);
  }

  function removeQuestion(index: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleGenerateAI() {
    if (!aiSubject.trim()) { setAiError("Subject is required"); return; }
    if (!aiTopic.trim()) { setAiError("Topic is required"); return; }
    
    setGenerating(true);
    setAiError("");
    try {
      const response = await aiApi.generateTest({
        subject: aiSubject.trim(),
        topic: aiTopic.trim(),
        difficulty: aiDifficulty,
        numberOfQuestions: aiNumQuestions,
      });
      
      const generatedQuestions: NewQuestion[] = response.questions.map((q: AIGeneratedQuestion) => ({
        questionText: q.question,
        optionA: q.options.A,
        optionB: q.options.B,
        optionC: q.options.C,
        optionD: q.options.D,
        correctOption: q.correctAnswer,
      }));
      
      setQuestions(generatedQuestions.length > 0 ? generatedQuestions : [{ ...EMPTY_Q }]);
      setShowAIGenerator(false);
      setTitle(`${aiSubject} - ${aiTopic} Quiz`);
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : "Failed to generate questions");
    } finally {
      setGenerating(false);
    }
  }

  async function handleViewAnalytics(testId: string) {
    setLoadingAnalytics(true);
    setShowAnalytics(true);
    try {
      const data = await testAnalyticsApi.get(testId);
      setSelectedTestAnalytics(data);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoadingAnalytics(false);
    }
  }

  async function handleDeleteTest() {
    if (!deleteModal.testId) return;
    setDeleting(true);
    try {
      await testApi.delete(deleteModal.testId);
      setTests((prev) => prev.filter((t) => t.id !== deleteModal.testId));
      setDeleteModal({ open: false, testId: null, testTitle: "" });
      toast.success("Test deleted successfully");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete test");
    } finally {
      setDeleting(false);
    }
  }

  function openDeleteModal(testId: string, testTitle: string) {
    setDeleteModal({ open: true, testId, testTitle });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Test title is required"); return; }
    for (const q of questions) {
      if (!q.questionText || !q.optionA || !q.optionB || !q.optionC || !q.optionD) {
        setError("All question fields are required"); return;
      }
    }
    setCreating(true);
    setError("");
    try {
      const newTest = await testApi.create({
        title: title.trim(),
        duration,
        batchId: selectedBatch || undefined,
        questions,
        expiryDate: expiryDate || undefined,
      });
      setTests((prev) => [{
        id: newTest.id,
        title: newTest.title,
        duration: newTest.duration,
        questionCount: newTest.questions.length,
        status: "pending" as const,
      }, ...prev]);
      setTitle(""); setDuration(30); setSelectedBatch(""); setExpiryDate("");
      setQuestions([{ ...EMPTY_Q }]);
      setShowForm(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create test");
    } finally {
      setCreating(false);
    }
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">Tests</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90"
        >
          <Plus className="w-4 h-4" /> Create Test
        </button>
      </div>

      {/* Create Test Form */}
      {showForm && (
        <div className="bg-card rounded-2xl border border-border p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-foreground">Create New Test</h3>
            <button
              onClick={() => setShowAIGenerator(!showAIGenerator)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90"
            >
              <Sparkles className="w-4 h-4" />
              Generate with AI
            </button>
          </div>
          
          {/* AI Generator Section */}
          {showAIGenerator && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-xl p-4 mb-5 border border-purple-200/50 dark:border-purple-800/50">
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2 text-purple-700 dark:text-purple-300">
                <Sparkles className="w-4 h-4" />
                AI Test Generator
              </h4>
              {aiError && (
                <p className="text-sm text-destructive mb-3 bg-destructive/10 px-3 py-2 rounded-lg">
                  {aiError}
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Subject *</label>
                  <input
                    type="text"
                    value={aiSubject}
                    onChange={(e) => setAiSubject(e.target.value)}
                    placeholder="e.g. Excel"
                    className="w-full px-3 py-2 rounded-lg bg-card border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Topic *</label>
                  <input
                    type="text"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="e.g. VLOOKUP"
                    className="w-full px-3 py-2 rounded-lg bg-card border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Difficulty</label>
                  <select
                    value={aiDifficulty}
                    onChange={(e) => setAiDifficulty(e.target.value as Difficulty)}
                    className="w-full px-3 py-2 rounded-lg bg-card border border-border text-foreground text-sm focus:outline-none focus:border-purple-500"
                  >
                    {DIFFICULTIES.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Questions</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={aiNumQuestions}
                    onChange={(e) => setAiNumQuestions(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-card border border-border text-foreground text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
              <button
                onClick={handleGenerateAI}
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-60"
              >
                {generating && <Loader2 className="w-4 h-4 animate-spin" />}
                {generating ? "Generating..." : "Generate Questions"}
              </button>
            </div>
          )}
          
          {error && (
            <p className="text-sm text-destructive mb-4 bg-destructive/10 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
          <form onSubmit={handleCreate} className="space-y-5">
            {/* Test Meta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-1">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Test Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Excel Formulas Quiz"
                  className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/60"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Duration (min)</label>
                <input
                  type="number"
                  min={5}
                  max={180}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary/60"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Assign to Batch</label>
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary/60"
                >
                  <option value="">All Batches</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Expiry Date</label>
                <input
                  type="datetime-local"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary/60"
                />
              </div>
            </div>

            {/* Questions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">Questions ({questions.length})</h4>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="text-xs font-medium text-primary flex items-center gap-1 hover:opacity-80"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Question
                </button>
              </div>
              {questions.map((q, idx) => (
                <div key={idx} className="bg-secondary rounded-2xl p-4 border border-border relative">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Question {idx + 1}
                    </p>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(idx)}
                        className="text-destructive hover:opacity-70"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <textarea
                    value={q.questionText}
                    onChange={(e) => updateQuestion(idx, "questionText", e.target.value)}
                    placeholder="Enter question text…"
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 mb-3 resize-none"
                  />
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {(["A", "B", "C", "D"] as const).map((letter) => {
                      const field = `option${letter}` as keyof NewQuestion;
                      return (
                        <div key={letter} className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-card flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                            {letter}
                          </span>
                          <input
                            type="text"
                            value={q[field] as string}
                            onChange={(e) => updateQuestion(idx, field, e.target.value)}
                            placeholder={`Option ${letter}`}
                            className="flex-1 px-3 py-2 rounded-xl bg-card border border-border text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:border-primary/60"
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-medium text-muted-foreground">Correct Answer:</label>
                    {(["A", "B", "C", "D"] as const).map((letter) => (
                      <label key={letter} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name={`correct-${idx}`}
                          value={letter}
                          checked={q.correctOption === letter}
                          onChange={() => updateQuestion(idx, "correctOption", letter)}
                          className="accent-primary"
                        />
                        <span className="text-xs font-medium text-foreground">{letter}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={creating}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-60"
              >
                {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Test
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setError(""); }}
                className="px-6 py-2.5 rounded-xl text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Test Analytics Modal */}
      {showAnalytics && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-xl">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-lg">Test Analytics</h3>
              <button
                onClick={() => { setShowAnalytics(false); setSelectedTestAnalytics(null); }}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-auto max-h-[calc(90vh-80px)]">
              {loadingAnalytics ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 rounded-xl" />
                  <Skeleton className="h-64 rounded-xl" />
                </div>
              ) : selectedTestAnalytics ? (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Total Attempts</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{selectedTestAnalytics.summary.totalStudents}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Avg Score</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{selectedTestAnalytics.summary.avgScore}%</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Pass Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{selectedTestAnalytics.summary.passRate}%</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Highest Score</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{selectedTestAnalytics.summary.highestScore}%</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Most Difficult Questions */}
                  {selectedTestAnalytics.mostDifficultQuestions.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <span className="text-destructive">⚠️</span> Most Difficult Questions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {selectedTestAnalytics.mostDifficultQuestions.map((q, i) => (
                            <div key={q.questionId} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                              <div className="flex-1 min-w-0 mr-4">
                                <p className="text-sm truncate">{q.questionText}</p>
                                <p className="text-xs text-muted-foreground">{q.correctPercentage}% correct</p>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                q.difficulty === 'hard' ? 'bg-destructive/10 text-destructive' :
                                q.difficulty === 'medium' ? 'bg-warning/10 text-warning' :
                                'bg-success/10 text-success'
                              }`}>
                                {q.difficulty}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Student Results */}
                  {selectedTestAnalytics.students.length > 0 ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Student Results</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {selectedTestAnalytics.students.map((student, i) => (
                            <div key={student.studentId} className="flex items-center gap-4 py-3 border-b border-border/50 last:border-0">
                              <span className="text-lg font-bold text-muted-foreground w-6">#{i + 1}</span>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">{student.name}</p>
                                <p className="text-xs text-muted-foreground">{student.email}</p>
                                {student.weakAreas.length > 0 && (
                                  <p className="text-xs text-destructive mt-1">
                                    Weak in: {student.weakAreas.slice(0, 2).join(", ")}
                                    {student.weakAreas.length > 2 && ` +${student.weakAreas.length - 2}`}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <div className={`text-lg font-bold ${
                                  student.percentage >= 70 ? 'text-success' :
                                  student.percentage >= 40 ? 'text-warning' :
                                  'text-destructive'
                                }`}>
                                  {student.percentage}%
                                </div>
                                <p className="text-xs text-muted-foreground">{student.score}/{student.totalMarks}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="py-8 text-center text-muted-foreground">
                        No students have attempted this test yet
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No analytics data available</p>
              )}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : tests.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No tests yet. Create your first test!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tests.map((test) => (
            <div
              key={test.id}
              className="flex items-center gap-4 bg-card rounded-2xl p-4 border border-border shadow-sm hover:shadow-md transition-shadow"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                  test.isExpired ? 'bg-muted' : test.status === "completed" ? "bg-card-green" : "bg-card-orange"
                }`}
              >
                {test.isExpired ? "🔒" : test.status === "completed" ? "✅" : "📋"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{test.title}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{test.batchName || "All Batches"}</span>
                  <span>•</span>
                  <span>{test.questionCount} questions</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {test.duration} min
                  </span>
                  {test.expiryDate && (
                    <>
                      <span>•</span>
                      <span className={`flex items-center gap-1 ${test.isExpired ? 'text-destructive' : ''}`}>
                        <Calendar className="w-3 h-3" />
                        {new Date(test.expiryDate).toLocaleDateString()}
                      </span>
                    </>
                  )}
                  {test.submissionCount !== undefined && test.submissionCount > 0 && (
                    <>
                      <span>•</span>
                      <span>{test.submissionCount} submissions</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleViewAnalytics(test.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  Analytics
                </button>
                <button
                  onClick={() => openDeleteModal(test.id, test.title)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                    test.isExpired ? 'bg-muted text-muted-foreground' :
                    test.status === "completed" || test.submissionCount ? 'bg-card-green' : 'bg-card-orange'
                  }`}
                >
                  {test.isExpired ? 'Expired' : test.status || "active"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Delete Test</h3>
                <p className="text-xs text-muted-foreground">This action cannot be undone</p>
              </div>
              <button
                onClick={() => setDeleteModal({ open: false, testId: null, testTitle: "" })}
                className="ml-auto text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to permanently delete <span className="font-medium text-foreground">"{deleteModal.testTitle}"</span>? 
              All questions, results, and submissions will be deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ open: false, testId: null, testTitle: "" })}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTest}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-60"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
