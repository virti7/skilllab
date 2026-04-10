import { AppLayout } from "@/components/AppLayout";
import { Plus, Loader2, Trash2, BookOpen } from "lucide-react";
import { useState, useEffect } from "react";
import { testApi, batchApi, TestSummary, Batch, NewQuestion } from "@/lib/api";
import { todayTests } from "@/data/dummy";

const EMPTY_Q: NewQuestion = {
  questionText: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctOption: "A",
};

export default function AdminTests() {
  const [tests, setTests] = useState<TestSummary[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(30);
  const [selectedBatch, setSelectedBatch] = useState("");
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
      });
      setTests((prev) => [{
        id: newTest.id,
        title: newTest.title,
        duration: newTest.duration,
        questionCount: newTest.questions.length,
        status: "pending" as const,
      }, ...prev]);
      setTitle(""); setDuration(30); setSelectedBatch("");
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
          <h3 className="font-semibold text-foreground mb-5">Create New Test</h3>
          {error && (
            <p className="text-sm text-destructive mb-4 bg-destructive/10 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
          <form onSubmit={handleCreate} className="space-y-5">
            {/* Test Meta */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
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
              className="flex items-center gap-4 bg-card rounded-2xl p-4 border border-border shadow-sm"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                  test.status === "completed" ? "bg-card-green" : "bg-card-orange"
                }`}
              >
                {test.status === "completed" ? "✅" : "📋"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{test.title}</p>
                <p className="text-xs text-muted-foreground">
                  {test.batchName || "All Batches"} · {test.questionCount} questions · {test.duration} min
                  {test.submissionCount !== undefined && ` · ${test.submissionCount} submissions`}
                </p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                  test.status === "completed" ? "bg-card-green" : "bg-card-orange"
                }`}
              >
                {test.status || "active"}
              </span>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
