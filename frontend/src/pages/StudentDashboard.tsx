import { AppLayout } from "@/components/AppLayout";
import { RightPanel } from "@/components/RightPanel";
import { performanceCards, recentTests } from "@/data/dummy";

export default function StudentDashboard() {
  return (
    <AppLayout rightPanel={<RightPanel />}>
      <h2 className="text-xl font-bold text-foreground mb-6">Student Dashboard</h2>

      {/* Performance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {performanceCards.map((card) => (
          <div key={card.title} className="bg-card rounded-2xl p-5 border border-border shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{card.icon}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{card.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{card.title}</p>
            <p className="text-xs text-success mt-1">{card.change}</p>
          </div>
        ))}
      </div>

      {/* Recent Tests */}
      <h3 className="text-lg font-semibold text-foreground mb-4">Recent Tests</h3>
      <div className="space-y-3">
        {recentTests.map((test) => (
          <div key={test.name} className="flex items-center gap-4 bg-card rounded-2xl p-4 border border-border">
            <div className="w-10 h-10 rounded-xl bg-card-blue flex items-center justify-center text-lg">📝</div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{test.name}</p>
              <p className="text-xs text-muted-foreground">{test.date}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-foreground">{test.score}/{test.total}</p>
              <div className="w-20 h-1.5 bg-secondary rounded-full mt-1">
                <div className="h-full bg-primary rounded-full" style={{ width: `${test.score}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
