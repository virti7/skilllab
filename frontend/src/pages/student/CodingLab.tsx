import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { RightPanel } from '@/components/RightPanel';
import { codingApi, CodingBatch } from '@/lib/api';
import { Loader2, Code2, BookOpen, FileCode, TrendingUp, Users, Clock } from 'lucide-react';

export default function CodingLab() {
  const navigate = useNavigate();
  const [batches, setBatches] = useState<CodingBatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

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

  const handleBatchClick = (batch: CodingBatch) => {
    const id = batch.id || batch.batchId;
    navigate(`/student/coding/${id}`);
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

  return (
    <AppLayout rightPanel={<RightPanel />}>
      <div className='mb-8'>
        <div className='flex items-center gap-3 mb-2'>
          <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-primary flex items-center justify-center'>
            <Code2 className='w-5 h-5 text-white' />
          </div>
          <div>
            <h1 className='text-2xl font-bold text-foreground'>Coding Lab</h1>
            <p className='text-sm text-muted-foreground'>Master your coding skills</p>
          </div>
        </div>
      </div>

      {batches.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-20'>
          <div className='w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center mb-6'>
            <Code2 className='w-12 h-12 text-primary/50' />
          </div>
          <h3 className='text-xl font-semibold text-foreground mb-2'>No Coding Batches</h3>
          <p className='text-muted-foreground text-center max-w-md'>
            You don't have access to any coding batches yet.<br />
            <span className='text-sm'>Contact your administrator to get started.</span>
          </p>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {batches.map((batch, index) => (
            <button
              key={batch.id}
              onClick={() => handleBatchClick(batch)}
              className='group relative overflow-hidden p-6 rounded-2xl border bg-card text-left transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1'
              style={{
                animationDelay: `${index * 100}ms`
              }}
            >
              <div className='absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity' />
              
              <div className='relative'>
                <div className='flex items-start justify-between mb-4'>
                  <div className='w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300'>
                    <Code2 className='w-7 h-7 text-primary' />
                  </div>
                  <div className='w-8 h-8 rounded-full bg-muted flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0'>
                    <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                <h3 className='text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors'>
                  {batch.name}
                </h3>
                
                <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                  <div className='flex items-center gap-1.5'>
                    <BookOpen className='w-4 h-4' />
                    <span>{batch._count?.questions || 0} Problems</span>
                  </div>
                  <div className='flex items-center gap-1.5'>
                    <FileCode className='w-4 h-4' />
                    <span>{batch._count?.tests || 0} Tests</span>
                  </div>
                </div>

                <div className='mt-4 pt-4 border-t border-border flex items-center justify-between'>
                  <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                    <TrendingUp className='w-3 h-3 text-green-500' />
                    <span>Track Progress</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </AppLayout>
  );
}