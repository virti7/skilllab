import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { RightPanel } from '@/components/RightPanel';
import { codingApi, CodingQuestion, CodingTest, CodingBatch } from '@/lib/api';
import { Loader2, Code2, BookOpen, Bug, FileCode, Play, Clock, ArrowLeft, Target, Zap, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const colors: Record<string, string> = {
    easy: 'bg-green-500/10 text-green-600 border-green-500/20',
    medium: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    hard: 'bg-red-500/10 text-red-600 border-red-500/20',
  };
  const icons = {
    easy: <CheckCircle className="w-3 h-3" />,
    medium: <AlertTriangle className="w-3 h-3" />,
    hard: <XCircle className="w-3 h-3" />,
  };
  return (
    <Badge variant="outline" className={`${colors[difficulty.toLowerCase()] || colors.easy} capitalize gap-1`}>
      {icons[difficulty.toLowerCase()] || icons.easy}
      {difficulty}
    </Badge>
  );
}

export default function BatchCodingPage() {
  const navigate = useNavigate();
  const { batchId } = useParams<{ batchId: string }>();
  const [batch, setBatch] = useState<CodingBatch | null>(null);
  const [practiceList, setPracticeList] = useState<CodingQuestion[]>([]);
  const [debugList, setDebugList] = useState<CodingQuestion[]>([]);
  const [testList, setTestList] = useState<CodingTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('practice');

  useEffect(() => {
    if (batchId) {
      loadBatchData();
    }
  }, [batchId]);

  async function loadBatchData() {
    if (!batchId) return;
    try {
      const [practice, debug, tests, batches] = await Promise.all([
        codingApi.getQuestions(batchId, 'practice'),
        codingApi.getQuestions(batchId, 'debug'),
        codingApi.getTests(batchId),
        codingApi.getBatches()
      ]);
      const currentBatch = batches.find(b => (b.id || b.batchId) === batchId);
      setBatch(currentBatch || null);
      setPracticeList(practice || []);
      setDebugList(debug || []);
      setTestList(tests || []);
    } catch (err) {
      console.error('Failed to load batch data:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleQuestionClick = (questionId: string) => {
    navigate(`/student/coding/question/${questionId}`);
  };

  const handleTestClick = (testId: string) => {
    navigate(`/student/coding/test/${testId}`);
  };

  const handleBack = () => {
    navigate('/student/coding');
  };

  if (loading) {
    return (
      <AppLayout rightPanel={<RightPanel />}>
        <div className='flex items-center justify-center py-20'>
          <div className='flex flex-col items-center gap-3'>
            <Loader2 className='w-8 h-8 animate-spin text-primary' />
            <p className='text-sm text-muted-foreground'>Loading batch...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout rightPanel={<RightPanel />}>
      <div className='mb-8'>
        <button
          onClick={handleBack}
          className='flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors'
        >
          <ArrowLeft className='w-4 h-4' />
          <span className='text-sm font-medium'>Back to Coding Lab</span>
        </button>
        
        <div className='flex items-center gap-5'>
          <div className='w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center shadow-lg shadow-primary/20'>
            <Code2 className='w-8 h-8 text-white' />
          </div>
          <div>
            <h1 className='text-3xl font-bold text-foreground'>{batch?.name || 'Batch'}</h1>
            <div className='flex items-center gap-4 mt-2'>
              <div className='flex items-center gap-1.5 text-sm text-muted-foreground'>
                <Target className='w-4 h-4 text-primary' />
                <span>{practiceList.length + debugList.length} Problems</span>
              </div>
              <div className='flex items-center gap-1.5 text-sm text-muted-foreground'>
                <FileCode className='w-4 h-4 text-violet-500' />
                <span>{testList.length} Tests</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-xl h-auto">
          <TabsTrigger 
            value="practice" 
            className="rounded-lg px-6 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2"
          >
            <BookOpen className="w-4 h-4" />
            <span className="font-medium">Practice</span>
            <Badge variant="secondary" className="ml-1 px-2 py-0 text-xs">
              {practiceList.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="debug" 
            className="rounded-lg px-6 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2"
          >
            <Bug className="w-4 h-4" />
            <span className="font-medium">Debug</span>
            <Badge variant="secondary" className="ml-1 px-2 py-0 text-xs">
              {debugList.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="test" 
            className="rounded-lg px-6 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2"
          >
            <FileCode className="w-4 h-4" />
            <span className="font-medium">Tests</span>
            <Badge variant="secondary" className="ml-1 px-2 py-0 text-xs">
              {testList.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="practice" className="space-y-4">
          {practiceList.length > 0 ? (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
              {practiceList.map((q, index) => (
                <button
                  key={q.id}
                  onClick={() => handleQuestionClick(q.id)}
                  className='group relative overflow-hidden p-5 rounded-2xl border bg-card text-left transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1'
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className='absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity' />
                  
                  <div className='relative'>
                    <div className='flex items-start justify-between mb-3'>
                      <DifficultyBadge difficulty={q.difficulty} />
                      <Badge variant="outline" className="text-xs capitalize text-muted-foreground">
                        {q.topic}
                      </Badge>
                    </div>
                    
                    <h3 className='font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors'>
                      {q.title}
                    </h3>
                    
                    <p className='text-sm text-muted-foreground line-clamp-2 mb-4'>
                      {q.description}
                    </p>
                    
                    <div className='pt-3 border-t border-border flex items-center justify-between'>
                      <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                        <Zap className='w-3 h-3 text-amber-500' />
                        <span>Solve Challenge</span>
                      </div>
                      <div className='w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all'>
                        <svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center py-20 bg-muted/30 rounded-2xl border border-dashed'>
              <div className='w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4'>
                <BookOpen className='w-8 h-8 text-muted-foreground/50' />
              </div>
              <p className='text-lg font-medium text-foreground mb-2'>No Practice Problems</p>
              <p className='text-sm text-muted-foreground'>Check the Debug or Tests tabs for more content</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="debug" className="space-y-4">
          {debugList.length > 0 ? (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
              {debugList.map((q, index) => (
                <button
                  key={q.id}
                  onClick={() => handleQuestionClick(q.id)}
                  className='group relative overflow-hidden p-5 rounded-2xl border bg-card text-left transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10 hover:-translate-y-1'
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className='absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity' />
                  
                  <div className='relative'>
                    <div className='flex items-start justify-between mb-3'>
                      <DifficultyBadge difficulty={q.difficulty} />
                      <Badge variant="outline" className="text-xs capitalize text-muted-foreground">
                        {q.topic}
                      </Badge>
                    </div>
                    
                    <h3 className='font-bold text-foreground mb-2 line-clamp-2 group-hover:text-amber-600 transition-colors'>
                      {q.title}
                    </h3>
                    
                    <p className='text-sm text-muted-foreground line-clamp-2 mb-4'>
                      {q.description}
                    </p>
                    
                    <div className='pt-3 border-t border-border flex items-center justify-between'>
                      <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                        <Bug className='w-3 h-3 text-amber-500' />
                        <span>Debug & Fix</span>
                      </div>
                      <div className='w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all'>
                        <svg className="w-3 h-3 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center py-20 bg-muted/30 rounded-2xl border border-dashed'>
              <div className='w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4'>
                <Bug className='w-8 h-8 text-muted-foreground/50' />
              </div>
              <p className='text-lg font-medium text-foreground mb-2'>No Debug Problems</p>
              <p className='text-sm text-muted-foreground'>Check the Practice or Tests tabs for more content</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          {testList.length > 0 ? (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
              {testList.map((t, index) => (
                <div
                  key={t.id}
                  className='group relative overflow-hidden p-6 rounded-2xl border bg-card transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/10 hover:-translate-y-1'
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className='absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity' />
                  
                  <div className='relative'>
                    <div className='flex items-start justify-between mb-4'>
                      <div className='flex items-center gap-2'>
                        <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-primary/20 flex items-center justify-center'>
                          <Clock className='w-5 h-5 text-violet-500' />
                        </div>
                        <Badge variant="outline" className="gap-1">
                          <Clock className="w-3 h-3" />
                          {t.duration} min
                        </Badge>
                      </div>
                      <Badge variant="secondary" className="gap-1">
                        <FileCode className="w-3 h-3" />
                        {t._count?.questions || 0} Questions
                      </Badge>
                    </div>
                    
                    <h3 className='text-xl font-bold text-foreground mb-3 group-hover:text-violet-600 transition-colors'>
                      {t.title}
                    </h3>
                    
                    <Button
                      onClick={() => handleTestClick(t.id)}
                      className='w-full gap-2 mt-4 bg-gradient-to-r from-violet-500 to-primary hover:from-violet-600 hover:to-primary/90'
                    >
                      <Play className='w-4 h-4' />
                      Start Test
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center py-20 bg-muted/30 rounded-2xl border border-dashed'>
              <div className='w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4'>
                <FileCode className='w-8 h-8 text-muted-foreground/50' />
              </div>
              <p className='text-lg font-medium text-foreground mb-2'>No Tests Available</p>
              <p className='text-sm text-muted-foreground'>Check the Practice or Debug tabs for problems</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}