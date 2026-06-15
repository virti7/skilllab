import { motion } from "framer-motion";
import { GraduationCap, CheckCircle2, BarChart3, Building2, Sparkles } from "lucide-react";

const features = [
  {
    icon: CheckCircle2,
    title: "Online Tests",
    description: "Create and manage assessments",
    gradient: "from-blue-500/10 to-blue-600/5",
  },
  {
    icon: BarChart3,
    title: "Progress Tracking",
    description: "Real-time performance insights",
    gradient: "from-orange-500/10 to-orange-600/5",
  },
  {
    icon: Sparkles,
    title: "Performance Analytics",
    description: "Data-driven improvement",
    gradient: "from-purple-500/10 to-purple-600/5",
  },
  {
    icon: Building2,
    title: "Institute Management",
    description: "Complete admin dashboard",
    gradient: "from-green-500/10 to-green-600/5",
  },
];

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="h-screen flex bg-gradient-to-br from-orange-50 via-white to-orange-50 overflow-hidden">
      {/* Left Side - Hero Section */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex flex-col justify-between w-[52%] p-10 xl:p-14 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-orange-200/30 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-orange-200/20 to-transparent rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-center h-full">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex items-center gap-3 mb-10"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-foreground">SkillLab</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-3xl xl:text-4xl font-bold text-foreground leading-tight mb-3">
              Empowering Students
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">
                Through Smart Learning
              </span>
            </h1>
            <p className="text-base text-muted-foreground max-w-lg leading-relaxed">
              Transform your educational journey with AI-powered assessments,
              real-time analytics, and seamless institute management.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="grid grid-cols-2 gap-3"
          >
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
                  className="group relative overflow-hidden rounded-xl bg-white/70 backdrop-blur-sm border border-white/50 p-4 hover:bg-white/90 hover:shadow-lg hover:shadow-orange-500/5 hover:border-orange-200/50 transition-all duration-300"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-50 group-hover:opacity-100 transition-opacity duration-300`} />
                  <div className="relative z-10 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shrink-0">
                      <Icon className="w-4 h-4 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-xs mb-0.5">
                        {feature.title}
                      </h3>
                      <p className="text-[11px] text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="relative z-10"
        >
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-6 h-px bg-muted-foreground/30" />
            Trusted by 500+ institutes worldwide
          </div>
        </motion.div>
      </motion.div>

      {/* Right Side - Auth Card */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="flex-1 flex items-center justify-center p-4 lg:p-8"
      >
        <div className="w-full max-w-[520px] h-full flex items-center justify-center py-4">
          <div className="w-full bg-white rounded-3xl shadow-xl shadow-orange-500/5 border border-orange-100/50 p-6 lg:p-8">
            {/* Header inside card */}
            <div className="text-center mb-5">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-orange-500/25"
              >
                <GraduationCap className="w-6 h-6 text-white" />
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="text-xl font-bold text-foreground"
              >
                Welcome to SkillLab
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.4 }}
                className="text-xs text-muted-foreground mt-0.5"
              >
                Sign in to continue or create an account
              </motion.p>
            </div>
            {children}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
