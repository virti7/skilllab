import { AppLayout } from "@/components/AppLayout";
import { RightPanel } from "@/components/RightPanel";
import { batchApi, testApi, Batch, TestSummary } from "@/lib/api";
import { useState, useEffect } from "react";
import { Loader2, Layers, BookOpen, MoreHorizontal } from "lucide-react";

const colorMap: Record<string, string> = {
  "card-green": "bg-card-green",
  "card-blue": "bg-card-blue",
  "card-orange": "bg-card-orange",
};

function MyClasses({ batches }: { batches: Batch[] }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold text-foreground mb-5">My Classes</h2>
      {batches.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Layers className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No classes yet. Join a batch to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {batches.map((batch, i) => (
            <div
              key={batch.id}
              className={`${["bg-card-green", "bg-card-blue", "bg-card-orange"][i % 3]} rounded-2xl p-6 transition-transform hover:scale-[1.02]`}
            >
              <div className="text-3xl mb-3">📚</div>
              <h3 className="font-semibold text-foreground text-base">{batch.name}</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                {batch.studentCount ?? 0} students · {batch.testCount ?? 0} tests
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function TodayTasks({ tests }: { tests: TestSummary[] }) {
  return (
    <section>
      <h2 className="text-xl font-bold text-foreground mb-5">Today Tasks</h2>
      {tests.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No tests available today.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tests.slice(0, 5).map((test) => (
            <div key={test.id} className="flex items-center gap-4 bg-card rounded-2xl p-4 shadow-sm border border-border">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                test.status === "completed" ? "bg-card-green" : "bg-card-orange"
              }`}>
                {test.status === "completed" ? "✅" : "📋"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{test.title}</p>
                <p className="text-xs text-muted-foreground">{test.batchName || "All Batches"}</p>
              </div>
              <button className="p-1.5 rounded-lg hover:bg-secondary">
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function Index() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [tests, setTests] = useState<TestSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      batchApi.getStudentBatches().catch(() => []),
      testApi.getStudentTests().catch(() => []),
    ]).then(([b, t]) => {
      setBatches(b);
      setTests(t);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout rightPanel={<RightPanel />}>
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <MyClasses batches={batches} />
          <TodayTasks tests={tests} />
        </>
      )}
    </AppLayout>
  );
}
