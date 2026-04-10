import { AppLayout } from "@/components/AppLayout";
import { adminStudents } from "@/data/dummy";

export default function Students() {
  return (
    <AppLayout>
      <h2 className="text-xl font-bold text-foreground mb-6">Students</h2>
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Rank</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Batch</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Avg Score</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Tests</th>
            </tr>
          </thead>
          <tbody>
            {adminStudents.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                <td className="px-5 py-3 font-medium text-foreground">#{s.rank}</td>
                <td className="px-5 py-3 font-medium text-foreground">{s.name}</td>
                <td className="px-5 py-3 text-muted-foreground">{s.batch}</td>
                <td className="px-5 py-3 text-foreground">{s.score}%</td>
                <td className="px-5 py-3 text-muted-foreground">{s.tests}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
