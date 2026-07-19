import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Anchor to the server package root (3 levels up from this module) so the
// uploads folder is stable regardless of the process working directory.
const packageRoot = path.resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../..",
);

export async function ensureOnboardingUploadsDir(
  onboardingCaseId: string,
): Promise<string> {
  const dir = path.join(
    packageRoot,
    "uploads/onboarding-documents",
    onboardingCaseId,
  );
  await fs.mkdir(dir, { recursive: true });
  return dir;
}
