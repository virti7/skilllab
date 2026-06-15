import { motion } from "framer-motion";
import { GraduationCap, Shield, School } from "lucide-react";

export type AuthRole = "student" | "admin" | "super_admin";

interface RoleConfig {
  role: AuthRole;
  label: string;
  description: string;
  icon: typeof GraduationCap;
  iconBg: string;
}

const roles: RoleConfig[] = [
  {
    role: "student",
    label: "Student",
    description: "Take tests & track progress",
    icon: GraduationCap,
    iconBg: "bg-blue-500/10 text-blue-600",
  },
  {
    role: "admin",
    label: "Admin",
    description: "Manage institute & students",
    icon: School,
    iconBg: "bg-orange-500/10 text-orange-600",
  },
  {
    role: "super_admin",
    label: "Super Admin",
    description: "Oversee all institutes",
    icon: Shield,
    iconBg: "bg-purple-500/10 text-purple-600",
  },
];

interface RoleSelectorProps {
  selected: AuthRole;
  onSelect: (role: AuthRole) => void;
}

export function RoleSelector({ selected, onSelect }: RoleSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {roles.map((role, i) => {
        const isActive = selected === role.role;
        const Icon = role.icon;
        return (
          <motion.button
            key={role.role}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(role.role)}
            className={`relative overflow-hidden rounded-xl py-3 px-2 text-left transition-all duration-300 ${
              isActive
                ? "bg-white shadow-md shadow-primary/10 border-2 border-primary"
                : "bg-white/50 border-2 border-transparent hover:border-primary/30 hover:shadow-sm hover:bg-white/80"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="roleGlow"
                className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            <div className="relative z-10 flex flex-col items-center text-center gap-1.5">
              <div
                className={`w-10 h-10 rounded-lg ${role.iconBg} flex items-center justify-center transition-transform duration-300 ${
                  isActive ? "scale-110" : ""
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-xs text-foreground">{role.label}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  {role.description}
                </p>
              </div>
              {isActive && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-1.5 h-1.5 rounded-full bg-primary"
                />
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
