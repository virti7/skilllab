import { AppLayout } from "@/components/AppLayout";
import { institutes } from "@/data/dummy";
import { Plus } from "lucide-react";

export default function Institutes() {
  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">Manage Institutes</h2>
        <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Add Institute
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {institutes.map((inst) => (
          <div key={inst.id} className="bg-card rounded-2xl p-5 border border-border shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-card-blue flex items-center justify-center text-lg">🏫</div>
              <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${inst.status === "active" ? "bg-card-green" : "bg-card-orange"}`}>
                {inst.status}
              </span>
            </div>
            <h3 className="font-semibold text-foreground">{inst.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{inst.city}</p>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
              <span className="text-sm text-muted-foreground">{inst.students} students</span>
              <span className="text-xs font-medium bg-card-blue px-2 py-0.5 rounded-lg">{inst.plan}</span>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
