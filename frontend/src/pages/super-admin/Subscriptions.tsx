import { AppLayout } from "@/components/AppLayout";
import { subscriptionPlans } from "@/data/dummy";
import { Check } from "lucide-react";

export default function Subscriptions() {
  return (
    <AppLayout>
      <h2 className="text-xl font-bold text-foreground mb-6">Subscription Plans</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {subscriptionPlans.map((plan) => (
          <div key={plan.id} className={`bg-card rounded-2xl p-6 border shadow-sm ${plan.name === "Premium" ? "border-primary ring-2 ring-primary/20" : "border-border"}`}>
            {plan.name === "Premium" && <span className="text-xs font-medium bg-primary text-primary-foreground px-2 py-0.5 rounded-lg">Popular</span>}
            <h3 className="text-lg font-bold text-foreground mt-2">{plan.name}</h3>
            <p className="text-2xl font-bold text-primary mt-2">{plan.price}</p>
            <p className="text-sm text-muted-foreground mt-1">{plan.institutes} institutes</p>
            <ul className="mt-5 space-y-2.5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                  <Check className="w-4 h-4 text-success" /> {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
