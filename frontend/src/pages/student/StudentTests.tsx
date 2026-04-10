import { AppLayout } from "@/components/AppLayout";
import { studentCourses, studentAssignedTests } from "@/data/dummy";
import { Link } from "react-router-dom";

export default function StudentTests() {
  return (
    <AppLayout>
      <h2 className="text-xl font-bold text-foreground mb-6">My Courses & Tests</h2>

      {/* Course cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {studentCourses.map((course) => (
          <Link
            key={course.id}
            to={`/student/courses/${course.id}`}
            className="bg-card rounded-2xl p-5 border border-border shadow-sm hover:border-primary/40 transition-all"
          >
            <div className="text-3xl mb-3">{course.icon}</div>
            <h4 className="font-semibold text-foreground">{course.name}</h4>
            <p className="text-xs text-muted-foreground mt-1">{course.completedTests}/{course.totalTests} tests completed</p>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Progress</span><span>{course.progress}%</span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${course.progress}%` }} />
              </div>
            </div>
            <span className="text-xs text-primary font-medium mt-3 inline-block">View Tests →</span>
          </Link>
        ))}
      </div>

      {/* Pending tests quick list */}
      <h3 className="text-lg font-semibold text-foreground mb-4">Pending Tests</h3>
      <div className="space-y-3">
        {studentAssignedTests
          .filter((t) => t.status === "pending")
          .map((test) => (
            <div key={test.id} className="flex items-center gap-4 bg-card rounded-2xl p-4 border border-border shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-card-orange flex items-center justify-center text-lg">📝</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{test.name}</p>
                <p className="text-xs text-muted-foreground">{test.course} · Due: {test.dueDate} · {test.duration}</p>
              </div>
              <Link
                to="/student/test-page"
                className="text-xs font-medium bg-primary text-primary-foreground px-4 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
              >
                Start Test
              </Link>
            </div>
          ))}
      </div>
    </AppLayout>
  );
}
