import { AppLayout } from "@/components/AppLayout";
import { superAdminApi, SuperAdminUser } from "@/lib/api";
import { useState, useEffect } from "react";
import { Search, Loader2, Users } from "lucide-react";

export default function AllUsers() {
  const [users, setUsers] = useState<SuperAdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadUsers();
  }, [page, search, roleFilter]);

  async function loadUsers() {
    setLoading(true);
    try {
      const result = await superAdminApi.getUsers({
        search: search || undefined,
        role: roleFilter || undefined,
        page,
        limit: 20,
      });
      setUsers(result.users);
      setTotalPages(result.pagination.totalPages);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout>
      <h2 className="text-lg md:text-xl font-bold text-foreground mb-4 md:mb-6">All Users</h2>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:border-primary/60"
        >
          <option value="">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="STUDENT">Student</option>
          <option value="SUPER_ADMIN">Super Admin</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No users found.</p>
        </div>
      ) : (
        <>
          <div className="bg-card rounded-2xl border border-border overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Email</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Role</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Institute</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                    <td className="px-5 py-3 font-medium text-foreground">{u.name}</td>
                    <td className="px-5 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${
                        u.role === "ADMIN" ? "bg-card-orange" :
                        u.role === "SUPER_ADMIN" ? "bg-card-green" : "bg-card-blue"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{u.instituteName || "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}
