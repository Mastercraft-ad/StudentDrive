import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import StudentOnboarding from "./student-onboarding";
import InstitutionOnboarding from "./institution-onboarding";

export default function Onboarding() {
  const { user } = useAuth();
  const [selectedRole, setSelectedRole] = useState<"student" | "institution" | null>(null);

  useEffect(() => {
    if (user?.role) {
      // User already has a role set
      setSelectedRole(user.role as "student" | "institution");
    } else {
      // Check if this is an institution registration flow
      const pendingInstitution = sessionStorage.getItem('pendingInstitutionOnboarding');
      if (pendingInstitution === 'true') {
        sessionStorage.removeItem('pendingInstitutionOnboarding');
        setSelectedRole('institution');
      } else {
        // Default to student for LMS learners - no role selection needed
        // since "student" is the only option for regular LMS registrations
        setSelectedRole('student');
      }
    }
  }, [user?.role]);

  const handleOnboardingComplete = () => {
    window.location.href = "/";
  };

  // Show nothing while determining role
  if (!selectedRole) {
    return null;
  }

  if (selectedRole === "student") {
    return <StudentOnboarding onComplete={handleOnboardingComplete} />;
  }

  if (selectedRole === "institution") {
    return <InstitutionOnboarding onComplete={handleOnboardingComplete} />;
  }

  return null;
}
