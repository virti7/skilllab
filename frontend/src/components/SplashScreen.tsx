import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, BookOpen, Target, Trophy, Sparkles } from "lucide-react";

interface FloatingIcon {
  Icon: typeof GraduationCap;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
}

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"enter" | "show" | "exit">("enter");

  const floatingIcons: FloatingIcon[] = useMemo(
    () => [
      { Icon: BookOpen, x: 15, y: 20, size: 28, delay: 0.3, duration: 4, opacity: 0.15 },
      { Icon: Target, x: 80, y: 25, size: 24, delay: 0.6, duration: 5, opacity: 0.12 },
      { Icon: Trophy, x: 12, y: 70, size: 32, delay: 0.9, duration: 4.5, opacity: 0.1 },
      { Icon: GraduationCap, x: 78, y: 65, size: 26, delay: 0.4, duration: 3.5, opacity: 0.13 },
      { Icon: BookOpen, x: 50, y: 15, size: 20, delay: 0.7, duration: 4.2, opacity: 0.08 },
      { Icon: Target, x: 55, y: 80, size: 22, delay: 1.0, duration: 3.8, opacity: 0.09 },
    ],
    []
  );

  const particles: Particle[] = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        delay: Math.random() * 2,
      })),
    []
  );

  useEffect(() => {
    setPhase("enter");
    const enterTimer = setTimeout(() => setPhase("show"), 100);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.random() * 8 + 3;
      });
    }, 150);

    const exitTimer = setTimeout(() => {
      clearInterval(progressInterval);
      setProgress(100);
      setPhase("exit");
      setTimeout(onComplete, 800);
    }, 2500);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
      clearInterval(progressInterval);
    };
  }, [onComplete]);

  return (
    <AnimatePresence mode="wait">
      {phase !== "exit" && (
        <motion.div
          key="splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-[#FFF7ED] to-white overflow-hidden"
        >
          {/* Floating Icons */}
          {floatingIcons.map((item, i) => {
            const Icon = item.Icon;
            return (
              <motion.div
                key={i}
                className="absolute pointer-events-none"
                initial={{ x: `${item.x}vw`, y: `${item.y}vh`, opacity: 0, scale: 0.5 }}
                animate={{
                  x: [`${item.x}vw`, `${item.x + (Math.random() > 0.5 ? 5 : -5)}vw`],
                  y: [`${item.y}vh`, `${item.y + (Math.random() > 0.5 ? -4 : 4)}vh`],
                  opacity: [0, item.opacity, item.opacity, 0],
                  scale: [0.5, 1, 1, 0.8],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: item.duration,
                  delay: item.delay,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              >
                <Icon
                  style={{ width: item.size, height: item.size }}
                  className="text-orange-400/30"
                />
              </motion.div>
            );
          })}

          {/* Particles */}
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute bg-orange-300/20 rounded-full pointer-events-none"
              style={{ width: p.size, height: p.size }}
              initial={{ x: `${p.x}vw`, y: `${p.y}vh`, opacity: 0 }}
              animate={{
                y: [`${p.y}vh`, `${p.y - 20}vh`],
                opacity: [0, 0.6, 0],
              }}
              transition={{
                duration: 3,
                delay: p.delay,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          ))}

          {/* Center Content */}
          <div className="relative flex flex-col items-center">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: 0.8,
                ease: [0.34, 1.56, 0.64, 1],
                delay: 0.2,
              }}
              className="relative"
            >
              <div className="w-28 h-28 rounded-[2rem] bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-2xl shadow-orange-500/30">
                <GraduationCap className="w-14 h-14 text-white" />
              </div>
              {/* Glow ring */}
              <motion.div
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 -m-4 rounded-[2.5rem] bg-orange-400/20 blur-xl"
              />
            </motion.div>

            {/* Brand Name */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-4xl font-bold text-foreground mt-8 tracking-tight"
            >
              Skill<span className="text-orange-500">Lab</span>
            </motion.h1>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.55 }}
              className="text-lg text-muted-foreground mt-2 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-orange-400" />
              Learn. Practice. Excel.
              <Sparkles className="w-4 h-4 text-orange-400" />
            </motion.p>

            {/* Loading Bar */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="mt-12 w-48"
            >
              <div className="h-1.5 bg-orange-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: `${Math.min(progress, 100)}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2 font-medium tracking-wider uppercase">
                Loading your experience
              </p>
            </motion.div>
          </div>

          {/* Bottom gradient fade */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
