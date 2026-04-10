import { AppLayout } from "@/components/AppLayout";
import { allUsers } from "@/data/dummy";

export default function AllUsers() {
  return (
    <AppLayout>
      <h2 className="text-xl font-bold text-foreground mb-6">All Users</h2>
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Email</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Role</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Institute</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {allUsers.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                <td className="px-5 py-3 font-medium text-foreground">{u.name}</td>
                <td className="px-5 py-3 text-muted-foreground">{u.email}</td>
                <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${u.role === "Admin" ? "bg-card-orange" : "bg-card-blue"}`}>{u.role}</span></td>
                <td className="px-5 py-3 text-muted-foreground">{u.institute}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${u.status === "active" ? "bg-card-green" : "bg-card-orange"}`}>{u.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
