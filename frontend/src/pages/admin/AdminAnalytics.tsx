import { AppLayout } from "@/components/AppLayout";
import { monthlyPerformance, adminStats } from "@/data/dummy";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const testVolume = [
  { month: "Aug", tests: 18 },
  { month: "Sep", tests: 22 },
  { month: "Oct", tests: 20 },
  { month: "Nov", tests: 25 },
  { month: "Dec", tests: 28 },
  { month: "Jan", tests: 32 },
];

export default function AdminAnalytics() {
  return (
    <AppLayout>
      <h2 className="text-xl font-bold text-foreground mb-6">Analytics</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {adminStats.map((card) => (
          <div key={card.title} className="bg-card rounded-2xl p-5 border border-border shadow-sm">
            <span className="text-2xl">{card.icon}</span>
            <p className="text-2xl font-bold text-foreground mt-2">{card.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{card.title}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h3 className="font-semibold text-foreground mb-4">Performance Trend</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={monthlyPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h3 className="font-semibold text-foreground mb-4">Tests Conducted</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={testVolume}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip />
              <Bar dataKey="tests" fill="hsl(var(--info))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </AppLayout>
  );
}
