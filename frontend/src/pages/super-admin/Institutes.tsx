import { AppLayout } from "@/components/AppLayout";
import { superAdminApi, SuperAdminInstitute } from "@/lib/api";
import { useState, useEffect } from "react";
import { Plus, Search, Loader2, Building2 } from "lucide-react";

export default function Institutes() {
  const [institutes, setInstitutes] = useState<SuperAdminInstitute[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadInstitutes();
  }, [page, search]);

  async function loadInstitutes() {
    setLoading(true);
    try {
      const result = await superAdminApi.getInstitutes({
        search: search || undefined,
        page,
        limit: 12,
      });
      setInstitutes(result.institutes);
      setTotalPages(result.pagination.totalPages);
    } catch {
      setInstitutes([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg md:text-xl font-bold text-foreground">Manage Institutes</h2>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search institutes..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : institutes.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Building2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No institutes found.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {institutes.map((inst) => (
              <div
                key={inst.id}
                className="bg-card rounded-2xl p-5 border border-border shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-card-blue flex items-center justify-center text-lg">
                    🏫
                  </div>
                </div>
                <h3 className="font-semibold text-foreground">{inst.name}</h3>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border text-sm text-muted-foreground">
                  <span>{inst.studentCount} students</span>
                  <span>{inst.userCount} users</span>
                  <span>{inst.batchCount} batches</span>
                </div>
              </div>
            ))}
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
