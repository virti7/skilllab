import { AppLayout } from "@/components/AppLayout";
import { batchApi, Batch } from "@/lib/api";
import { useState, useEffect } from "react";
import { Loader2, Layers } from "lucide-react";

const colors = ["bg-card-green", "bg-card-blue", "bg-card-orange", "bg-card-purple", "bg-card-pink"];

export default function Classes() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBatches();
  }, []);

  async function loadBatches() {
    setLoading(true);
    try {
      const data = await batchApi.getStudentBatches();
      setBatches(data);
    } catch {
      setBatches([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout>
      <h2 className="text-lg md:text-xl font-bold text-foreground mb-6">My Classes</h2>
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : batches.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Layers className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">You haven't joined any classes yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {batches.map((batch, i) => (
            <div key={batch.id} className={`${colors[i % colors.length]} rounded-2xl p-6`}>
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-lg font-semibold text-foreground">{batch.name}</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-5">
                {batch.studentCount ?? 0} students · {batch.testCount ?? 0} tests
              </p>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
