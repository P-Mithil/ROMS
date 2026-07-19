import { COMMON_SKILLS } from "@roms/shared";

export type SkillCategory =
  | "Cloud & DevOps"
  | "Languages"
  | "Data & Databases"
  | "Frontend"
  | "Backend & APIs"
  | "Mobile"
  | "Testing"
  | "Data Science"
  | "Product & Design"
  | "Soft Skills"
  | "Other";

const CATEGORY_RULES: Array<{ category: SkillCategory; match: RegExp }> = [
  {
    category: "Cloud & DevOps",
    match:
      /aws|azure|google cloud|docker|kubernetes|terraform|ansible|jenkins|github actions|ci\/cd|linux|bash|powershell|networking|cybersecurity/i,
  },
  {
    category: "Languages",
    match:
      /^(python|java|javascript|typescript|c#|c\+\+|go|rust|php|ruby|swift|kotlin|scala|r)$/i,
  },
  {
    category: "Data & Databases",
    match:
      /sql|postgres|mysql|mongo|redis|elastic|firebase|prisma|snowflake|databricks|etl|data warehous/i,
  },
  {
    category: "Frontend",
    match:
      /react|next\.js|redux|vue|nuxt|angular|svelte|html|css|tailwind|sass|material ui|bootstrap|vite|webpack/i,
  },
  {
    category: "Backend & APIs",
    match:
      /node\.js|express|nestjs|graphql|rest api|grpc|apollo|spring|asp\.net|\.net|hibernate|django|fastapi|flask|laravel|rails|microservices|event-driven|kafka|rabbitmq|system design|data structures|algorithms/i,
  },
  {
    category: "Mobile",
    match: /react native|flutter|android|ios/i,
  },
  {
    category: "Testing",
    match:
      /unit testing|integration testing|playwright|cypress|selenium|jest|vitest|pytest|junit|testing automation|performance testing/i,
  },
  {
    category: "Data Science",
    match:
      /machine learning|deep learning|tensorflow|pytorch|pandas|numpy|spark|hadoop|airflow|data analysis|tableau|power bi/i,
  },
  {
    category: "Product & Design",
    match:
      /product management|business analysis|figma|ui design|ux research|accessibility|seo|content strategy|technical writing|agile|scrum|kanban/i,
  },
  {
    category: "Soft Skills",
    match:
      /stakeholder management|project management|communication|leadership/i,
  },
];

export function categorizeSkill(skill: string): SkillCategory {
  for (const rule of CATEGORY_RULES) {
    if (rule.match.test(skill)) {
      return rule.category;
    }
  }
  return "Other";
}

export const SKILL_CATEGORIES: SkillCategory[] = [
  "Cloud & DevOps",
  "Languages",
  "Data & Databases",
  "Frontend",
  "Backend & APIs",
  "Mobile",
  "Testing",
  "Data Science",
  "Product & Design",
  "Soft Skills",
  "Other",
];

export function skillsByCategory() {
  const map = new Map<SkillCategory, string[]>();
  for (const category of SKILL_CATEGORIES) {
    map.set(category, []);
  }
  for (const skill of COMMON_SKILLS) {
    const category = categorizeSkill(skill);
    map.get(category)?.push(skill);
  }
  return map;
}
