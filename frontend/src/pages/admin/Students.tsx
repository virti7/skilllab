import { AppLayout } from "@/components/AppLayout";
import { adminApi, AdminStudent } from "@/lib/api";
import { useState, useEffect } from "react";
import { Loader2, Users, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Students() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    try {
      const data = await adminApi.getStudents();
      setStudents(data);
    } catch (err) {
      console.error("Failed to load students:", err);
    } finally {
      setLoading(false);
    }
  }

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.batchName && s.batchName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">Students</h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No students in your institute yet.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Students will appear here after joining a batch.
          </p>
        </div>
      ) : (
        <>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, email or batch..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:border-primary/60"
            />
          </div>

          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                    Name
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                    Email
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                    Batch
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                    Tests
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                    Avg Score
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    onClick={() => navigate(`/admin/student/${student.id}`)}
                    className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {student.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </div>
                        <p className="font-medium text-foreground">{student.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {student.email}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {student.batchName || "—"}
                    </td>
                    <td className="px-5 py-3 text-foreground">{student.totalTests}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`font-medium ${
                          student.avgScore >= 80
                            ? "text-success"
                            : student.avgScore >= 60
                            ? "text-warning"
                            : student.avgScore > 0
                            ? "text-destructive"
                            : "text-muted-foreground"
                        }`}
                      >
                        {student.avgScore > 0 ? `${student.avgScore}%` : "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AppLayout>
  );
}