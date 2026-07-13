import { AppLayout } from "@/components/AppLayout";
import { testApi, TestSummary } from "@/lib/api";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Loader2, BookOpen } from "lucide-react";

export default function Tests() {
  const [tests, setTests] = useState<TestSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTests();
  }, []);

  async function loadTests() {
    setLoading(true);
    try {
      const data = await testApi.getStudentTests();
      setTests(data);
    } catch {
      setTests([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout>
      <h2 className="text-lg md:text-xl font-bold text-foreground mb-6">All Tests</h2>
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : tests.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No tests available yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tests.map((test) => (
            <div key={test.id} className="flex items-center gap-4 bg-card rounded-2xl p-5 shadow-sm border border-border">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                test.status === "completed" ? "bg-card-green" : "bg-card-orange"
              }`}>
                {test.status === "completed" ? "✅" : "📋"}
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{test.title}</p>
                <p className="text-sm text-muted-foreground">{test.batchName || "All Batches"} · {test.questionCount} questions</p>
              </div>
              <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                test.status === "completed"
                  ? "bg-card-green text-success"
                  : "bg-card-orange text-accent-foreground"
              }`}>
                {test.status === "completed" ? "Completed" : "Pending"}
              </span>
              {test.status !== "completed" && !test.isExpired && (
                <Link
                  to={`/test-page/${test.id}`}
                  className="text-sm font-medium bg-primary text-primary-foreground px-5 py-2 rounded-xl hover:opacity-90 transition-opacity"
                >
                  Start Test
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
