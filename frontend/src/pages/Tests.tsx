import { AppLayout } from "@/components/AppLayout";
import { todayTests } from "@/data/dummy";
import { Link } from "react-router-dom";

export default function Tests() {
  return (
    <AppLayout>
      <h2 className="text-xl font-bold text-foreground mb-6">All Tests</h2>
      <div className="space-y-3">
        {todayTests.map((test) => (
          <div key={test.id} className="flex items-center gap-4 bg-card rounded-2xl p-5 shadow-sm border border-border">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
              test.status === "completed" ? "bg-card-green" : "bg-card-orange"
            }`}>
              {test.status === "completed" ? "✅" : "📋"}
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">{test.name}</p>
              <p className="text-sm text-muted-foreground">{test.course} · {test.type}</p>
            </div>
            <span className={`text-xs font-medium px-3 py-1 rounded-full ${
              test.status === "completed"
                ? "bg-card-green text-success"
                : "bg-card-orange text-accent-foreground"
            }`}>
              {test.status === "completed" ? "Completed" : "Pending"}
            </span>
            {test.status === "pending" && (
              <Link
                to="/test-page"
                className="text-sm font-medium bg-primary text-primary-foreground px-5 py-2 rounded-xl hover:opacity-90 transition-opacity"
              >
                Start Test
              </Link>
            )}
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
