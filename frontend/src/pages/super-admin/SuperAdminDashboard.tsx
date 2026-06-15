import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { institutes, monthlyPerformance } from "@/data/dummy";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  Building2,
  Users,
  TrendingUp,
  Activity,
  Sparkles,
  CreditCard,
  ArrowUpRight,
} from "lucide-react";

const revenueData = [
  { month: "Aug", revenue: 12 },
  { month: "Sep", revenue: 13.5 },
  { month: "Oct", revenue: 14 },
  { month: "Nov", revenue: 15.2 },
  { month: "Dec", revenue: 16.8 },
  { month: "Jan", revenue: 18.5 },
];

const statsCards = [
  {
    icon: Building2,
    label: "Total Institutes",
    value: "48",
    change: "+5 this month",
    gradient: "from-blue-500/20 to-transparent",
  },
  {
    icon: Users,
    label: "Total Students",
    value: "12,450",
    change: "+320 this week",
    gradient: "from-orange-500/20 to-transparent",
  },
  {
    icon: CreditCard,
    label: "Total Revenue",
    value: "₹18.5L",
    change: "+12% MoM",
    gradient: "from-green-500/20 to-transparent",
  },
  {
    icon: Activity,
    label: "Active Plans",
    value: "42",
    change: "6 expired",
    gradient: "from-purple-500/20 to-transparent",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function SuperAdminDashboard() {
  return (
    <AppLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Platform Overview</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Super Admin Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor all institutes, users, and platform metrics.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {statsCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group relative overflow-hidden bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {card.label}
                    </p>
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300"
                    >
                      <Icon className="w-5 h-5 text-primary" />
                    </motion.div>
                  </div>
                  <p className="text-2xl font-bold text-foreground tracking-tight">
                    {card.value}
                  </p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <ArrowUpRight className="w-3 h-3 text-success" />
                    <span className="text-xs font-medium text-success">
                      {card.change}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Charts */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          <div className="bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-all duration-300">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Revenue Trend (₹ Lakhs)
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={revenueData}>
                <defs>
                  <linearGradient
                    id="revenueGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#F97316" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#F97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.75rem",
                    fontSize: 12,
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#F97316"
                  strokeWidth={3}
                  dot={{ fill: "#F97316", strokeWidth: 0, r: 4 }}
                  activeDot={{
                    r: 7,
                    fill: "#EA580C",
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-all duration-300">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Platform Performance
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyPerformance}>
                <defs>
                  <linearGradient
                    id="perfGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#FB923C" />
                    <stop offset="100%" stopColor="#F97316" />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.75rem",
                    fontSize: 12,
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Bar
                  dataKey="score"
                  fill="url(#perfGradient)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top Institutes Table */}
        <motion.div variants={itemVariants}>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            Top Institutes
          </h3>
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-all duration-300">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                      Institute
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                      City
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                      Students
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                      Plan
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {institutes.map((inst, i) => (
                    <motion.tr
                      key={inst.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                    >
                      <td className="px-5 py-3 font-medium text-foreground">
                        {inst.name}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {inst.city}
                      </td>
                      <td className="px-5 py-3 text-foreground">
                        {inst.students}
                      </td>
                      <td className="px-5 py-3">
                        <span className="bg-card-blue px-2 py-0.5 rounded-lg text-xs font-medium">
                          {inst.plan}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-lg text-xs font-medium ${
                            inst.status === "active"
                              ? "bg-card-green text-foreground"
                              : "bg-card-orange text-foreground"
                          }`}
                        >
                          {inst.status}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AppLayout>
  );
}
