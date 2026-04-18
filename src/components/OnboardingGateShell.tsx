import { cookies } from "next/headers";
import { OnboardingGateForm } from "@/components/OnboardingGateForm";
import { ONBOARDING_GATE_COOKIE_NAME, ONBOARDING_GATE_COOKIE_VALUE } from "@/lib/onboarding-gate";

export async function OnboardingGateShell({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  if (jar.get(ONBOARDING_GATE_COOKIE_NAME)?.value !== ONBOARDING_GATE_COOKIE_VALUE) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface p-4">
        <OnboardingGateForm />
      </div>
    );
  }
  return <>{children}</>;
}
