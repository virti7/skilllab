import { useState, useEffect, useCallback } from "react";
import { testQuestions, testQuestionBank } from "@/data/dummy";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Clock, ArrowLeft, CheckCircle2, XCircle, Download, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import { testApi, TestFull, SubmitResult } from "@/lib/api";

interface LocalQuestion {
  id: string | number;
  question?: string;
  questionText?: string;
  options?: string[];
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correct?: number;
  correctOption?: string;
}

function getOptions(q: LocalQuestion): string[] {
  if (q.options) return q.options;
  return [q.optionA!, q.optionB!, q.optionC!, q.optionD!];
}

function getQuestionText(q: LocalQuestion): string {
  return q.question ?? q.questionText ?? "";
}

function getCorrectIndex(q: LocalQuestion): number {
  if (q.correct !== undefined) return q.correct;
  const map: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
  return q.correctOption ? (map[q.correctOption] ?? 0) : 0;
}

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;

export default function TestPage() {
  const { testId } = useParams();
  const navigate = useNavigate();

  // API state
  const [apiTest, setApiTest] = useState<TestFull | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Quiz state
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  // Resolve questions: API > dummy bank > default
  const questions: LocalQuestion[] = (() => {
    if (apiTest?.questions?.length) {
      return apiTest.questions;
    }
    const numId = testId ? Number(testId) : null;
    if (numId && testQuestionBank[numId]) return testQuestionBank[numId];
    return testQuestions;
  })();

  const durationMinutes = apiTest?.duration ?? questions.length * 2;

  // Fetch test from API
  useEffect(() => {
    if (!testId) {
      setFetchLoading(false);
      return;
    }
    // Check if it's a numeric dummy ID
    const numId = Number(testId);
    if (!isNaN(numId) && numId < 1_000_000) {
      // Dummy/local test
      setFetchLoading(false);
      return;
    }
    // Real UUID — fetch from API
    testApi
      .getById(testId)
      .then((test) => {
        setApiTest(test);
      })
      .catch((err) => {
        setFetchError(err.message);
      })
      .finally(() => setFetchLoading(false));
  }, [testId]);

  // Init timer & answers after questions load
  useEffect(() => {
    if (questions.length > 0 && answers.length === 0) {
      setAnswers(Array(questions.length).fill(null));
      setTimeLeft(durationMinutes * 60);
    }
  }, [questions.length, durationMinutes]);

  // Countdown timer
  useEffect(() => {
    if (submitted || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft((p) => (p <= 0 ? 0 : p - 1)), 1000);
    return () => clearInterval(t);
  }, [submitted, timeLeft]);

  // Auto-submit when timer hits 0
  useEffect(() => {
    if (timeLeft === 0 && !submitted && answers.length > 0) {
      handleSubmit();
    }
  }, [timeLeft]);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const q = questions[current];

  const selectOption = (i: number) => {
    if (submitted) return;
    setSelected(i);
    const newAns = [...answers];
    newAns[current] = i;
    setAnswers(newAns);
  };

  // Local score calculation (for dummy tests or after API submit returns)
  const localScore = submitted
    ? answers.reduce(
        (acc, a, i) => acc + (a === getCorrectIndex(questions[i]) ? 1 : 0),
        0
      )
    : 0;

  const finalScore = submitResult?.score ?? localScore;
  const finalTotal = submitResult?.totalMarks ?? questions.length;
  const percentage = submitResult?.percentage ?? Math.round((localScore / questions.length) * 100);
  const passed = percentage >= 50;

  const handleSubmit = useCallback(async () => {
    if (submitted) return;
    setSubmitted(true);

    // If we have an API test, submit to backend
    if (apiTest && testId) {
      setSubmitting(true);
      try {
        const answerPayload = answers.map((selectedIdx, i) => ({
          questionId: apiTest.questions[i].id,
          selectedOption:
            selectedIdx !== null ? OPTION_LETTERS[selectedIdx] : "",
        }));
        const result = await testApi.submit(testId, answerPayload);
        setSubmitResult(result);
      } catch (err) {
        console.error("Submit error:", err);
      } finally {
        setSubmitting(false);
      }
    }
  }, [submitted, apiTest, testId, answers]);

  const downloadPDF = () => {
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();

    doc.setFillColor(99, 102, 241);
    doc.rect(0, 0, pw, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text("SkillLab - Test Result", pw / 2, 18, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, pw / 2, 30, { align: "center" });

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(14);
    doc.text("Performance Summary", 20, 55);
    doc.setFontSize(36);
    doc.setTextColor(passed ? 34 : 220, passed ? 139 : 53, passed ? 34 : 69);
    doc.text(`${percentage}%`, pw / 2, 80, { align: "center" });
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Score: ${finalScore} / ${finalTotal}`, pw / 2, 90, { align: "center" });
    doc.text(`Status: ${passed ? "PASSED" : "NEEDS IMPROVEMENT"}`, pw / 2, 98, { align: "center" });

    doc.setDrawColor(200, 200, 200);
    doc.line(20, 105, pw - 20, 105);

    doc.setFontSize(13);
    doc.setTextColor(30, 30, 30);
    doc.text("Question-wise Analysis", 20, 115);

    let y = 125;
    questions.forEach((q, i) => {
      if (y > 270) { doc.addPage(); y = 20; }
      const isCorrect = answers[i] === getCorrectIndex(q);
      const opts = getOptions(q);
      doc.setFontSize(10);
      doc.setTextColor(30, 30, 30);
      doc.text(`Q${i + 1}: ${getQuestionText(q)}`, 20, y, { maxWidth: pw - 40 });
      y += 6;
      doc.setFontSize(9);
      doc.setTextColor(isCorrect ? 34 : 220, isCorrect ? 139 : 53, isCorrect ? 34 : 69);
      const yourAns = answers[i] !== null ? opts[answers[i]!] : "Not answered";
      doc.text(`Your answer: ${yourAns} ${isCorrect ? "✓" : "✗"}`, 24, y);
      y += 5;
      if (!isCorrect) {
        doc.setTextColor(34, 139, 34);
        doc.text(`Correct: ${opts[getCorrectIndex(q)]}`, 24, y);
        y += 5;
      }
      y += 4;
    });

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      "Generated by SkillLab Workspace",
      pw / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
    doc.save(`SkillLab_Result_${percentage}pct.pdf`);
  };

  // ── Loading / Error ──────────────────────────────────────────────────────

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-destructive font-medium">{fetchError}</p>
        <Link to="/student/tests" className="text-sm text-primary underline">
          Back to Tests
        </Link>
      </div>
    );
  }

  // ── Result Screen ────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-2xl mx-auto">
          {submitting ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Saving your result…</p>
              </div>
            </div>
          ) : (
            <>
              {/* Score card */}
              <div className="bg-card rounded-2xl p-8 shadow-lg border border-border text-center mb-6">
                <div className="text-5xl mb-3">{passed ? "🎉" : "💪"}</div>
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  {passed ? "Great job!" : "Keep practicing!"}
                </h2>
                <p className="text-muted-foreground mb-4">
                  {passed
                    ? "You've passed the test successfully."
                    : "Review your answers and try again."}
                </p>
                <div
                  className={`text-5xl font-bold mb-2 ${
                    passed ? "text-success" : "text-destructive"
                  }`}
                >
                  {percentage}%
                </div>
                <p className="text-sm text-muted-foreground">
                  {finalScore} correct out of {finalTotal} questions
                </p>
                <div className="flex gap-3 justify-center mt-6">
                  <button
                    onClick={downloadPDF}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    <Download className="w-4 h-4" /> Download PDF
                  </button>
                  <Link
                    to="/student/tests"
                    className="px-5 py-2.5 rounded-xl text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                  >
                    Back to Tests
                  </Link>
                </div>
              </div>

              {/* Answer review — only show for dummy questions (API hides correctOption during test) */}
              {!apiTest && (
                <>
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Answer Review
                  </h3>
                  <div className="space-y-3">
                    {questions.map((q, i) => {
                      const isCorrect = answers[i] === getCorrectIndex(q);
                      const opts = getOptions(q);
                      return (
                        <div
                          key={String(q.id)}
                          className={`bg-card rounded-2xl p-5 border shadow-sm ${
                            isCorrect
                              ? "border-success/30"
                              : "border-destructive/30"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {isCorrect ? (
                              <CheckCircle2 className="w-5 h-5 text-success mt-0.5 shrink-0" />
                            ) : (
                              <XCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
                            )}
                            <div className="flex-1">
                              <p className="text-sm font-medium text-foreground mb-2">
                                Q{i + 1}. {getQuestionText(q)}
                              </p>
                              <div className="space-y-1.5">
                                {opts.map((opt, j) => (
                                  <div
                                    key={j}
                                    className={`text-xs px-3 py-2 rounded-lg ${
                                      j === getCorrectIndex(q)
                                        ? "bg-success/10 text-success font-medium"
                                        : j === answers[i] && !isCorrect
                                        ? "bg-destructive/10 text-destructive line-through"
                                        : "text-muted-foreground"
                                    }`}
                                  >
                                    {String.fromCharCode(65 + j)}. {opt}
                                    {j === getCorrectIndex(q) && " ✓"}
                                    {j === answers[i] &&
                                      j !== getCorrectIndex(q) &&
                                      " (your answer)"}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Test UI ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/student/tests" className="p-2 rounded-xl hover:bg-secondary">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="font-bold text-foreground">
              {apiTest?.title ?? "Assessment"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Question {current + 1} of {questions.length}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-destructive/10 text-destructive px-4 py-2 rounded-xl font-semibold text-sm">
          <Clock className="w-4 h-4" />
          {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </div>
      </div>

      {/* Question navigation dots */}
      <div className="px-8 pt-6 flex items-center gap-2 flex-wrap">
        {questions.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setCurrent(i);
              setSelected(answers[i]);
            }}
            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
              i === current
                ? "bg-primary text-primary-foreground"
                : answers[i] !== null
                ? "bg-primary/20 text-primary"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Progress */}
      <div className="px-8 pt-4">
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${((current + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="max-w-2xl mx-auto p-8">
        <div className="bg-card rounded-2xl p-8 shadow-sm border border-border mb-6">
          <p className="text-lg font-semibold text-foreground">
            {getQuestionText(q)}
          </p>
        </div>

        <div className="space-y-3">
          {getOptions(q).map((opt, i) => (
            <button
              key={i}
              onClick={() => selectOption(i)}
              className={`w-full text-left p-4 rounded-2xl border transition-all text-sm font-medium ${
                selected === i
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border bg-card text-foreground hover:border-primary/50"
              }`}
            >
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-secondary text-secondary-foreground text-xs font-bold mr-3">
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
            </button>
          ))}
        </div>

        <div className="flex justify-between mt-8">
          <button
            onClick={() => {
              setCurrent((p) => Math.max(0, p - 1));
              setSelected(answers[Math.max(0, current - 1)]);
            }}
            disabled={current === 0}
            className="px-6 py-2.5 rounded-xl text-sm font-medium bg-secondary text-secondary-foreground disabled:opacity-40"
          >
            Previous
          </button>
          {current === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              className="px-6 py-2.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:opacity-90"
            >
              Submit Test
            </button>
          ) : (
            <button
              onClick={() => {
                setCurrent((p) => p + 1);
                setSelected(answers[current + 1]);
              }}
              className="px-6 py-2.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:opacity-90"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
