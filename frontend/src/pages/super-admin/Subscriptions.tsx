import { AppLayout } from "@/components/AppLayout";
import { CreditCard } from "lucide-react";

export default function Subscriptions() {
  return (
    <AppLayout>
      <h2 className="text-lg md:text-xl font-bold text-foreground mb-4 md:mb-6">Subscription Plans</h2>
      <div className="text-center py-16 text-muted-foreground">
        <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm">Subscription management coming soon.</p>
        <p className="text-xs mt-1">This feature is under development.</p>
      </div>
    </AppLayout>
  );
}
