import fs from "node:fs/promises";
import path from "node:path";

export async function ensureOnboardingUploadsDir(
  onboardingCaseId: string,
): Promise<string> {
  const dir = path.resolve(
    process.cwd(),
    "apps/server/uploads/onboarding-documents",
    onboardingCaseId,
  );
  await fs.mkdir(dir, { recursive: true });
  return dir;
}
