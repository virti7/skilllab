import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { RightPanel } from "@/components/RightPanel";
import { codingApi, batchApi, Batch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileCode, Plus, Trash2, Clock, Users, BarChart3, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AdminCodingTest {
  id: string;
  title: string;
  duration: number;
  batchId: string;
  batchName?: string;
  createdAt: string;
  _count: {
    questions: number;
  };
}

interface FormData {
  batchId: string;
  title: string;
  duration: number;
}

export default function CodingTests() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [tests, setTests] = useState<AdminCodingTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTestId, setDeletingTestId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({
    batchId: "",
    title: "",
    duration: 60,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [batchData, testData] = await Promise.all([
        batchApi.get(),
        codingApi.getAdminTests(),
      ]);
      setBatches(batchData);
      setTests(testData);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.batchId || !form.title) return;

    setSubmitting(true);
    try {
      await codingApi.createTest({
        batchId: form.batchId,
        title: form.title,
        duration: form.duration,
      });
      setDialogOpen(false);
      setForm({ batchId: "", title: "", duration: 60 });
      await loadData();
    } catch (err) {
      console.error("Failed to create test:", err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteClick(testId: string) {
    setDeletingTestId(testId);
    setDeleteDialogOpen(true);
  }
  
  async function confirmDelete() {
    if (!deletingTestId) return;
    
    try {
      await codingApi.deleteTest(deletingTestId);
      await loadData();
      toast({ title: "Test deleted successfully" });
    } catch (err) {
      console.error("Failed to delete test:", err);
      toast({ title: "Failed to delete test", variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setDeletingTestId(null);
    }
  }

  if (loading) {
    return (
      <AppLayout rightPanel={<RightPanel />}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout rightPanel={<RightPanel />}>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileCode className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Coding Tests</h1>
            </div>
            <p className="text-muted-foreground">Create and manage timed coding tests</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Test
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Coding Test</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Batch</Label>
                  <Select
                    value={form.batchId}
                    onValueChange={(v) => setForm({ ...form, batchId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select batch" />
                    </SelectTrigger>
                    <SelectContent>
                      {batches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Title</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Test title"
                  />
                </div>
                <div>
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) })}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting || !form.batchId || !form.title}>
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Test"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {tests.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileCode className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No Coding Tests Yet</p>
          <p>Create your first coding test to get started</p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tests.map((test) => (
                  <TableRow key={test.id}>
                    <TableCell className="font-medium">{test.title}</TableCell>
                    <TableCell>{test.batchName || "Unknown"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        {test.duration} min
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        {test._count?.questions || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(test.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/admin/coding/test/${test.id}/analytics`)}
                        title="View Analytics"
                      >
                        <BarChart3 className="w-4 h-4 text-primary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(test.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Test
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this test? This action cannot be undone and all submissions will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}