import { AppLayout } from "@/components/AppLayout";
import { classes } from "@/data/dummy";

const colors = ["bg-card-green", "bg-card-blue", "bg-card-orange", "bg-card-purple", "bg-card-pink"];

export default function Classes() {
  return (
    <AppLayout>
      <h2 className="text-xl font-bold text-foreground mb-6">All Classes</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((cls, i) => (
          <div key={cls.id} className={`${colors[i % colors.length]} rounded-2xl p-6`}>
            <div className="text-4xl mb-4">{cls.icon}</div>
            <h3 className="text-lg font-semibold text-foreground">{cls.title}</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-5">{cls.description}</p>
            <button className="text-sm font-medium bg-card px-5 py-2.5 rounded-xl text-foreground hover:shadow-md transition-shadow">
              View Tests
            </button>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
