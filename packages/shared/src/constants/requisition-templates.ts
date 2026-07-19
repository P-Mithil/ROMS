export type RequisitionTemplateId =
  | "SOFTWARE_ENGINEER"
  | "SENIOR_SOFTWARE_ENGINEER"
  | "PRODUCT_MANAGER"
  | "DATA_ANALYST"
  | "HR_GENERALIST"
  | "UX_DESIGNER";

export type RequisitionTemplate = {
  id: RequisitionTemplateId;
  label: string;
  title: string;
  description: string;
  skills: string[];
  hiringPriority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  employmentType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP";
  workMode: "OFFICE" | "REMOTE" | "HYBRID";
  openings: number;
  experienceMin: number;
  experienceMax: number;
};

export const REQUISITION_TEMPLATES: RequisitionTemplate[] = [
  {
    id: "SOFTWARE_ENGINEER",
    label: "Software Engineer",
    title: "Software Engineer",
    description:
      "We are hiring a Software Engineer to design, build, and maintain reliable product features.\n\nResponsibilities:\n- Deliver well-tested features across the stack\n- Collaborate with product and design partners\n- Participate in code reviews and technical design\n- Improve observability, quality, and developer experience\n\nRequirements:\n- Solid experience with modern web or backend frameworks\n- Comfortable with SQL and API design\n- Strong communication and ownership mindset",
    skills: ["TypeScript", "React", "Node.js", "SQL", "REST API", "GitHub Actions"],
    hiringPriority: "MEDIUM",
    employmentType: "FULL_TIME",
    workMode: "HYBRID",
    openings: 1,
    experienceMin: 2,
    experienceMax: 5,
  },
  {
    id: "SENIOR_SOFTWARE_ENGINEER",
    label: "Senior Software Engineer",
    title: "Senior Software Engineer",
    description:
      "We are hiring a Senior Software Engineer to lead delivery of complex product initiatives.\n\nResponsibilities:\n- Own end-to-end feature design and implementation\n- Mentor engineers and raise engineering standards\n- Drive architecture decisions with pragmatic trade-offs\n- Partner with stakeholders on roadmap execution\n\nRequirements:\n- Proven experience shipping production systems\n- Strong system design and debugging skills\n- Experience mentoring or leading technical workstreams",
    skills: [
      "TypeScript",
      "Node.js",
      "React",
      "PostgreSQL",
      "System Design",
      "Microservices",
      "AWS",
    ],
    hiringPriority: "HIGH",
    employmentType: "FULL_TIME",
    workMode: "HYBRID",
    openings: 1,
    experienceMin: 5,
    experienceMax: 10,
  },
  {
    id: "PRODUCT_MANAGER",
    label: "Product Manager",
    title: "Product Manager",
    description:
      "We are hiring a Product Manager to define outcomes, prioritize roadmap work, and ship customer value.\n\nResponsibilities:\n- Translate business goals into clear product requirements\n- Partner with engineering and design through delivery\n- Measure adoption and iterate based on evidence\n- Align stakeholders around priorities and trade-offs\n\nRequirements:\n- Experience owning a product area end to end\n- Strong written communication and facilitation skills\n- Comfortable with metrics and discovery practices",
    skills: [
      "Product Management",
      "Agile",
      "Stakeholder Management",
      "Data Analysis",
      "Communication",
    ],
    hiringPriority: "MEDIUM",
    employmentType: "FULL_TIME",
    workMode: "HYBRID",
    openings: 1,
    experienceMin: 3,
    experienceMax: 8,
  },
  {
    id: "DATA_ANALYST",
    label: "Data Analyst",
    title: "Data Analyst",
    description:
      "We are hiring a Data Analyst to turn operational data into actionable insights for hiring and business teams.\n\nResponsibilities:\n- Build trusted dashboards and recurring reports\n- Analyze funnel, conversion, and operational metrics\n- Partner with stakeholders to answer decision questions\n- Improve data quality and documentation\n\nRequirements:\n- Strong SQL skills\n- Experience with BI tools and storytelling with data\n- Attention to detail and clear communication",
    skills: ["SQL", "Python", "Tableau", "Power BI", "Data Analysis", "Excel"],
    hiringPriority: "MEDIUM",
    employmentType: "FULL_TIME",
    workMode: "HYBRID",
    openings: 1,
    experienceMin: 2,
    experienceMax: 6,
  },
  {
    id: "HR_GENERALIST",
    label: "HR Generalist",
    title: "HR Generalist",
    description:
      "We are hiring an HR Generalist to support recruiting operations, employee lifecycle processes, and people programs.\n\nResponsibilities:\n- Coordinate recruiting and onboarding workflows\n- Maintain accurate employee records and process documentation\n- Support managers with people process guidance\n- Improve candidate and employee experience touchpoints\n\nRequirements:\n- Experience in HR operations or recruiting coordination\n- Strong organization and stakeholder communication\n- Comfortable with HRIS and process-driven work",
    skills: [
      "Communication",
      "Stakeholder Management",
      "Project Management",
      "ServiceNow",
    ],
    hiringPriority: "MEDIUM",
    employmentType: "FULL_TIME",
    workMode: "OFFICE",
    openings: 1,
    experienceMin: 2,
    experienceMax: 6,
  },
  {
    id: "UX_DESIGNER",
    label: "UX Designer",
    title: "UX Designer",
    description:
      "We are hiring a UX Designer to craft clear, usable product experiences across web workflows.\n\nResponsibilities:\n- Research user needs and translate findings into flows\n- Design wireframes, prototypes, and high-fidelity UI\n- Partner with product and engineering through delivery\n- Maintain design consistency and accessibility standards\n\nRequirements:\n- Portfolio demonstrating end-to-end product design\n- Proficiency with modern design tools\n- Strong collaboration and critique skills",
    skills: ["Figma", "UI Design", "UX Research", "Accessibility", "Communication"],
    hiringPriority: "MEDIUM",
    employmentType: "FULL_TIME",
    workMode: "REMOTE",
    openings: 1,
    experienceMin: 2,
    experienceMax: 7,
  },
];
