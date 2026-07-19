import { COMMON_SKILLS } from "@roms/shared";

const ALIASES: Record<string, string> = {
  js: "JavaScript",
  "javascript": "JavaScript",
  ts: "TypeScript",
  "typescript": "TypeScript",
  "react.js": "React",
  reactjs: "React",
  "node": "Node.js",
  nodejs: "Node.js",
  "node.js": "Node.js",
  postgres: "PostgreSQL",
  postgresql: "PostgreSQL",
  k8s: "Kubernetes",
  "c sharp": "C#",
  csharp: "C#",
  "next": "Next.js",
  nextjs: "Next.js",
  "next.js": "Next.js",
  "vue": "Vue.js",
  vuejs: "Vue.js",
  "vue.js": "Vue.js",
  "aws": "AWS",
  "gcp": "Google Cloud",
  "ci/cd": "CI/CD",
};

function normalizeToken(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function tokenizeSkills(skills: string | null | undefined): string[] {
  if (!skills?.trim()) {
    return [];
  }

  return skills
    .split(/[,;\n|/]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function normalizeSkillList(skills: string): {
  normalized: string[];
  rawToNormalized: Record<string, string>;
  unknown: string[];
} {
  const rawTokens = tokenizeSkills(skills);
  const canonicalByLower = new Map(
    COMMON_SKILLS.map((skill) => [skill.toLowerCase(), skill]),
  );

  const normalized: string[] = [];
  const rawToNormalized: Record<string, string> = {};
  const unknown: string[] = [];
  const seen = new Set<string>();

  for (const raw of rawTokens) {
    const key = normalizeToken(raw);
    const alias = ALIASES[key];
    const mapped =
      alias ??
      canonicalByLower.get(key) ??
      canonicalByLower.get(key.replace(/\.js$/, "")) ??
      null;

    if (mapped) {
      rawToNormalized[raw] = mapped;
      if (!seen.has(mapped.toLowerCase())) {
        seen.add(mapped.toLowerCase());
        normalized.push(mapped);
      }
    } else {
      unknown.push(raw);
      const title = raw.trim();
      rawToNormalized[raw] = title;
      if (!seen.has(title.toLowerCase())) {
        seen.add(title.toLowerCase());
        normalized.push(title);
      }
    }
  }

  return { normalized, rawToNormalized, unknown };
}

export function skillOverlapScore(
  candidateSkills: string | null | undefined,
  requisitionSkills: string | null | undefined,
): { score: number; matched: string[]; missing: string[]; extra: string[] } {
  const candidate = normalizeSkillList(candidateSkills ?? "").normalized.map(
    (s) => s.toLowerCase(),
  );
  const required = normalizeSkillList(requisitionSkills ?? "").normalized.map(
    (s) => s.toLowerCase(),
  );

  if (required.length === 0) {
    return {
      score: candidate.length > 0 ? 20 : 0,
      matched: [],
      missing: [],
      extra: normalizeSkillList(candidateSkills ?? "").normalized,
    };
  }

  const candidateSet = new Set(candidate);
  const matched = required.filter((skill) => candidateSet.has(skill));
  const missing = required.filter((skill) => !candidateSet.has(skill));
  const requiredSet = new Set(required);
  const extra = normalizeSkillList(candidateSkills ?? "").normalized.filter(
    (skill) => !requiredSet.has(skill.toLowerCase()),
  );

  const ratio = matched.length / required.length;
  return {
    score: Math.round(ratio * 40),
    matched: matched.map(
      (m) =>
        normalizeSkillList(requisitionSkills ?? "").normalized.find(
          (n) => n.toLowerCase() === m,
        ) ?? m,
    ),
    missing: missing.map(
      (m) =>
        normalizeSkillList(requisitionSkills ?? "").normalized.find(
          (n) => n.toLowerCase() === m,
        ) ?? m,
    ),
    extra,
  };
}

export function experienceScore(
  years: number | null | undefined,
  min: number | null | undefined,
  max: number | null | undefined,
): number {
  if (years == null || (min == null && max == null)) {
    return 5;
  }
  const low = min ?? 0;
  const high = max ?? low + 5;
  if (years >= low && years <= high) {
    return 20;
  }
  if (years >= low - 1 && years <= high + 1) {
    return 10;
  }
  return 0;
}

export function locationScore(
  candidateLocation: string | null | undefined,
  haystack: string | null | undefined,
): number {
  if (!candidateLocation?.trim() || !haystack?.trim()) {
    return 0;
  }
  const loc = candidateLocation.trim().toLowerCase();
  const text = haystack.toLowerCase();
  if (text.includes(loc) || loc.split(/[,\s]+/).some((p) => p.length > 2 && text.includes(p))) {
    return 10;
  }
  return 0;
}
