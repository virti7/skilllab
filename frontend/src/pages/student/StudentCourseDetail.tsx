import { useParams, Link, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { ArrowLeft } from "lucide-react";

export default function StudentCourseDetail() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="flex items-center gap-3 mb-4 md:mb-6 px-4 md:px-0">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-secondary">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <h2 className="text-lg md:text-xl font-bold text-foreground">Course Details</h2>
      </div>
      <div className="text-center py-20 text-muted-foreground">
        <p className="text-sm">Course details feature coming soon.</p>
        <Link to="/student" className="text-primary text-sm mt-2 inline-block hover:underline">
          Back to Dashboard
        </Link>
      </div>
    </AppLayout>
  );
}
