import { OnboardingGateShell } from "@/components/OnboardingGateShell";

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <OnboardingGateShell>{children}</OnboardingGateShell>;
}
