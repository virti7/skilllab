import { useState, useEffect, useCallback } from "react";
import { testQuestions, testQuestionBank } from "@/data/dummy";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Clock, ArrowLeft, Download, Loader2, CheckCircle, XCircle } from "lucide-react";
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
}

function getOptions(q: LocalQuestion): string[] {
  if (q.options) return q.options;
  return [q.optionA!, q.optionB!, q.optionC!, q.optionD!];
}

function getQuestionText(q: LocalQuestion): string {
  return q.question ?? q.questionText ?? "";
}

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;

export default function TestPage() {
  const { testId } = useParams();
  const navigate = useNavigate();

  console.log("TestPage - testId:", testId);

  const [apiTest, setApiTest] = useState<TestFull | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const questions: LocalQuestion[] = (() => {
    if (apiTest?.questions?.length) {
      return apiTest.questions;
    }
    const numId = testId ? Number(testId) : null;
    if (numId && testQuestionBank[numId]) return testQuestionBank[numId];
    return testQuestions;
  })();

  const durationMinutes = apiTest?.duration ?? questions.length * 2;

  useEffect(() => {
    if (!testId) {
      setFetchLoading(false);
      return;
    }
    const numId = Number(testId);
    if (!isNaN(numId) && numId < 1_000_000) {
      setFetchLoading(false);
      return;
    }
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

  useEffect(() => {
    if (questions.length > 0 && answers.length === 0) {
      setAnswers(Array(questions.length).fill(null));
      setTimeLeft(durationMinutes * 60);
    }
  }, [questions.length, durationMinutes]);

  useEffect(() => {
    if (submitted || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft((p) => (p <= 0 ? 0 : p - 1)), 1000);
    return () => clearInterval(t);
  }, [submitted, timeLeft]);

  useEffect(() => {
    if (timeLeft === 0 && !submitted && answers.length > 0 && !submitting) {
      setSubmitted(true);
    }
  }, [timeLeft, submitted, answers.length, submitting]);

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

  const handleSubmit = useCallback(async () => {
    if (submitted) return;
    setSubmitted(true);

    if (apiTest && testId) {
      setSubmitting(true);
      try {
        const answerPayload = answers.map((selectedIdx, i) => ({
          questionId: apiTest.questions?.[i]?.id ?? "",
          selectedOption: selectedIdx !== null ? OPTION_LETTERS[selectedIdx] : "",
        }));
        console.log("Submitting test with answers:", answerPayload);
        const result = await testApi.submit(testId, answerPayload);
        console.log("Submit result:", result);
        setSubmitResult(result);
        setShowResult(true);
      } catch (err) {
        console.error("Submit error:", err);
        alert("Failed to submit test. Please try again.");
      } finally {
        setSubmitting(false);
      }
    } else {
      navigate("/student");
    }
  }, [submitted, apiTest, testId, answers, navigate]);

  const handleCloseResult = () => {
    setShowResult(false);
    if (testId) {
      navigate(`/student/test-result/${testId}`);
    } else {
      navigate("/student");
    }
  };

  const downloadPDF = () => {
    if (!submitResult) return;
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    const passed = submitResult.percentage >= 50;

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
    doc.text(`${submitResult.percentage}%`, pw / 2, 80, { align: "center" });
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Score: ${submitResult.score} / ${submitResult.totalQuestions}`, pw / 2, 90, { align: "center" });
    doc.text(`Status: ${passed ? "PASSED" : "NEEDS IMPROVEMENT"}`, pw / 2, 98, { align: "center" });

    doc.setDrawColor(200, 200, 200);
    doc.line(20, 105, pw - 20, 105);

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      "Generated by SkillLab Workspace",
      pw / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
    doc.save(`SkillLab_Result_${submitResult.percentage}pct.pdf`);
  };

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

  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-muted-foreground">No questions available for this test.</p>
        <Link to="/student/tests" className="text-sm text-primary underline">
          Back to Tests
        </Link>
      </div>
    );
  }

  // Result Modal
  if (showResult && submitResult) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl p-8 shadow-lg border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="text-center mb-6">
            <div className="text-6xl mb-3">{submitResult.passed ? "🎉" : "💪"}</div>
            <h2 className="text-2xl font-bold text-foreground">
              {submitResult.passed ? "Great job!" : "Keep practicing!"}
            </h2>
            <p className="text-muted-foreground">
              {submitResult.passed
                ? "You've passed the test successfully."
                : "Review your answers and try again."}
            </p>
          </div>

          <div className={`text-5xl font-bold text-center mb-2 ${
            submitResult.passed ? "text-success" : "text-destructive"
          }`}>
            {submitResult.percentage}%
          </div>
          <p className="text-center text-muted-foreground mb-6">
            {submitResult.score} correct out of {submitResult.totalQuestions} questions
          </p>

          <div className="flex gap-3 justify-center mb-6">
            <button
              onClick={downloadPDF}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Download className="w-4 h-4" /> Download PDF
            </button>
          </div>

          {submitResult.correctAnswers && submitResult.correctAnswers.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success" />
                Correct Answers ({submitResult.correctAnswers.length})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {submitResult.correctAnswers.map((item, i) => (
                  <div key={i} className="bg-success/10 rounded-lg p-3 text-sm">
                    <p className="font-medium text-foreground">Q{i + 1}: {item.question}</p>
                    <p className="text-success text-xs">Your answer: {item.yourAnswer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {submitResult.wrongAnswers && submitResult.wrongAnswers.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-destructive" />
                Wrong Answers ({submitResult.wrongAnswers.length})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {submitResult.wrongAnswers.map((item, i) => (
                  <div key={i} className="bg-destructive/10 rounded-lg p-3 text-sm">
                    <p className="font-medium text-foreground">Q{i + 1}: {item.question}</p>
                    <p className="text-destructive text-xs">Your answer: {item.yourAnswer}</p>
                    <p className="text-success text-xs">Correct: {item.correctAnswer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleCloseResult}
            className="w-full py-3 rounded-xl font-medium bg-primary text-primary-foreground hover:opacity-90"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Loading state during submit
  if (submitted && submitting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-muted-foreground">Saving your result…</p>
        </div>
      </div>
    );
  }

  // Test UI
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

      <div className="px-8 pt-6 flex items-center gap-2 flex-wrap">
        {questions?.map((_, i) => (
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

      <div className="px-8 pt-4">
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${((current + 1) / (questions.length || 1)) * 100}%` }}
          />
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-8">
        <div className="bg-card rounded-2xl p-8 shadow-sm border border-border mb-6">
          <p className="text-lg font-semibold text-foreground">
            {getQuestionText(q)}
          </p>
        </div>

        <div className="space-y-3">
          {getOptions(q)?.map((opt, i) => (
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
