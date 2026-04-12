import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar, Clock, Bell, Loader2 } from "lucide-react";
import { testApi, UpcomingTest } from "@/lib/api";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function MiniCalendar({ upcomingTests }: { upcomingTests: UpcomingTest[] }) {
  const [month] = useState(new Date());
  const today = new Date().getDate();

  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();

  const cells: (number | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const testDays = upcomingTests.slice(0, 3).map(() => {
    const date = new Date();
    date.setDate(today + Math.floor(Math.random() * 7) + 1);
    return date.getDate();
  });

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground text-sm">
          {month.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <div className="flex gap-1">
          <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] mb-2">
        {DAYS.map((d) => (
          <div key={d} className="text-muted-foreground/60 font-medium py-1.5">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {cells.map((day, i) => (
          <div
            key={i}
            className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
              day === today
                ? "bg-primary text-primary-foreground font-semibold"
                : testDays.includes(day || 0)
                ? "bg-primary/10 text-primary font-medium hover:bg-primary/20"
                : day
                ? "text-foreground/70 hover:bg-secondary hover:text-foreground"
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
  const [upcomingTests, setUpcomingTests] = useState<UpcomingTest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        const tests = await testApi.getUpcoming();
        setUpcomingTests(tests);
      } catch (err) {
        console.error('Failed to fetch upcoming tests:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUpcoming();
  }, []);

  const pendingCount = upcomingTests.length;

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="relative">
          <Bell className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search anything..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary text-sm text-foreground placeholder:text-muted-foreground border-none outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      <div className="bg-gradient-to-br from-primary/5 to-primary/0 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Today</p>
            <p className="text-sm font-semibold text-foreground">
              {loading ? '...' : `${pendingCount} upcoming test${pendingCount !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        <MiniCalendar upcomingTests={upcomingTests} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Upcoming
          </h3>
          <button className="text-xs text-primary font-medium hover:underline">View all</button>
        </div>
        <div className="space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : upcomingTests.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">No upcoming tests</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Join a batch to get started</p>
            </div>
          ) : (
            upcomingTests.slice(0, 5).map((test) => (
              <div
                key={test.id}
                className="group flex items-start gap-3 p-3 rounded-xl hover:bg-secondary/80 transition-all duration-200 cursor-pointer"
              >
                <div className="w-1.5 h-full min-h-[44px] rounded-full bg-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    {test.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {test.batchName || 'General'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold text-primary">{test.duration} min</p>
                  <p className="text-xs text-muted-foreground">{test.questionCount} Qs</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
