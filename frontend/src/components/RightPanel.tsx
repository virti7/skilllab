import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { upcomingTests } from "@/data/dummy";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function MiniCalendar() {
  const [month] = useState(new Date(2025, 0, 1));
  const today = 20;

  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();

  const cells: (number | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const highlighted = [20, 23];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">January 2025</h3>
        <div className="flex gap-1">
          <button className="p-1 rounded-lg hover:bg-secondary"><ChevronLeft className="w-4 h-4 text-muted-foreground" /></button>
          <button className="p-1 rounded-lg hover:bg-secondary"><ChevronRight className="w-4 h-4 text-muted-foreground" /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
        {DAYS.map((d) => (
          <div key={d} className="text-muted-foreground font-medium py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {cells.map((day, i) => (
          <div
            key={i}
            className={`py-1.5 rounded-lg transition-colors ${
              day === today
                ? "bg-primary text-primary-foreground font-semibold"
                : highlighted.includes(day || 0)
                ? "bg-destructive text-destructive-foreground font-semibold"
                : day
                ? "text-foreground hover:bg-secondary cursor-pointer"
                : ""
            }`}
          >
            {day || ""}
          </div>
        ))}
      </div>
    </div>
  );
}

export function RightPanel() {
  return (
    <div>
      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search anything..."
          className="w-full px-4 py-2.5 rounded-xl bg-secondary text-sm text-foreground placeholder:text-muted-foreground border-none outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <MiniCalendar />

      {/* Upcoming */}
      <div>
        <h3 className="font-semibold text-foreground mb-4">Upcoming</h3>
        <div className="space-y-3">
          {upcomingTests.map((test) => (
            <div key={test.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-secondary transition-colors">
              <div className={`w-1.5 h-full min-h-[40px] rounded-full bg-${test.color}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{test.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Prepare well for the exam</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-medium text-primary">{test.date}</p>
                <p className="text-xs text-muted-foreground">{test.duration}</p>
              </div>
            </div>
          ))}
        </div>
        <button className="text-sm text-primary font-medium mt-4 hover:underline">View all upcoming →</button>
      </div>
    </div>
  );
}
