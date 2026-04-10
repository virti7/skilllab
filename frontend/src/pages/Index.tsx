import { AppLayout } from "@/components/AppLayout";
import { RightPanel } from "@/components/RightPanel";
import { classes, todayTests } from "@/data/dummy";
import { MoreHorizontal } from "lucide-react";

const colorMap: Record<string, string> = {
  "card-green": "bg-card-green",
  "card-blue": "bg-card-blue",
  "card-orange": "bg-card-orange",
};

function MyClasses() {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold text-foreground mb-5">My Classes</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {classes.map((cls) => (
          <div
            key={cls.id}
            className={`${colorMap[cls.color] || "bg-card"} rounded-2xl p-6 transition-transform hover:scale-[1.02]`}
          >
            <div className="text-3xl mb-3">{cls.icon}</div>
            <h3 className="font-semibold text-foreground text-base">{cls.title}</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-4">{cls.tasks} Tasks Remaining</p>
            <button className="text-sm font-medium text-foreground bg-card/80 backdrop-blur px-4 py-2 rounded-xl hover:bg-card transition-colors">
              View Tests
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function TodayTasks() {
  return (
    <section>
      <h2 className="text-xl font-bold text-foreground mb-5">Today Tasks</h2>
      <div className="flex gap-4 mb-4 text-sm">
        <button className="font-semibold text-foreground border-b-2 border-primary pb-1">Forum</button>
        <button className="text-muted-foreground hover:text-foreground pb-1">To-do</button>
        <button className="text-muted-foreground hover:text-foreground pb-1">Members</button>
      </div>
      <div className="space-y-3">
        {todayTests.map((test) => (
          <div key={test.id} className="flex items-center gap-4 bg-card rounded-2xl p-4 shadow-sm border border-border">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
              test.status === "completed" ? "bg-card-green" : "bg-card-orange"
            }`}>
              {test.status === "completed" ? "✅" : "📋"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{test.name}</p>
              <p className="text-xs text-muted-foreground">{test.course} · {test.type}</p>
            </div>
            <button className="p-1.5 rounded-lg hover:bg-secondary">
              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
            </button>
            {test.status === "completed" ? (
              <span className="text-xs font-medium text-success">Mark as Done</span>
            ) : (
              <button className="text-xs font-medium bg-primary text-primary-foreground px-4 py-1.5 rounded-lg hover:opacity-90 transition-opacity">
                + Add or Create
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Index() {
  return (
    <AppLayout rightPanel={<RightPanel />}>
      <MyClasses />
      <TodayTasks />
    </AppLayout>
  );
}
