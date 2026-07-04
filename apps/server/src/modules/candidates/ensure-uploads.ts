import fs from "node:fs/promises";
import path from "node:path";

export async function ensureResumeUploadsDir(): Promise<string> {
  const dir = path.resolve(process.cwd(), "apps/server/uploads/resumes");
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

