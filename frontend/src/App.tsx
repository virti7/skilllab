import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Super Admin
import SuperAdminDashboard from "./pages/super-admin/SuperAdminDashboard";
import Institutes from "./pages/super-admin/Institutes";
import AllUsers from "./pages/super-admin/AllUsers";
import Subscriptions from "./pages/super-admin/Subscriptions";

// Admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import Batches from "./pages/admin/Batches";
import BatchAnalytics from "./pages/admin/BatchAnalytics";
import AdminStudents from "./pages/admin/Students";
import AdminTests from "./pages/admin/AdminTests";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import StudentAnalytics from "./pages/admin/StudentAnalytics";
import Leaderboard from "./pages/Leaderboard";

// Student
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentTests from "./pages/student/StudentTests";
import StudentProfile from "./pages/student/StudentProfile";
import StudentCourseDetail from "./pages/student/StudentCourseDetail";
import TestPage from "./pages/TestPage";
import TestResultPage from "./pages/student/TestResultPage";

const queryClient = new QueryClient();

function SA({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute allowedRoles={["super_admin"]}>{children}</ProtectedRoute>;
}
function Admin({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute allowedRoles={["admin"]}>{children}</ProtectedRoute>;
}
function Stu({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute allowedRoles={["student"]}>{children}</ProtectedRoute>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />

            {/* Super Admin */}
            <Route path="/super-admin" element={<SA><SuperAdminDashboard /></SA>} />
            <Route path="/super-admin/institutes" element={<SA><Institutes /></SA>} />
            <Route path="/super-admin/users" element={<SA><AllUsers /></SA>} />
            <Route path="/super-admin/subscriptions" element={<SA><Subscriptions /></SA>} />

            {/* Admin */}
            <Route path="/admin" element={<Admin><AdminDashboard /></Admin>} />
            <Route path="/admin/batches" element={<Admin><Batches /></Admin>} />
            <Route path="/admin/batch/:id" element={<Admin><BatchAnalytics /></Admin>} />
            <Route path="/admin/students" element={<Admin><AdminStudents /></Admin>} />
            <Route path="/admin/student/:id" element={<Admin><StudentAnalytics /></Admin>} />
            <Route path="/admin/tests" element={<Admin><AdminTests /></Admin>} />
            <Route path="/admin/leaderboard" element={<Admin><Leaderboard /></Admin>} />
            <Route path="/admin/analytics" element={<Admin><AdminAnalytics /></Admin>} />

            {/* Student */}
            <Route path="/student" element={<Stu><StudentDashboard /></Stu>} />
            <Route path="/student/tests" element={<Stu><StudentTests /></Stu>} />
            <Route path="/student/courses/:courseId" element={<Stu><StudentCourseDetail /></Stu>} />
            <Route path="/student/leaderboard" element={<Stu><Leaderboard /></Stu>} />
            <Route path="/student/profile" element={<Stu><StudentProfile /></Stu>} />
            <Route path="/student/test-page/:testId" element={<Stu><TestPage /></Stu>} />
            <Route path="/student/test-page" element={<Stu><TestPage /></Stu>} />
            <Route path="/student/test-result/:testId" element={<Stu><TestResultPage /></Stu>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
