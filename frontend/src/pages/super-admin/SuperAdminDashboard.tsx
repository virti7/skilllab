import { AppLayout } from "@/components/AppLayout";
import { superAdminStats, institutes, monthlyPerformance } from "@/data/dummy";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const revenueData = [
  { month: "Aug", revenue: 12 },
  { month: "Sep", revenue: 13.5 },
  { month: "Oct", revenue: 14 },
  { month: "Nov", revenue: 15.2 },
  { month: "Dec", revenue: 16.8 },
  { month: "Jan", revenue: 18.5 },
];

export default function SuperAdminDashboard() {
  return (
    <AppLayout>
      <h2 className="text-xl font-bold text-foreground mb-6">Platform Overview</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {superAdminStats.map((card) => (
          <div key={card.title} className="bg-card rounded-2xl p-5 border border-border shadow-sm">
            <span className="text-2xl">{card.icon}</span>
            <p className="text-2xl font-bold text-foreground mt-2">{card.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{card.title}</p>
            <p className="text-xs text-success mt-1">{card.change}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h3 className="font-semibold text-foreground mb-4">Revenue Trend (₹ Lakhs)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h3 className="font-semibold text-foreground mb-4">Platform Performance</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip />
              <Bar dataKey="score" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-4">Top Institutes</h3>
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Institute</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">City</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Students</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Plan</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {institutes.map((inst) => (
              <tr key={inst.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                <td className="px-5 py-3 font-medium text-foreground">{inst.name}</td>
                <td className="px-5 py-3 text-muted-foreground">{inst.city}</td>
                <td className="px-5 py-3 text-foreground">{inst.students}</td>
                <td className="px-5 py-3"><span className="bg-card-blue px-2 py-0.5 rounded-lg text-xs font-medium">{inst.plan}</span></td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${inst.status === "active" ? "bg-card-green text-foreground" : "bg-card-orange text-foreground"}`}>
                    {inst.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
