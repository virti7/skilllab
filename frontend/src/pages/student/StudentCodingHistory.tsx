import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { RightPanel } from "@/components/RightPanel";
import { codingApi } from "@/lib/api";
import {
  Loader2,
  Code2,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowLeft,
} from "lucide-react";

interface CodingHistoryItem {
  id: string;
  questionId: string;
  testId: string | null;
  questionTitle: string;
  topic: string;
  difficulty: string;
  questionType: string;
  language: string;
  passed: number;
  total: number;
  runtime: number | null;
  memory: number | null;
  status: string;
  createdAt: string;
}

export default function StudentCodingHistory() {
  const { batchId } = useParams();
  const [history, setHistory] = useState<CodingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (batchId) {
      loadHistory();
    }
  }, [batchId]);

  async function loadHistory() {
    if (!batchId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await codingApi.getCodingHistory(batchId);
      setHistory(data || []);
    } catch (err: any) {
      console.error("Failed to load history:", err);
      setError(err.message || "Failed to load history");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <AppLayout rightPanel={<RightPanel />}>
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading history...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout rightPanel={<RightPanel />}>
      <div className="mb-6">
        <Link
          to={`/student/coding/analytics/${batchId}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Analytics
        </Link>
        <div className="flex items-center gap-2 mb-1">
          <Code2 className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Coding History</h1>
        </div>
        <p className="text-muted-foreground">View all your coding submissions</p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {history.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Code2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No Submissions Yet
          </h3>
          <p className="text-muted-foreground mb-6">
            Start solving coding problems to see your history
          </p>
          <Link
            to={`/student/coding/${batchId}`}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg"
          >
            Go to Coding Lab
          </Link>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">
                    Question
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">
                    Type
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">
                    Topic
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">
                    Language
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">
                    Result
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">
                    Runtime
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">
                    Status
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-border last:border-0 hover:bg-secondary/30"
                  >
                    <td className="px-5 py-3">
                      <span className="font-medium text-foreground">
                        {item.questionTitle}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground capitalize">
                      {item.questionType}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{item.topic}</td>
                    <td className="px-5 py-3 text-muted-foreground capitalize">
                      {item.language}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`font-medium ${
                          item.passed === item.total
                            ? "text-success"
                            : item.passed > 0
                            ? "text-warning"
                            : "text-destructive"
                        }`}
                      >
                        {item.passed}/{item.total}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {item.runtime ? `${item.runtime}ms` : "—"}
                    </td>
                    <td className="px-5 py-3">
                      {item.status === "success" ? (
                        <span className="inline-flex items-center gap-1 text-success">
                          <CheckCircle2 className="w-4 h-4" />
                          Passed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-destructive">
                          <XCircle className="w-4 h-4" />
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppLayout>
  );
}