import { AppLayout } from "@/components/AppLayout";
import { testApi, TestStudentHistory, codingApi } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { Loader2, ArrowLeft, FileText, CheckCircle2, XCircle, Calendar, Search, ArrowUpDown, ArrowDown, ArrowUp, Brain, Clock, Cpu, Activity } from "lucide-react";

type SortOption = 'date-desc' | 'date-asc' | 'score-desc' | 'score-asc' | 'name-asc' | 'name-desc';

export default function TestHistoryPage() {
  const navigate = useNavigate();
  const [history, setHistory] = useState<TestStudentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const data = await testApi.getHistory();
      setHistory(data);
    } catch (err: any) {
      console.error('Failed to load test history:', err);
      setError(err.message || 'Failed to load test history');
    } finally {
      setLoading(false);
    }
  }

  // Get unique batch names for filter
  const batchNames = useMemo(() => {
    const names = new Set(history.map(h => h.batchName));
    return Array.from(names);
  }, [history]);

  // Filter and sort history
  const filteredHistory = useMemo(() => {
    let filtered = [...history];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(h => 
        h.testTitle.toLowerCase().includes(query) ||
        h.batchName.toLowerCase().includes(query)
      );
    }

    // Batch filter
    if (selectedBatch !== 'all') {
      filtered = filtered.filter(h => h.batchName === selectedBatch);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
        case 'date-asc':
          return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
        case 'score-desc':
          return b.percentage - a.percentage;
        case 'score-asc':
          return a.percentage - b.percentage;
        case 'name-asc':
          return a.testTitle.localeCompare(b.testTitle);
        case 'name-desc':
          return b.testTitle.localeCompare(a.testTitle);
        default:
          return 0;
      }
    });

    return filtered;
  }, [history, searchQuery, selectedBatch, sortBy]);

  const getScoreColor = (pct: number) => {
    if (pct >= 75) return "text-success";
    if (pct >= 50) return "text-warning";
    return "text-destructive";
  };

  const getScoreBg = (pct: number) => {
    if (pct >= 75) return "bg-success";
    if (pct >= 50) return "bg-warning";
    return "bg-destructive";
  };

  const totalTests = history.length;
  const avgScore = totalTests > 0 
    ? Math.round(history.reduce((sum, h) => sum + h.percentage, 0) / totalTests)
    : 0;
  const passedTests = history.filter(h => h.percentage >= 50).length;
  const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

  return (
    <AppLayout>
      <div className="mb-6">
        <button
          onClick={() => navigate('/student/tests')}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Courses
        </button>
        <h2 className="text-xl font-bold text-foreground">Test History</h2>
        <p className="text-sm text-muted-foreground mt-1">
          View all your test attempts and performance analytics
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-destructive">{error}</p>
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No test history yet. Complete a test to see your history.</p>
        </div>
      ) : (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-card rounded-2xl p-4 border border-border">
              <span className="text-xs text-muted-foreground">Total Attempts</span>
              <p className="text-2xl font-bold text-foreground">{totalTests}</p>
            </div>
            <div className="bg-card rounded-2xl p-4 border border-border">
              <span className="text-xs text-muted-foreground">Avg Score</span>
              <p className="text-2xl font-bold text-foreground">{avgScore}%</p>
            </div>
            <div className="bg-card rounded-2xl p-4 border border-border">
              <span className="text-xs text-muted-foreground">Pass Rate</span>
              <p className="text-2xl font-bold text-success">{passRate}%</p>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-card rounded-2xl border border-border p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by test name or batch..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-secondary border-none rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Batch Filter */}
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="px-4 py-2 bg-secondary border-none rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="all">All Batches</option>
                {batchNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-4 py-2 bg-secondary border-none rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="score-desc">Score: High to Low</option>
                <option value="score-asc">Score: Low to High</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
              </select>
            </div>

            {/* Active Filters Display */}
            {(searchQuery || selectedBatch !== 'all') && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                <span className="text-xs text-muted-foreground">Active filters:</span>
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    Search: "{searchQuery}"
                    <button onClick={() => setSearchQuery('')} className="hover:text-primary/70">×</button>
                  </span>
                )}
                {selectedBatch !== 'all' && (
                  <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    Batch: {selectedBatch}
                    <button onClick={() => setSelectedBatch('all')} className="hover:text-primary/70">×</button>
                  </span>
                )}
                <button
                  onClick={() => { setSearchQuery(''); setSelectedBatch('all'); }}
                  className="text-xs text-muted-foreground hover:text-foreground ml-auto"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Results Count */}
          <p className="text-sm text-muted-foreground mb-4">
            Showing {filteredHistory.length} of {totalTests} tests
          </p>

          {/* History List */}
          <div className="space-y-4">
            {filteredHistory.map((item) => (
              <div
                key={item.submissionId}
                className="bg-card rounded-2xl p-4 border border-border shadow-sm hover:shadow-md hover:border-primary/20 transition-all cursor-pointer"
                onClick={() => {
                  if (item.type === 'coding') {
                    navigate(`/student/coding/analytics/submission/${item.submissionId}`);
                  } else {
                    navigate(`/student/test/${item.submissionId}/analytics`);
                  }
                }}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${getScoreBg(item.percentage)}/10 flex items-center justify-center`}>
                    {item.percentage >= 50 ? (
                      <CheckCircle2 className={`w-6 h-6 ${getScoreColor(item.percentage)}`} />
                    ) : (
                      <XCircle className={`w-6 h-6 ${getScoreColor(item.percentage)}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{item.testTitle}</p>
                      {item.type === 'coding' && (
                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">Coding</span>
                      )}
                    </div>
                    {item.type === 'coding' && item.questionTitle ? (
                      <p className="text-xs text-muted-foreground">
                        {item.questionTitle} · {item.questionTopic} · {item.questionDifficulty}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {item.batchName} · {item.timeTaken} min
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.submittedAt).toLocaleDateString()}
                      </span>
                      {item.type === 'coding' && item.language && (
                        <span className="text-xs text-muted-foreground">{item.language}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${getScoreColor(item.percentage)}`}>
                      {item.percentage}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.correctCount}/{item.totalQuestions} correct
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.accuracy}% accuracy
                    </p>
                    {item.type === 'coding' && item.runtime && (
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{item.runtime}</span>
                        {item.memory && (
                          <>
                            <Cpu className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{item.memory}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-end">
                  <span className="text-xs text-primary font-medium flex items-center gap-1">
                    View Full Analytics <ArrowLeft className="w-3 h-3 rotate-180" />
                  </span>
                </div>
              </div>
            ))}

            {filteredHistory.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No tests match your search criteria.</p>
              </div>
            )}
          </div>
        </>
      )}
    </AppLayout>
  );
}