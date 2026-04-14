import { AppLayout } from "@/components/AppLayout";
import { testApi, batchApi, TestSummary, Batch } from "@/lib/api";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Loader2, BookOpen, Circle, Clock, CheckCircle2, GraduationCap, FileText, ArrowRight, ArrowLeft } from "lucide-react";

interface BatchWithStats extends Batch {
  totalTests: number;
  completedTests: number;
}

export default function StudentTests() {
  const navigate = useNavigate();
  const [tests, setTests] = useState<TestSummary[]>([]);
  const [batches, setBatches] = useState<BatchWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [t, b] = await Promise.all([
        testApi.get(),
        batchApi.get(),
      ]);
      setTests(t);

      const batchesWithStats: BatchWithStats[] = b.map(batch => {
        const batchTests = t.filter(test => test.batchName === batch.name);
        const completed = batchTests.filter(test => test.status === 'completed').length;
        return {
          ...batch,
          totalTests: batchTests.length,
          completedTests: completed,
        };
      });
      setBatches(batchesWithStats);
    } catch (err) {
      console.error('Failed to load tests:', err);
    } finally {
      setLoading(false);
    }
  }

  const generalTests = tests.filter(t => !t.batchName || t.batchName === 'General');

  return (
    <AppLayout>
      <h2 className="text-xl font-bold text-foreground mb-6">My Courses</h2>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {batches.length > 0 && (
            <>
              <h3 className="text-lg font-semibold text-foreground mb-4">My Batches</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {batches.map((batch) => {
                  const progress = batch.totalTests > 0 ? Math.round((batch.completedTests / batch.totalTests) * 100) : 0;
                  return (
                    <div
                      key={batch.id}
                      className="group bg-card rounded-2xl p-5 border border-border shadow-sm hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
                      onClick={() => navigate(`/student/batch/${batch.id}/tests`)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          <GraduationCap className="w-6 h-6 text-primary" />
                        </div>
                        {batch.totalTests > 0 && (
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                            {batch.completedTests}/{batch.totalTests} completed
                          </span>
                        )}
                      </div>
                      
                      <h4 className="font-bold text-lg text-foreground mb-2">{batch.name}</h4>
                      
                      {batch.totalTests > 0 ? (
                        <>
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {batch.totalTests} tests available
                            </span>
                            <span className="font-medium text-primary">{progress}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">No tests assigned yet</p>
                      )}
                      
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          View Tests <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {generalTests.length > 0 && (
            <>
              <h3 className="text-lg font-semibold text-foreground mb-4">General Tests</h3>
              <div className="space-y-3">
                {generalTests.map((test) => (
                  <div key={test.id} className="flex items-center gap-4 bg-card rounded-2xl p-4 border border-border shadow-sm hover:shadow-md hover:border-primary/20 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{test.title}</p>
                      <p className="text-xs text-muted-foreground">
                        General · {test.duration} min · {test.questionCount} questions
                      </p>
                    </div>
                    <Link
                      to={`/student/test-page/${test.id}`}
                      className="text-xs font-medium bg-primary text-primary-foreground px-4 py-1.5 rounded-lg hover:bg-primary/90 transition-all"
                    >
                      Start Test
                    </Link>
                  </div>
                ))}
              </div>
            </>
          )}

          {tests.length === 0 && batches.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Circle className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No tests available yet. Join a batch to see tests.</p>
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}

function getCourseIcon(batchName: string): string {
  const name = batchName.toLowerCase();
  if (name.includes('excel')) return '📊';
  if (name.includes('tally')) return '📒';
  if (name.includes('python') || name.includes('coding') || name.includes('program')) return '💻';
  if (name.includes('web') || name.includes('html') || name.includes('css')) return '🌐';
  if (name.includes('data')) return '📈';
  if (name.includes('account')) return '🧾';
  return '📚';
}