import type { CandidateStatus } from "@prisma/client";

export type CandidateSeedDefinition = {
  fullName: string;
  email: string;
  phone: string;
  totalExperienceYears?: string;
  skills?: string;
  currentCompany?: string;
  currentLocation?: string;
  noticePeriodDays?: number;
  status: CandidateStatus;
  notes?: string;
  requisitionTitle: string;
  createdByEmail: string;
};

export const DEMO_CANDIDATES: CandidateSeedDefinition[] = [
  {
    fullName: "Priya Sharma",
    email: "priya.sharma@example.com",
    phone: "+91 9876543210",
    totalExperienceYears: "5.0",
    skills: "Node.js, TypeScript, PostgreSQL",
    currentCompany: "TechNova",
    currentLocation: "Bengaluru",
    noticePeriodDays: 30,
    status: "APPLIED",
    requisitionTitle: "Sales Development Representative",
    createdByEmail: "recruiter@roms.local",
  },
  {
    fullName: "Arjun Mehta",
    email: "arjun.mehta@example.com",
    phone: "+91 9988776655",
    totalExperienceYears: "7.5",
    skills: "Recruitment, HR Operations, Stakeholder Management",
    currentCompany: "PeopleFirst HR",
    currentLocation: "Mumbai",
    noticePeriodDays: 45,
    status: "SELECTED",
    notes: "Strong communication and domain fit. Offer pending approval.",
    requisitionTitle: "HR Coordinator",
    createdByEmail: "recruiter@roms.local",
  },
  {
    fullName: "Sneha Reddy",
    email: "sneha.reddy@example.com",
    phone: "+91 9123456780",
    totalExperienceYears: "4.0",
    skills: "Lead Generation, CRM, Prospecting",
    currentCompany: "GrowthWorks",
    currentLocation: "Hyderabad",
    noticePeriodDays: 60,
    status: "SELECTED",
    notes: "Interview panel complete. Offer extended.",
    requisitionTitle: "Sales Development Representative",
    createdByEmail: "admin@roms.local",
  },
  {
    fullName: "Karan Patel",
    email: "karan.patel@example.com",
    phone: "+91 9000011100",
    totalExperienceYears: "3.5",
    skills: "Lead Generation, CRM, Cold Calling",
    currentCompany: "Outbound Labs",
    currentLocation: "Bengaluru",
    noticePeriodDays: 30,
    status: "SELECTED",
    notes: "Selected for offer preparation.",
    requisitionTitle: "Sales Development Representative",
    createdByEmail: "recruiter@roms.local",
  },
  {
    fullName: "Divya Nair",
    email: "divya.nair@example.com",
    phone: "+91 9000022200",
    totalExperienceYears: "4.5",
    skills: "Prospecting, Salesforce, Communication",
    currentCompany: "Pipeline Pro",
    currentLocation: "Chennai",
    noticePeriodDays: 30,
    status: "OFFER_ACCEPTED",
    notes: "Accepted offer for SDR role.",
    requisitionTitle: "Sales Development Representative",
    createdByEmail: "recruiter@roms.local",
  },
  {
    fullName: "Anita Verma",
    email: "anita.verma@example.com",
    phone: "+91 9000044400",
    totalExperienceYears: "3.0",
    skills: "Prospecting, Outreach, CRM",
    currentCompany: "Lead Labs",
    currentLocation: "Bengaluru",
    noticePeriodDays: 30,
    status: "OFFER_ACCEPTED",
    notes: "Offer accepted; onboarding in progress.",
    requisitionTitle: "Sales Development Representative",
    createdByEmail: "recruiter@roms.local",
  },
  {
    fullName: "Vikram Singh",
    email: "vikram.singh@example.com",
    phone: "+91 9000055500",
    totalExperienceYears: "6.0",
    skills: "HR Operations, Onboarding, Employee Relations",
    currentCompany: "People Bridge",
    currentLocation: "Mumbai",
    noticePeriodDays: 30,
    status: "JOINED",
    notes: "Joined and completing post-joining onboarding tasks.",
    requisitionTitle: "HR Coordinator",
    createdByEmail: "recruiter@roms.local",
  },
  {
    fullName: "Meera Iyer",
    email: "meera.iyer@example.com",
    phone: "+91 9000066600",
    totalExperienceYears: "5.5",
    skills: "HR Coordination, Payroll Support, Compliance",
    currentCompany: "Talent Hub",
    currentLocation: "Chennai",
    noticePeriodDays: 15,
    status: "ONBOARDED",
    notes: "Onboarding completed successfully.",
    requisitionTitle: "HR Coordinator",
    createdByEmail: "recruiter@roms.local",
  },
  {
    fullName: "Rohit Shah",
    email: "rohit.shah@example.com",
    phone: "+91 9000033300",
    totalExperienceYears: "5.0",
    skills: "B2B Sales, Negotiation, CRM",
    currentCompany: "Growth Axis",
    currentLocation: "Pune",
    noticePeriodDays: 45,
    status: "OFFER_DECLINED",
    notes: "Declined offer after receiving a competing package.",
    requisitionTitle: "Sales Development Representative",
    createdByEmail: "recruiter@roms.local",
  },
];
