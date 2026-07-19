const BASE = "http://localhost:3001/api/v1";

let token = "";

async function call(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* no body */
  }
  return { status: res.status, json };
}

const results = [];

async function test(name, fn) {
  try {
    const { status, json } = await fn();
    const ok = status >= 200 && status < 300;
    results.push({
      name,
      status,
      ok,
      note: ok
        ? summarize(json)
        : `${json?.error?.code ?? ""} ${json?.error?.message ?? ""}`.trim(),
    });
  } catch (error) {
    results.push({ name, status: "ERR", ok: false, note: String(error) });
  }
}

function summarize(json) {
  const data = json?.data ?? json;
  if (!data || typeof data !== "object") return "";
  const keys = Object.keys(data).filter((k) => k !== "disclaimer");
  return keys.slice(0, 5).join(",");
}

// --- login ---
const login = await call("POST", "/auth/login", {
  email: "admin@roms.local",
  password: "RomsDev123!",
});
if (login.status !== 200) {
  console.error("Login failed:", login.status, JSON.stringify(login.json));
  process.exit(1);
}
token = login.json.data?.accessToken ?? login.json.accessToken;
if (!token) {
  console.error("No access token in login response");
  process.exit(1);
}

// --- find candidate + requisition ---
const list = await call("GET", "/candidates?page=1&limit=10");
const candidate = (list.json.data ?? [])[0];
if (!candidate) {
  console.error("No candidate found — create one first.");
  process.exit(1);
}
const candidateId = candidate.id;
const requisitionId = candidate.requisitionId ?? candidate.requisition?.id;
console.log(`Using candidate ${candidate.fullName} (${candidateId})`);
console.log(`Using requisition ${requisitionId}`);

// --- AI endpoint tests ---
await test("normalize-skills", () =>
  call("POST", "/ai/normalize-skills", { skills: "JS, ReactJS, nodejs, react" }));
await test("candidates/:id/parse-resume", () =>
  call("POST", `/ai/candidates/${candidateId}/parse-resume`, {}));
await test("candidates/:id/summarize-resume", () =>
  call("POST", `/ai/candidates/${candidateId}/summarize-resume`, {}));
await test("candidates/:id/suggest-tags", () =>
  call("POST", `/ai/candidates/${candidateId}/suggest-tags`, {}));
await test("candidates/:id/resume-quality", () =>
  call("POST", `/ai/candidates/${candidateId}/resume-quality`, {}));
await test("candidates/:id/match", () =>
  call("POST", `/ai/candidates/${candidateId}/match`, {}));
await test("candidates/:id/skill-gap", () =>
  call("POST", `/ai/candidates/${candidateId}/skill-gap`, {}));
await test("candidates/:id/risk-analysis", () =>
  call("POST", `/ai/candidates/${candidateId}/risk-analysis`, {}));
await test("candidates/:id/draft-note", () =>
  call("POST", `/ai/candidates/${candidateId}/draft-note`, { intent: "GENERAL" }));
await test("candidates/:id/suggest-salary", () =>
  call("POST", `/ai/candidates/${candidateId}/suggest-salary`, {}));
await test("requisitions/generate-jd", () =>
  call("POST", "/ai/requisitions/generate-jd", {
    title: "Software Engineer",
    skills: "React, Node.js, PostgreSQL",
  }));
await test("requisitions/:id/generate-jd", () =>
  call("POST", `/ai/requisitions/${requisitionId}/generate-jd`, {}));
await test("requisitions/:id/improve", () =>
  call("POST", `/ai/requisitions/${requisitionId}/improve`, {}));
await test("interviews/generate-questions", () =>
  call("POST", "/ai/interviews/generate-questions", {
    candidateId,
    roundType: "TECHNICAL",
  }));
await test("emails/generate", () =>
  call("POST", "/ai/emails/generate", {
    template: "INTERVIEW_INVITE",
    candidateId,
  }));
await test("insights/hiring", () => call("POST", "/ai/insights/hiring", {}));
await test("insights/departments", () =>
  call("POST", "/ai/insights/departments", {}));
await test("insights/missing-skills", () =>
  call("GET", "/ai/insights/missing-skills"));
await test("insights/weekly-summary", () =>
  call("POST", "/ai/insights/weekly-summary", {}));

// --- compare (needs a 2nd candidate; create + soft delete) ---
let secondId = null;
const created = await call("POST", "/candidates", {
  requisitionId,
  fullName: "AI Test Candidate",
  email: `ai-test-${Date.now()}@example.com`,
  phone: "9999999999",
  skills: "Python, SQL",
});
if (created.status >= 200 && created.status < 300) {
  secondId = (created.json.data ?? created.json).id;
  await test("candidates/compare", () =>
    call("POST", "/ai/candidates/compare", {
      candidateIds: [candidateId, secondId],
    }));
  const del = await call("DELETE", `/candidates/${secondId}`);
  console.log(`Cleanup second candidate: ${del.status}`);
} else {
  results.push({
    name: "candidates/compare",
    status: "SKIP",
    ok: false,
    note: `could not create 2nd candidate: ${created.status} ${JSON.stringify(created.json?.error ?? "")}`,
  });
}

// --- report ---
console.log("\nResults:");
for (const r of results) {
  console.log(
    `${r.ok ? "PASS" : "FAIL"}  ${String(r.status).padEnd(4)} ${r.name}  ${r.note ?? ""}`,
  );
}
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length > 0 ? 1 : 0);
