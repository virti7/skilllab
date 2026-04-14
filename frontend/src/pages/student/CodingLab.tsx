import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { RightPanel } from '@/components/RightPanel';
import { codingApi, CodingBatch, CodingQuestion, CodingTest } from '@/lib/api';
import { Loader2, Code2, BookOpen, Bug, FileCode, ChevronRight, Play, Clock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const colors: Record<string, string> = {
    easy: 'bg-green-500/10 text-green-600 dark:text-green-400',
    medium: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
    hard: 'bg-red-500/10 text-red-600 dark:text-red-400',
  };
  return (
    <Badge className={`${colors[difficulty.toLowerCase()] || colors.easy} capitalize`}>
      {difficulty}
    </Badge>
  );
}

function getDifficultyColor(difficulty: string): string {
  const colors: Record<string, string> = {
    easy: 'text-green-600 dark:text-green-400',
    medium: 'text-yellow-600 dark:text-yellow-400',
    hard: 'text-red-600 dark:text-red-400',
  };
  return colors[difficulty.toLowerCase()] || colors.easy;
}

export default function CodingLab() {
  const navigate = useNavigate();
  const { batchId } = useParams();
  const [batches, setBatches] = useState<CodingBatch[]>([]);
  const [practiceList, setPracticeList] = useState<CodingQuestion[]>([]);
  const [debugList, setDebugList] = useState<CodingQuestion[]>([]);
  const [testList, setTestList] = useState<CodingTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(batchId || null);
  const [activeTab, setActiveTab] = useState('practice');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (batchId) {
      setSelectedBatch(batchId);
    }
  }, [batchId]);

  useEffect(() => {
    if (selectedBatch) {
      loadBatchData(selectedBatch);
    } else {
      setPracticeList([]);
      setDebugList([]);
      setTestList([]);
    }
  }, [selectedBatch]);

  async function loadData() {
    try {
      const batchData = await codingApi.getBatches();
      setBatches(batchData || []);
    } catch (batchErr) {
      console.warn('Could not load batches:', batchErr);
      setBatches([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadBatchData(batchId: string) {
    try {
      const [practice, debug, tests] = await Promise.all([
        codingApi.getQuestions(batchId, 'practice'),
        codingApi.getQuestions(batchId, 'debug'),
        codingApi.getTests(batchId)
      ]);
      setPracticeList(practice || []);
      setDebugList(debug || []);
      setTestList(tests || []);
    } catch (err) {
      console.error('Failed to load batch data:', err);
    }
  }

  const handleBatchSelect = (batch: CodingBatch) => {
    setSelectedBatch(batch.id || batch.batchId);
    navigate(`/student/coding/${batch.id || batch.batchId}`);
  };

  if (loading) {
    return (
      <AppLayout rightPanel={<RightPanel />}>
        <div className='flex items-center justify-center py-20'>
          <div className='flex flex-col items-center gap-3'>
            <Loader2 className='w-8 h-8 animate-spin text-primary' />
            <p className='text-sm text-muted-foreground'>Loading Coding Lab...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const hasSelectedBatch = selectedBatch !== null;
  const noBatches = batches.length === 0;

  if (noBatches) {
    return (
      <AppLayout rightPanel={<RightPanel />}>
        <div className='flex flex-col items-center justify-center py-20'>
          <div className='w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-6'>
            <Code2 className='w-10 h-10 text-primary' />
          </div>
          <h3 className='text-xl font-bold text-foreground mb-2'>No Coding Problems</h3>
          <p className='text-muted-foreground text-center max-w-md'>
            You don't have access to any coding problems yet. Contact your administrator to get started.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout rightPanel={<RightPanel />}>
      <div className='mb-6'>
        <div className='flex items-center gap-2 mb-1'>
          <Code2 className='w-6 h-6 text-primary' />
          <h1 className='text-2xl font-bold text-foreground'>Coding Lab</h1>
        </div>
        <p className='text-muted-foreground'>Practice coding problems and ace your tests</p>
      </div>

      {batches.length > 0 && (
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
          {batches.map((batch) => (
            <button
              key={batch.id}
              onClick={() => handleBatchSelect(batch)}
              className={`p-4 rounded-xl border text-left transition-all ${
                selectedBatch === (batch.id || batch.batchId)
                  ? 'bg-primary/10 border-primary'
                  : 'bg-card border-border hover:border-primary/50'
              }`}
            >
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center'>
                  <Code2 className='w-5 h-5 text-primary' />
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='font-semibold text-foreground truncate'>{batch.name}</p>
                  <p className='text-xs text-muted-foreground'>
                    {batch._count?.questions || 0} problems
                  </p>
                </div>
                <ChevronRight className={`w-5 h-5 ${
                  selectedBatch === (batch.id || batch.batchId)
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`} />
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedBatch && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className='mb-4'>
            <TabsTrigger value='practice' className='gap-2'>
              <BookOpen className='w-4 h-4' />
              Practice
            </TabsTrigger>
            <TabsTrigger value='debug' className='gap-2'>
              <Bug className='w-4 h-4' />
              Debug
            </TabsTrigger>
            <TabsTrigger value='test' className='gap-2'>
              <FileCode className='w-4 h-4' />
              Tests
            </TabsTrigger>
          </TabsList>

          <TabsContent value='practice' className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {practiceList.map((q) => (
                <button
                  key={q.id}
                  onClick={() => navigate(`/student/coding/question/${q.id}`)}
                  className='p-4 rounded-xl border bg-card border-border text-left hover:border-primary/50 transition-all'
                >
                  <div className='flex items-start justify-between mb-2'>
                    <DifficultyBadge difficulty={q.difficulty} />
                    <span className='text-xs text-muted-foreground capitalize'>{q.topic}</span>
                  </div>
                  <h3 className='font-semibold text-foreground mb-1 line-clamp-2'>{q.title}</h3>
                  <p className='text-xs text-muted-foreground line-clamp-2'>{q.description}</p>
                </button>
              ))}
            </div>
            {practiceList.length === 0 && (
              <div className='text-center py-12 text-muted-foreground'>
                <BookOpen className='w-12 h-12 mx-auto mb-4 opacity-50' />
                <p>No practice problems available for this batch</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value='debug' className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {debugList.map((q) => (
                <button
                  key={q.id}
                  onClick={() => navigate(`/student/coding/question/${q.id}`)}
                  className='p-4 rounded-xl border bg-card border-border text-left hover:border-primary/50 transition-all'
                >
                  <div className='flex items-start justify-between mb-2'>
                    <DifficultyBadge difficulty={q.difficulty} />
                    <span className='text-xs text-muted-foreground capitalize'>{q.topic}</span>
                  </div>
                  <h3 className='font-semibold text-foreground mb-1 line-clamp-2'>{q.title}</h3>
                  <p className='text-xs text-muted-foreground line-clamp-2'>{q.description}</p>
                </button>
              ))}
            </div>
            {debugList.length === 0 && (
              <div className='text-center py-12 text-muted-foreground'>
                <Bug className='w-12 h-12 mx-auto mb-4 opacity-50' />
                <p>No debugging problems available for this batch</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value='test' className='space-y-4'>
            {testList.length > 0 ? (
              testList.map((t) => (
                <div key={t.id} className='border rounded-xl overflow-hidden'>
                  <div className='bg-muted/50 px-4 py-3 flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      <Badge variant='outline' className='gap-1'>
                        <Clock className='w-3 h-3' />
                        {t.duration} min
                      </Badge>
                      <span className='font-semibold text-foreground'>{t.title}</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Badge variant='secondary'>
                        {t._count?.questions || 0} Questions
                      </Badge>
                      <Button
                        onClick={() => navigate(`/student/coding/test/${t.id}`)}
                        size='sm'
                        className='gap-1'
                      >
                        <Play className='w-3 h-3' />
                        Start Test
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className='text-center py-12 text-muted-foreground'>
                <FileCode className='w-12 h-12 mx-auto mb-4 opacity-50' />
                <p>No coding tests available for this batch</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </AppLayout>
  );
}