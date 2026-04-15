import { AppLayout } from "@/components/AppLayout";
import {
    FileText,
    Code,
    Bug,
    Layers,
    Loader2,
    Printer,
    Download,
    RefreshCw,
    Check,
    Plus,
    X,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { Skeleton } from "@/components/ui/skeleton";
import {
    practiceSheetsApi,
    PracticeSheetBatch,
    GeneratedPracticeSheet,
    BatchDetails,
    SheetType,
} from "@/lib/api";

type Difficulty = "easy" | "medium" | "hard";

const SHEET_TYPES: { type: SheetType; label: string; icon: typeof FileText; description: string }[] = [
    { type: "mcq", label: "MCQ Sheet", icon: FileText, description: "Multiple choice questions" },
    { type: "coding", label: "Coding Sheet", icon: Code, description: "Programming problems" },
    { type: "debug", label: "Debug Sheet", icon: Bug, description: "Find and fix bugs" },
    { type: "mixed", label: "Mixed Sheet", icon: Layers, description: "All question types" },
];

const DIFFICULTIES: { value: Difficulty; label: string; color: string }[] = [
    { value: "easy", label: "Easy", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
    { value: "hard", label: "Hard", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
];

const CODING_LANGUAGES = [
    { value: "javascript", label: "JavaScript" },
    { value: "python", label: "Python" },
    { value: "java", label: "Java" },
    { value: "cpp", label: "C++" },
    { value: "csharp", label: "C#" },
];

// TODO: Re-enable common topics after fixing AI generation
// const COMMON_TOPICS = [
//   "JavaScript",
//   "Python",
//   "Java",
//   "Data Structures",
//   "Algorithms",
//   "SQL",
//   "React",
//   "Node.js",
//   "Excel",
// ];

interface SheetConfig {
    sheetType: SheetType;
    batchId: string;
    topics: string[];
    difficulties: Difficulty[];
    instituteName: string;
    sheetTitle: string;
    totalMarks: number;
    timeAllowed: string;
    includeAnswerKey: boolean;
    includeWriteSpace: boolean;
    showDifficulty: boolean;
    showStudentInfo: boolean;
    showMarksPerQuestion: boolean;
    mcqCount: number;
    codingCount: number;
    debugCount: number;
    codingLanguage: string;
    concepts: string[];
    curriculum: string[];
}

const DEFAULT_CONFIG: SheetConfig = {
    sheetType: "mcq",
    batchId: "",
    topics: ["JavaScript"],
    difficulties: ["easy", "medium", "hard"],
    instituteName: "",
    sheetTitle: "Practice Sheet",
    totalMarks: 50,
    timeAllowed: "45 mins",
    includeAnswerKey: true,
    includeWriteSpace: true,
    showDifficulty: true,
    showStudentInfo: true,
    showMarksPerQuestion: true,
    mcqCount: 20,
    codingCount: 3,
    debugCount: 2,
    codingLanguage: "javascript",
    concepts: [],
    curriculum: [],
};

export default function PracticeSheets() {
    const [config, setConfig] = useState<SheetConfig>(DEFAULT_CONFIG);
    const [batches, setBatches] = useState<PracticeSheetBatch[]>([]);
    const [batchDetails, setBatchDetails] = useState<BatchDetails | null>(null);
    const [sheetData, setSheetData] = useState<GeneratedPracticeSheet | null>(null);
    const [loadingBatches, setLoadingBatches] = useState(true);
    const [loadingBatchDetails, setLoadingBatchDetails] = useState(false);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [newConceptInput, setNewConceptInput] = useState("");
    const [newCurriculumInput, setNewCurriculumInput] = useState("");
    const previewRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadBatches();
    }, []);

    useEffect(() => {
        if (config.batchId) {
            loadBatchDetails(config.batchId);
        } else {
            setBatchDetails(null);
        }
    }, [config.batchId]);

    async function loadBatches() {
        setLoadingBatches(true);
        try {
            const data = await practiceSheetsApi.getBatches();
            setBatches(data);
            if (data.length > 0) {
                setConfig((prev) => ({ ...prev, batchId: data[0].id }));
            }
            const user = JSON.parse(localStorage.getItem("skilllab_user") || "{}");
            if (user.instituteName) {
                setConfig((prev) => ({ ...prev, instituteName: user.instituteName }));
            } else if (data.length > 0) {
                setConfig((prev) => ({ ...prev, instituteName: "SkillLab Institute" }));
            }
        } catch (err) {
            console.error("Failed to load batches:", err);
        } finally {
            setLoadingBatches(false);
        }
    }

    async function loadBatchDetails(batchId: string) {
        setLoadingBatchDetails(true);
        try {
            const details = await practiceSheetsApi.getBatchDetails(batchId);
            setBatchDetails(details);
            if (details.topics && details.topics.length > 0) {
                setConfig((prev) => ({ ...prev, topics: details.topics }));
            }
        } catch (err) {
            console.error("Failed to load batch details:", err);
        } finally {
            setLoadingBatchDetails(false);
        }
    }

    async function handleGeneratePreview() {
        setGenerating(true);
        setLoading(true);
        try {
            const requestData = {
                sheetType: config.sheetType,
                instituteName: config.instituteName,
                sheetTitle: config.sheetTitle,
                totalMarks: config.totalMarks,
                topics: config.topics,
                difficulties: config.difficulties,
                includeAnswerKey: config.includeAnswerKey,
                includeWriteSpace: config.includeWriteSpace,
                showDifficulty: config.showDifficulty,
                showStudentInfo: config.showStudentInfo,
                showMarksPerQuestion: config.showMarksPerQuestion,
                batchId: config.batchId || undefined,
                mcqCount: config.mcqCount,
                codingCount: config.codingCount,
                debugCount: config.debugCount,
                codingLanguage: config.codingLanguage,
                concepts: config.concepts,
                curriculum: config.curriculum,
            };

            console.log('==========================================');
            console.log('=== FRONTEND GENERATE REQUEST ===');
            console.log('config.concepts:', JSON.stringify(config.concepts));
            console.log('config.curriculum:', JSON.stringify(config.curriculum));
            console.log('Full requestData:', JSON.stringify(requestData));
            console.log('==========================================');

            const data = await practiceSheetsApi.generateSheet(requestData);
            setSheetData(data);
            toast.success("Practice sheet generated successfully!");
        } catch (err) {
            console.error("Failed to generate sheet:", err);
            toast.error(err instanceof Error ? err.message : "Failed to generate practice sheet");
        } finally {
            setLoading(false);
            setGenerating(false);
        }
    }

    function handlePrint() {
        const printContent = previewRef.current;
        if (!printContent) return;

        const printWindow = window.open("", "_blank");
        if (!printWindow) {
            toast.error("Please allow popups to print");
            return;
        }

        printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${config.sheetTitle}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Inter', -apple-system, sans-serif; padding: 20px; }
            @media print {
              @page { margin: 15mm; }
            }
          </style>
        </head>
        <body>${printContent.innerHTML}</body>
      </html>
    `);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.print();
        }, 250);
    }

    async function handleDownloadPDF() {
        const printContent = previewRef.current;
        if (!printContent) return;

        toast.loading("Generating PDF...", { id: "pdf-download" });

        try {
            const canvas = await html2canvas(printContent, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff",
            });

            const imgData = canvas.toDataURL("image/jpeg", 0.95);
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
            });

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pageWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            const fileName = `${config.sheetTitle.replace(/[^a-zA-Z0-9]/g, "-")}-skilllab.pdf`;
            pdf.save(fileName);
            toast.success("PDF downloaded successfully!", { id: "pdf-download" });
        } catch (err) {
            console.error("PDF generation failed:", err);
            toast.error("Failed to generate PDF", { id: "pdf-download" });
        }
    }

    function toggleTopic(topic: string) {
        setConfig((prev) => ({
            ...prev,
            topics: prev.topics.includes(topic)
                ? prev.topics.filter((t) => t !== topic)
                : [...prev.topics, topic],
        }));
    }

    function addConcept() {
        const trimmed = newConceptInput.trim();
        if (!trimmed) {
            console.log('Empty concept input');
            return;
        }

        if (config.concepts.includes(trimmed)) {
            console.log('Duplicate concept:', trimmed);
            toast.info('Concept already added');
            return;
        }

        console.log('>>> ADDING CONCEPT:', trimmed);
        const newConcepts = [...config.concepts, trimmed];
        console.log('>>> NEW CONCEPTS ARRAY:', newConcepts);

        setConfig(prev => ({ ...prev, concepts: newConcepts }));
        setNewConceptInput("");
        toast.success(`Added: ${trimmed}`);
    }

    function removeConcept(concept: string) {
        setConfig((prev) => ({
            ...prev,
            concepts: prev.concepts.filter((c) => c !== concept),
        }));
    }

    function addCurriculum() {
        const trimmed = newCurriculumInput.trim();
        if (!trimmed) {
            console.log('Empty curriculum input');
            return;
        }

        if (config.curriculum.includes(trimmed)) {
            console.log('Duplicate curriculum:', trimmed);
            toast.info('Curriculum already added');
            return;
        }

        console.log('>>> ADDING CURRICULUM:', trimmed);
        const newCurriculum = [...config.curriculum, trimmed];
        console.log('>>> NEW CURRICULUM ARRAY:', newCurriculum);

        setConfig(prev => ({ ...prev, curriculum: newCurriculum }));
        setNewCurriculumInput("");
        toast.success(`Added: ${trimmed}`);
    }

    function removeCurriculum(item: string) {
        setConfig((prev) => ({
            ...prev,
            curriculum: prev.curriculum.filter((c) => c !== item),
        }));
    }

    function toggleDifficulty(diff: Difficulty) {
        setConfig((prev) => ({
            ...prev,
            difficulties: prev.difficulties.includes(diff)
                ? prev.difficulties.filter((d) => d !== diff)
                : [...prev.difficulties, diff],
        }));
    }

    function getDifficultyColor(difficulty: string | null) {
        if (!difficulty) return "bg-gray-100 text-gray-600";
        const diff = DIFFICULTIES.find((d) => d.value === difficulty.toLowerCase());
        return diff?.color || "bg-gray-100 text-gray-600";
    }

    function getQuestionCount(): number {
        if (!sheetData) return 0;
        return sheetData.mcq.length + sheetData.coding.length + sheetData.debug.length;
    }

    const today = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    return (
        <AppLayout>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">Practice Sheet Generator</h2>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* LEFT PANEL - Builder */}
                <div className="space-y-6">
                    {/* Sheet Type Selector */}
                    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                        <h3 className="text-sm font-semibold text-foreground mb-4">Sheet Type</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {SHEET_TYPES.map((st) => (
                                <button
                                    key={st.type}
                                    onClick={() =>
                                        setConfig((prev) => ({ ...prev, sheetType: st.type }))
                                    }
                                    className={`p-4 rounded-xl border-2 text-left transition-all ${config.sheetType === st.type
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:border-primary/50"
                                        }`}
                                >
                                    <st.icon className={`w-5 h-5 mb-2 ${config.sheetType === st.type ? "text-primary" : "text-muted-foreground"}`} />
                                    <p className={`text-sm font-medium ${config.sheetType === st.type ? "text-primary" : "text-foreground"}`}>
                                        {st.label}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{st.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Batch & Topic Filters */}
                    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                        <h3 className="text-sm font-semibold text-foreground mb-4">Configuration</h3>

                        {/* Batch Selection */}
                        <div className="mb-4">
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Select Batch (Optional)</label>
                            {loadingBatches ? (
                                <Skeleton className="h-10 w-full rounded-xl" />
                            ) : (
                                <select
                                    value={config.batchId}
                                    onChange={(e) => setConfig((prev) => ({ ...prev, batchId: e.target.value }))}
                                    className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary/60"
                                >
                                    <option value="">No specific batch</option>
                                    {batches.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.name} ({b.studentCount} students)
                                        </option>
                                    ))}
                                </select>
                            )}
                            {loadingBatchDetails && (
                                <p className="text-xs text-muted-foreground mt-1">Loading batch topics...</p>
                            )}
                            {batchDetails && !loadingBatchDetails && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    Batch has {batchDetails.topics.length} topics • {batchDetails.questionCount} questions
                                </p>
                            )}
                        </div>

                        {/* Curriculum Input */}
                        <div className="mb-4">
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Add Curriculum / Syllabus</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newCurriculumInput}
                                    onChange={(e) => setNewCurriculumInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCurriculum())}
                                    placeholder="e.g. JavaScript Basics"
                                    className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary/60"
                                />
                                <button
                                    onClick={addCurriculum}
                                    className="px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                            {config.curriculum.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {config.curriculum.map((c) => (
                                        <span
                                            key={c}
                                            className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full dark:bg-purple-900/30 dark:text-purple-400"
                                        >
                                            {c}
                                            <button onClick={() => removeCurriculum(c)} className="hover:text-purple-900">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Custom Concepts Input */}
                        <div className="mb-4">
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Add Custom Concepts</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newConceptInput}
                                    onChange={(e) => setNewConceptInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addConcept())}
                                    placeholder="e.g. Arrays, Loops, Functions"
                                    className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary/60"
                                />
                                <button
                                    onClick={addConcept}
                                    className="px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                            {config.concepts.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {config.concepts.map((c) => (
                                        <span
                                            key={c}
                                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full dark:bg-blue-900/30 dark:text-blue-400"
                                        >
                                            {c}
                                            <button onClick={() => removeConcept(c)} className="hover:text-blue-900">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* TODO: Re-enable common topics after fixing AI generation */}
                        {/* <div className="mb-4">
              <label className="block text-xs font-medium text-muted-foreground mb-2">
                Common Topics {batchDetails?.topics.length ? `(includes ${batchDetails.topics.length} from batch)` : ''}
              </label>
              <div className="flex flex-wrap gap-2">
                {[...new Set([...COMMON_TOPICS, ...(batchDetails?.topics || [])])].map((topic) => (
                  <button
                    key={topic}
                    onClick={() => toggleTopic(topic)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      config.topics.includes(topic)
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {config.topics.includes(topic) && <Check className="w-3 h-3 inline mr-1" />}
                    {topic}
                  </button>
                ))}
              </div>
            </div> */}

                        {/* Difficulty Filter */}
                        <div className="mb-4">
                            <label className="block text-xs font-medium text-muted-foreground mb-2">Difficulty Levels</label>
                            <div className="flex gap-2">
                                {DIFFICULTIES.map((d) => (
                                    <button
                                        key={d.value}
                                        onClick={() => toggleDifficulty(d.value)}
                                        className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${config.difficulties.includes(d.value)
                                                ? d.color
                                                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                                            }`}
                                    >
                                        {d.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Question Counts */}
                        <div className="grid grid-cols-3 gap-3">
                            {(config.sheetType === 'mcq' || config.sheetType === 'mixed') && (
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">MCQ Count</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={config.mcqCount}
                                        onChange={(e) => setConfig((prev) => ({ ...prev, mcqCount: Number(e.target.value) }))}
                                        className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary/60"
                                    />
                                </div>
                            )}
                            {(config.sheetType === 'coding' || config.sheetType === 'mixed') && (
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Coding Qs</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="20"
                                        value={config.codingCount}
                                        onChange={(e) => setConfig((prev) => ({ ...prev, codingCount: Number(e.target.value) }))}
                                        className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary/60"
                                    />
                                </div>
                            )}
                            {(config.sheetType === 'debug' || config.sheetType === 'mixed') && (
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Debug Qs</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="20"
                                        value={config.debugCount}
                                        onChange={(e) => setConfig((prev) => ({ ...prev, debugCount: Number(e.target.value) }))}
                                        className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary/60"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Coding Language Selection */}
                        {(config.sheetType === 'coding' || config.sheetType === 'mixed') && (
                            <div className="mt-4">
                                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Coding Language</label>
                                <select
                                    value={config.codingLanguage}
                                    onChange={(e) => setConfig((prev) => ({ ...prev, codingLanguage: e.target.value }))}
                                    className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary/60"
                                >
                                    {CODING_LANGUAGES.map((lang) => (
                                        <option key={lang.value} value={lang.value}>
                                            {lang.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Sheet Details */}
                    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                        <h3 className="text-sm font-semibold text-foreground mb-4">Sheet Details</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Institute Name</label>
                                <input
                                    type="text"
                                    value={config.instituteName}
                                    onChange={(e) => setConfig((prev) => ({ ...prev, instituteName: e.target.value }))}
                                    className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary/60"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Sheet Title</label>
                                <input
                                    type="text"
                                    value={config.sheetTitle}
                                    onChange={(e) => setConfig((prev) => ({ ...prev, sheetTitle: e.target.value }))}
                                    className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary/60"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Total Marks</label>
                                    <input
                                        type="number"
                                        value={config.totalMarks}
                                        onChange={(e) => setConfig((prev) => ({ ...prev, totalMarks: Number(e.target.value) }))}
                                        className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary/60"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Time Allowed</label>
                                    <input
                                        type="text"
                                        value={config.timeAllowed}
                                        onChange={(e) => setConfig((prev) => ({ ...prev, timeAllowed: e.target.value }))}
                                        placeholder="e.g. 45 mins"
                                        className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary/60"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Options Toggles */}
                    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                        <h3 className="text-sm font-semibold text-foreground mb-4">Options</h3>
                        <div className="space-y-3">
                            {[
                                { key: "includeAnswerKey", label: "Include answer key (separate page)" },
                                { key: "includeWriteSpace", label: "Include write space for solutions" },
                                { key: "showDifficulty", label: "Show difficulty markers" },
                                { key: "showStudentInfo", label: "Student info section (Name/Batch/Score)" },
                                { key: "showMarksPerQuestion", label: "Marks per question" },
                            ].map((opt) => (
                                <label key={opt.key} className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={config[opt.key as keyof SheetConfig] as boolean}
                                        onChange={(e) =>
                                            setConfig((prev) => ({ ...prev, [opt.key]: e.target.checked }))
                                        }
                                        className="w-4 h-4 rounded accent-primary"
                                    />
                                    <span className="text-sm text-foreground">{opt.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Generate Button */}
                    <button
                        onClick={handleGeneratePreview}
                        disabled={generating}
                        className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-all"
                    >
                        {generating ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <RefreshCw className="w-4 h-4" />
                        )}
                        {generating ? "Generating with AI..." : "Generate with AI"}
                    </button>
                </div>

                {/* RIGHT PANEL - Preview */}
                <div className="space-y-4">
                    {/* Preview Toolbar */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-semibold text-foreground">Preview</h3>
                            {sheetData && (
                                <p className="text-xs text-muted-foreground">
                                    {getQuestionCount()} questions • {sheetData.totalMarks} marks
                                </p>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleGeneratePreview}
                                disabled={generating}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-secondary hover:bg-secondary/80 text-foreground transition-colors disabled:opacity-60"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Regenerate
                            </button>
                            <button
                                onClick={handlePrint}
                                disabled={!sheetData}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-secondary hover:bg-secondary/80 text-foreground transition-colors disabled:opacity-60"
                            >
                                <Printer className="w-3.5 h-3.5" />
                                Print
                            </button>
                            <button
                                onClick={handleDownloadPDF}
                                disabled={!sheetData}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 transition-colors disabled:opacity-60"
                            >
                                <Download className="w-3.5 h-3.5" />
                                Download PDF
                            </button>
                        </div>
                    </div>

                    {/* Preview Area */}
                    <div className="bg-secondary rounded-2xl p-4 overflow-auto max-h-[calc(100vh-220px)]">
                        {loading ? (
                            <div className="space-y-4 p-8">
                                <Skeleton className="h-32 w-full rounded-xl" />
                                <Skeleton className="h-48 w-full rounded-xl" />
                                <Skeleton className="h-24 w-full rounded-xl" />
                            </div>
                        ) : !sheetData ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <FileText className="w-12 h-12 text-muted-foreground/40 mb-3" />
                                <p className="text-sm text-muted-foreground">
                                    Configure your sheet and click "Generate with AI"
                                </p>
                            </div>
                        ) : (
                            <div ref={previewRef} className="bg-white rounded-lg shadow-lg overflow-hidden">
                                {/* SHEET HEADER */}
                                <div className="p-6 border-b-2 border-gray-200">
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">
                                            {sheetData.instituteName}
                                        </p>
                                        <h1 className="text-2xl font-bold text-gray-900 mb-3">
                                            {sheetData.sheetTitle}
                                        </h1>
                                        <div className="flex justify-center gap-6 text-xs text-gray-600">
                                            <span>Time Allowed: <strong>{config.timeAllowed}</strong></span>
                                            <span>Total Marks: <strong>{sheetData.totalMarks}</strong></span>
                                            <span>Date: <strong>{today}</strong></span>
                                            <span>Roll No: ________</span>
                                        </div>
                                    </div>
                                </div>

                                {/* STUDENT INFO SECTION */}
                                {config.showStudentInfo && (
                                    <div className="px-6 py-4 border-b border-gray-200">
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="border-b-2 border-dashed border-gray-300 pb-1">
                                                <span className="text-xs text-gray-500">Student Name: </span>
                                            </div>
                                            <div className="border-b-2 border-dashed border-gray-300 pb-1">
                                                <span className="text-xs text-gray-500">Batch: </span>
                                            </div>
                                            <div className="border-b-2 border-dashed border-gray-300 pb-1">
                                                <span className="text-xs text-gray-500">Score: </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* MCQ SECTION */}
                                {sheetData.mcq.length > 0 && (
                                    <div className="px-6 py-4">
                                        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <FileText className="w-4 h-4" />
                                            Multiple Choice Questions
                                        </h2>
                                        <div className="space-y-4">
                                            {sheetData.mcq.map((q, idx) => (
                                                <div key={q.id} className="border border-gray-200 rounded-lg p-4">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <p className="text-sm font-medium text-gray-900">
                                                            Q{idx + 1}. {q.questionText}
                                                        </p>
                                                        <div className="flex items-center gap-2 ml-2">
                                                            {config.showMarksPerQuestion && (
                                                                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded">
                                                                    {q.marks || 1} mark{q.marks !== 1 ? 's' : ''}
                                                                </span>
                                                            )}
                                                            {config.showDifficulty && q.topic && (
                                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                                                    {q.topic}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {[
                                                            { key: "A", val: q.optionA },
                                                            { key: "B", val: q.optionB },
                                                            { key: "C", val: q.optionC },
                                                            { key: "D", val: q.optionD },
                                                        ].map((opt) => (
                                                            <div
                                                                key={opt.key}
                                                                className="border border-gray-200 rounded px-3 py-2 text-xs text-gray-700"
                                                            >
                                                                <span className="font-semibold mr-2">{opt.key}.</span>
                                                                {opt.val}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* CODING SECTION */}
                                {sheetData.coding.length > 0 && (
                                    <div className="px-6 py-4 border-t border-gray-200">
                                        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <Code className="w-4 h-4" />
                                            Coding Problems — Write your solution
                                        </h2>
                                        <div className="space-y-6">
                                            {sheetData.coding.map((q, idx) => {
                                                const testCases = Array.isArray(q.testCases) ? q.testCases : [];
                                                return (
                                                    <div key={q.id} className="border border-gray-200 rounded-lg p-4">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <p className="text-sm font-semibold text-gray-900">
                                                                Q{sheetData.mcq.length + idx + 1}. {q.title}
                                                            </p>
                                                            <div className="flex items-center gap-2 ml-2">
                                                                {config.showMarksPerQuestion && (
                                                                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded">
                                                                        {q.marks || 5} marks
                                                                    </span>
                                                                )}
                                                                {config.showDifficulty && q.difficulty && (
                                                                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${getDifficultyColor(q.difficulty)}`}>
                                                                        {q.difficulty}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <p className="text-sm text-gray-700 mb-3 whitespace-pre-wrap">{q.description}</p>

                                                        {q.constraints && (
                                                            <div className="bg-gray-50 rounded p-2 mb-3">
                                                                <p className="text-xs font-semibold text-gray-600 mb-1">Constraints:</p>
                                                                <pre className="text-xs text-gray-800 whitespace-pre-wrap">{q.constraints}</pre>
                                                            </div>
                                                        )}

                                                        {/* Test Cases */}
                                                        {testCases.length > 0 && (
                                                            <div className="grid grid-cols-2 gap-3 mb-3">
                                                                <div className="bg-gray-50 rounded p-2">
                                                                    <p className="text-xs font-semibold text-gray-600 mb-1">Example Input:</p>
                                                                    <pre className="text-xs text-gray-800 font-mono whitespace-pre-wrap">
                                                                        {testCases[0]?.input || "N/A"}
                                                                    </pre>
                                                                </div>
                                                                <div className="bg-gray-50 rounded p-2">
                                                                    <p className="text-xs font-semibold text-gray-600 mb-1">Expected Output:</p>
                                                                    <pre className="text-xs text-gray-800 font-mono whitespace-pre-wrap">
                                                                        {testCases[0]?.output || "N/A"}
                                                                    </pre>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Starter Code */}
                                                        {q.starterCode && (
                                                            <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-3">
                                                                <p className="text-xs font-semibold text-gray-600 mb-2">Starter Code ({q.language || 'JavaScript'}):</p>
                                                                <pre className="text-xs font-mono whitespace-pre-wrap overflow-x-auto">
                                                                    {q.starterCode}
                                                                </pre>
                                                            </div>
                                                        )}

                                                        {/* Hints */}
                                                        {q.hints && q.hints.length > 0 && (
                                                            <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-3">
                                                                <p className="text-xs font-semibold text-yellow-700 mb-1">Hints:</p>
                                                                <ul className="text-xs text-gray-700 list-disc list-inside">
                                                                    {q.hints.map((hint, i) => (
                                                                        <li key={i}>{hint}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}

                                                        {/* Write Space */}
                                                        {config.includeWriteSpace && (
                                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[120px]">
                                                                <div className="space-y-3">
                                                                    {[...Array(8)].map((_, i) => (
                                                                        <div key={i} className="border-b border-gray-200 pb-2">
                                                                            <span className="text-gray-300 text-sm">{i + 1}.</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* DEBUG SECTION */}
                                {sheetData.debug.length > 0 && (
                                    <div className="px-6 py-4 border-t border-gray-200">
                                        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <Bug className="w-4 h-4" />
                                            Debug Challenges — Find and fix all bugs
                                        </h2>
                                        <div className="space-y-6">
                                            {sheetData.debug.map((q, idx) => {
                                                const totalPrev = sheetData.mcq.length + sheetData.coding.length;
                                                return (
                                                    <div key={q.id} className="border border-gray-200 rounded-lg p-4">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <p className="text-sm font-semibold text-gray-900">
                                                                Q{totalPrev + idx + 1}. {q.title}
                                                            </p>
                                                            <div className="flex items-center gap-2 ml-2">
                                                                {config.showMarksPerQuestion && (
                                                                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded">
                                                                        {q.marks || 5} marks
                                                                    </span>
                                                                )}
                                                                {config.showDifficulty && q.difficulty && (
                                                                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${getDifficultyColor(q.difficulty)}`}>
                                                                        {q.difficulty}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <p className="text-sm text-gray-700 mb-3 whitespace-pre-wrap">{q.description}</p>

                                                        {/* Buggy Code */}
                                                        {q.buggyCode && (
                                                            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-lg p-3 mb-3">
                                                                <p className="text-xs font-semibold text-red-600 mb-2">Buggy Code:</p>
                                                                <pre className="text-xs text-gray-800 font-mono whitespace-pre-wrap overflow-x-auto">
                                                                    {q.buggyCode}
                                                                </pre>
                                                            </div>
                                                        )}

                                                        {/* Expected Output */}
                                                        {q.expectedOutput && (
                                                            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 rounded-lg p-3 mb-3">
                                                                <p className="text-xs font-semibold text-green-600 mb-1">Expected Behavior:</p>
                                                                <pre className="text-xs text-gray-800 font-mono">{q.expectedOutput}</pre>
                                                            </div>
                                                        )}

                                                        {/* Hints */}
                                                        {q.hints && q.hints.length > 0 && (
                                                            <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-3">
                                                                <p className="text-xs font-semibold text-yellow-700 mb-1">Hints:</p>
                                                                <ul className="text-xs text-gray-700 list-disc list-inside">
                                                                    {q.hints.map((hint, i) => (
                                                                        <li key={i}>{hint}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}

                                                        {/* Write Space */}
                                                        {config.includeWriteSpace && (
                                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[80px]">
                                                                <div className="space-y-2">
                                                                    {[...Array(6)].map((_, i) => (
                                                                        <div key={i} className="border-b border-gray-200 pb-1.5">
                                                                            <span className="text-gray-300 text-sm">{i + 1}.</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* ANSWER KEY PAGE */}
                                {config.includeAnswerKey && getQuestionCount() > 0 && (
                                    <div className="border-t-4 border-double border-gray-400 mt-6 pt-6 px-6 page-break-before">
                                        <div className="text-center mb-4">
                                            <p className="text-xs text-red-500 font-semibold uppercase tracking-widest">
                                                Instructor Only — Answer Key
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Sheet: {sheetData.sheetTitle} | Language: {sheetData.codingLanguage || 'N/A'} | Topics: {sheetData.topics.join(', ')}
                                            </p>
                                        </div>

                                        {/* MCQ Answers */}
                                        {sheetData.mcq.length > 0 && (
                                            <div className="mb-4">
                                                <h3 className="text-sm font-semibold text-gray-900 mb-2">Multiple Choice Answers</h3>
                                                <div className="grid grid-cols-4 gap-2">
                                                    {sheetData.mcq.map((q, idx) => (
                                                        <div key={q.id} className="bg-gray-50 rounded px-3 py-2 text-xs">
                                                            <span className="font-semibold">Q{idx + 1}:</span>{" "}
                                                            <span className="text-primary font-bold">{q.correctOption}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Coding Solutions */}
                                        {sheetData.coding.length > 0 && (
                                            <div className="mb-4">
                                                <h3 className="text-sm font-semibold text-gray-900 mb-2">Coding Solutions ({sheetData.codingLanguage || 'JavaScript'})</h3>
                                                <div className="space-y-3">
                                                    {sheetData.coding.map((q, idx) => (
                                                        <div key={q.id} className="bg-gray-50 rounded p-3">
                                                            <p className="text-xs font-semibold mb-1">
                                                                Q{sheetData.mcq.length + idx + 1}. {q.title} [{q.topic}]
                                                            </p>
                                                            {q.solution ? (
                                                                <div className="mt-2">
                                                                    <p className="text-xs font-medium text-gray-600 mb-1">Solution Approach:</p>
                                                                    <p className="text-xs text-gray-700">{q.solution}</p>
                                                                </div>
                                                            ) : q.solutionCode ? (
                                                                <pre className="text-xs font-mono bg-white border rounded p-2 max-h-32 overflow-auto">
                                                                    {q.solutionCode}
                                                                </pre>
                                                            ) : (
                                                                <p className="text-xs text-gray-500 italic">Solution not available</p>
                                                            )}
                                                            {q.testCases && q.testCases.length > 0 && (
                                                                <div className="mt-2 pt-2 border-t border-gray-200">
                                                                    <p className="text-xs font-medium text-gray-600 mb-1">Test Cases:</p>
                                                                    {q.testCases.map((tc, tcIdx) => (
                                                                        <div key={tcIdx} className="text-xs text-gray-600">
                                                                            <span className="font-mono">Input: {tc.input}</span> → <span className="font-mono">Output: {tc.output}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Debug Solutions */}
                                        {sheetData.debug.length > 0 && (
                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-900 mb-2">Debug Solutions</h3>
                                                <div className="space-y-3">
                                                    {sheetData.debug.map((q, idx) => {
                                                        const totalPrev = sheetData.mcq.length + sheetData.coding.length;
                                                        return (
                                                            <div key={q.id} className="bg-green-50 border border-green-200 rounded p-3">
                                                                <p className="text-xs font-semibold mb-1">
                                                                    Q{totalPrev + idx + 1}. {q.title}
                                                                </p>
                                                                <p className="text-xs text-gray-700">
                                                                    The solution requires fixing the bugs in the provided code.
                                                                </p>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* FOOTER */}
                                <div className="px-6 py-3 border-t border-gray-200 flex justify-between text-xs text-gray-500">
                                    <span>SkillLab{config.instituteName ? ` · ${config.instituteName}` : ""}</span>
                                    <span>Page 1 of 1</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
