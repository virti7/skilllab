import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { RightPanel } from "@/components/RightPanel";
import { batchApi, Batch } from "@/lib/api";
import { codingApi, AdminCodingQuestion } from "@/lib/api";
import { Loader2, Code2, Plus, Trash2, Edit, Sparkles, X, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { useToast } from "@/hooks/use-toast";

interface TestCase {
  input: string;
  expectedOutput: string;
}

interface CodingQuestionForm {
  id?: string;
  batchId: string;
  type: string;
  topic: string;
  difficulty: string;
  title: string;
  description: string;
  starterCode: string;
  testCases: TestCase[];
}

const initialForm: CodingQuestionForm = {
  batchId: "",
  type: "practice",
  topic: "",
  difficulty: "easy",
  title: "",
  description: "",
  starterCode: "",
  testCases: [{ input: "", expectedOutput: "" }],
};

export default function CodingQuestions() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [questions, setQuestions] = useState<AdminCodingQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);
  const [form, setForm] = useState<CodingQuestionForm>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [aiParams, setAiParams] = useState({
    topic: "",
    difficulty: "easy",
    language: "python",
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const fetchBatches = async () => {
    try {
      const token = localStorage.getItem('skilllab_token');
      const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${BASE_URL}/batch/admin/batches`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("Batch API status:", res.status);
      const data = await res.json();
      
      if (!res.ok) {
        console.error("Batch API error:", data);
        setBatches([]);
        return;
      }
      
      console.log("Batch data received:", data);
      setBatches(data);
    } catch (err) {
      console.error("Failed to fetch batches:", err);
    }
  };

  async function loadData() {
    try {
      await fetchBatches();
      
      const questionsData = await codingApi.getAdminQuestions();
      setQuestions(questionsData);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateAI() {
    if (!aiParams.topic.trim()) {
      toast({ title: "Please enter a topic", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const generated = await codingApi.generateQuestion(
        aiParams.topic,
        aiParams.difficulty,
        aiParams.language
      );
      setForm({
        ...form,
        title: generated.title,
        description: generated.description,
        starterCode: generated.starterCode,
        testCases: generated.testCases.map(tc => ({
          input: tc.input,
          expectedOutput: tc.output,
        })),
      });
      setAiDialogOpen(false);
      setDialogOpen(true);
      toast({ title: "Question generated successfully!" });
    } catch (err: any) {
      toast({ title: "Failed to generate question", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.batchId) {
      toast({ title: "Please select a batch", variant: "destructive" });
      return;
    }
    if (!form.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    if (!form.description.trim()) {
      toast({ title: "Description is required", variant: "destructive" });
      return;
    }
    const validTestCases = form.testCases.filter(tc => tc.input.trim() || tc.expectedOutput.trim());
    if (validTestCases.length === 0) {
      toast({ title: "At least one test case is required", variant: "destructive" });
      return;
    }

    console.log("FORM DATA:", form);
    
    setSaving(true);
    try {
      const payload = {
        batchId: form.batchId,
        type: form.type,
        topic: form.topic,
        difficulty: form.difficulty,
        title: form.title,
        description: form.description,
        starterCode: form.starterCode,
        testCases: validTestCases.map(tc => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
        })),
      };

      console.log("PAYLOAD:", payload);

      if (editingId) {
        await codingApi.updateQuestion(editingId, payload);
        toast({ title: "Question updated successfully" });
      } else {
        await codingApi.createQuestion(payload);
        toast({ title: "Question created successfully" });
      }
      setDialogOpen(false);
      setForm(initialForm);
      setEditingId(null);
      loadData();
    } catch (err: any) {
      toast({ title: "Failed to save question", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteClick(id: string) {
    setDeletingQuestionId(id);
    setDeleteDialogOpen(true);
  }
  
  async function confirmDelete() {
    if (!deletingQuestionId) return;
    try {
      await codingApi.deleteQuestion(deletingQuestionId);
      toast({ title: "Question deleted" });
      loadData();
    } catch (err: any) {
      toast({ title: "Failed to delete", description: err.message, variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setDeletingQuestionId(null);
    }
  }

  function openEdit(question: AdminCodingQuestion) {
    let testCases: TestCase[] = [];
    try {
      const parsed = typeof question.testCases === 'string' 
        ? JSON.parse(question.testCases) 
        : question.testCases;
      testCases = parsed.map((tc: any) => ({
        input: tc.input || "",
        expectedOutput: tc.expectedOutput || tc.output || "",
      }));
    } catch {
      testCases = [{ input: "", expectedOutput: "" }];
    }
    setForm({
      id: question.id,
      batchId: "",
      type: question.type,
      topic: question.topic,
      difficulty: question.difficulty,
      title: question.title,
      description: question.description,
      starterCode: question.starterCode || "",
      testCases: testCases.length > 0 ? testCases : [{ input: "", expectedOutput: "" }],
    });
    setEditingId(question.id);
    setDialogOpen(true);
  }

  function openCreate() {
    setForm(initialForm);
    setEditingId(null);
    setDialogOpen(true);
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
              <Code2 className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Coding Questions</h1>
            </div>
            <p className="text-muted-foreground">Create and manage coding problems</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setAiDialogOpen(true)}>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate with AI
            </Button>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
          </div>
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Code2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No Coding Questions Yet</p>
          <p>Create your first coding question to get started</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Title</th>
                <th className="text-left p-3 font-medium">Topic</th>
                <th className="text-left p-3 font-medium">Difficulty</th>
                <th className="text-left p-3 font-medium">Type</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q) => (
                <tr key={q.id} className="border-t hover:bg-muted/30">
                  <td className="p-3">{q.title}</td>
                  <td className="p-3">{q.topic}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-1 rounded ${
                      q.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                      q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {q.difficulty}
                    </span>
                  </td>
                  <td className="p-3">{q.type}</td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(q)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(q.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Question with AI</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Topic</Label>
              <Input
                value={aiParams.topic}
                onChange={(e) => setAiParams({ ...aiParams, topic: e.target.value })}
                placeholder="e.g., Arrays, Strings, Trees"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Difficulty</Label>
                <Select
                  value={aiParams.difficulty}
                  onValueChange={(v) => setAiParams({ ...aiParams, difficulty: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Language</Label>
                <Select
                  value={aiParams.language}
                  onValueChange={(v) => setAiParams({ ...aiParams, language: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="c">C</SelectItem>
                    <SelectItem value="cpp">C++</SelectItem>
                    <SelectItem value="java">Java</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleGenerateAI} disabled={generating} className="w-full">
              {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Generate
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) setForm(initialForm);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit' : 'Create'} Coding Question</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Batch *</Label>
                <select
                  value={form.batchId}
                  onChange={(e) => setForm({ ...form, batchId: e.target.value })}
                  disabled={!!editingId}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select Batch</option>
                  {batches.map(batch => (
                    <option key={batch.id} value={batch.id}>
                      {batch.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="practice">Practice</SelectItem>
                    <SelectItem value="debug">Debug</SelectItem>
                    <SelectItem value="test">Test</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Topic</Label>
                <Input
                  value={form.topic}
                  onChange={(e) => setForm({ ...form, topic: e.target.value })}
                  placeholder="e.g., Arrays, Strings"
                />
              </div>
              <div>
                <Label>Difficulty</Label>
                <Select
                  value={form.difficulty}
                  onValueChange={(v) => setForm({ ...form, difficulty: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Problem title"
                required
              />
            </div>

            <div>
              <Label>Description *</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Problem description"
                rows={4}
                required
              />
            </div>

            <div>
              <Label>Starter Code</Label>
              <Textarea
                value={form.starterCode}
                onChange={(e) => setForm({ ...form, starterCode: e.target.value })}
                placeholder="# Write your starter code here"
                rows={6}
                className="font-mono"
              />
            </div>

            <div>
              <Label>Test Cases *</Label>
              {form.testCases.map((tc, i) => (
                <div key={i} className="grid grid-cols-2 gap-2 mb-2">
                  <Input
                    value={tc.input}
                    onChange={(e) => {
                      const newCases = [...form.testCases];
                      newCases[i].input = e.target.value;
                      setForm({ ...form, testCases: newCases });
                    }}
                    placeholder="Input"
                  />
                  <Input
                    value={tc.expectedOutput}
                    onChange={(e) => {
                      const newCases = [...form.testCases];
                      newCases[i].expectedOutput = e.target.value;
                      setForm({ ...form, testCases: newCases });
                    }}
                    placeholder="Expected Output"
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setForm({
                    ...form,
                    testCases: [...form.testCases, { input: "", expectedOutput: "" }],
                  })
                }
              >
                Add Test Case
              </Button>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingId ? 'Update' : 'Create'} Question
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Question
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this question? This action cannot be undone and all submissions will be lost.
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