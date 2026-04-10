import { useParams, Link, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { studentCourses, courseTests, CourseTest } from "@/data/dummy";
import { ArrowLeft, Clock, CheckCircle2, Lock, ChevronRight } from "lucide-react";
import { useState } from "react";

type Category = "weekly" | "topic-wise" | "practice";

const categoryLabels: Record<Category, { label: string; description: string; icon: string }> = {
  weekly: { label: "Weekly Tests", description: "Scheduled assessments every week", icon: "📅" },
  "topic-wise": { label: "Topic-wise Tests", description: "Tests organized by topic", icon: "📚" },
  practice: { label: "Practice Tests", description: "Unlimited practice to improve", icon: "🎯" },
};

function StatusBadge({ status, score }: { status: CourseTest["status"]; score?: number }) {
  if (status === "completed") return (
    <div className="flex items-center gap-1.5 text-xs font-semibold text-success">
      <CheckCircle2 className="w-4 h-4" /> {score}%
    </div>
  );
  if (status === "locked") return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Lock className="w-4 h-4" /> Locked
    </div>
  );
  return null;
}

export default function StudentCourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const id = Number(courseId);
  const course = studentCourses.find((c) => c.id === id);
  const tests = courseTests[id] || [];
  const [activeCategory, setActiveCategory] = useState<Category>("weekly");

  if (!course) return (
    <AppLayout>
      <div className="text-center py-20">
        <p className="text-muted-foreground">Course not found</p>
        <Link to="/student" className="text-primary text-sm mt-2 inline-block">Back to Dashboard</Link>
      </div>
    </AppLayout>
  );

  const filteredTests = tests.filter((t) => t.category === activeCategory);
  const completedCount = tests.filter((t) => t.status === "completed").length;

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-secondary">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <span className="text-2xl">{course.icon}</span> {course.name}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {completedCount}/{tests.length} tests completed · {course.progress}% progress
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="w-full h-2.5 bg-secondary rounded-full">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${course.progress}%` }} />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-6">
        {(Object.keys(categoryLabels) as Category[]).map((cat) => {
          const count = tests.filter((t) => t.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-foreground hover:border-primary/40"
              }`}
            >
              <span>{categoryLabels[cat].icon}</span>
              {categoryLabels[cat].label}
              <span className={`text-xs px-1.5 py-0.5 rounded-md ${
                activeCategory === cat ? "bg-primary-foreground/20" : "bg-secondary"
              }`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Test list */}
      <div className="space-y-3">
        {filteredTests.map((test) => (
          <div
            key={test.id}
            className={`flex items-center gap-4 bg-card rounded-2xl p-5 border border-border shadow-sm transition-all ${
              test.status === "locked" ? "opacity-50" : "hover:border-primary/30"
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
              test.status === "completed" ? "bg-card-green text-foreground" :
              test.status === "locked" ? "bg-secondary text-muted-foreground" :
              "bg-card-blue text-foreground"
            }`}>
              {test.status === "completed" ? "✅" : test.status === "locked" ? "🔒" : "📝"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{test.name}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span>{test.topic}</span>
                <span>·</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {test.duration}</span>
                <span>·</span>
                <span>{test.questions} questions</span>
                {test.dueDate && <><span>·</span><span>Due: {test.dueDate}</span></>}
              </div>
            </div>
            <StatusBadge status={test.status} score={test.score} />
            {test.status === "pending" && (
              <Link
                to={`/student/test-page/${test.id}`}
                className="flex items-center gap-1 text-xs font-medium bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
              >
                Start <ChevronRight className="w-3 h-3" />
              </Link>
            )}
            {test.status === "completed" && (
              <Link
                to={`/student/test-page/${test.id}?review=true`}
                className="text-xs font-medium text-primary hover:underline"
              >
                Review
              </Link>
            )}
          </div>
        ))}
        {filteredTests.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No {categoryLabels[activeCategory].label.toLowerCase()} available yet.
          </div>
        )}
      </div>
    </AppLayout>
  );
}
