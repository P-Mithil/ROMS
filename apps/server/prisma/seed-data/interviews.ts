import type {
  InterviewMode,
  InterviewRoundType,
  InterviewStatus,
} from "@prisma/client";

export type InterviewFeedbackSeedDefinition = {
  authorEmail: string;
  rating?: number;
  recommendation?: string;
  strengths?: string;
  concerns?: string;
  summary?: string;
};

export type InterviewSeedDefinition = {
  candidateEmail: string;
  requisitionTitle: string;
  roundType: InterviewRoundType;
  customRoundLabel?: string;
  sequence: number;
  status: InterviewStatus;
  /** Days from seed run time; negative values are in the past. */
  scheduledDaysFromNow: number;
  /** Days from seed run time when the interview was marked completed. */
  completedDaysFromNow?: number;
  durationMinutes: number;
  mode: InterviewMode;
  location?: string;
  meetingLink?: string;
  instructions?: string;
  completionNotes?: string;
  feedbackSummary?: string;
  createdByEmail: string;
  completedByEmail?: string;
  interviewerEmails: string[];
  feedback?: InterviewFeedbackSeedDefinition[];
};

export const DEMO_INTERVIEWS: InterviewSeedDefinition[] = [
  {
    candidateEmail: "sneha.reddy@example.com",
    requisitionTitle: "Sales Development Representative",
    roundType: "TECHNICAL",
    sequence: 1,
    status: "SCHEDULED",
    scheduledDaysFromNow: 7,
    durationMinutes: 60,
    mode: "VIRTUAL",
    meetingLink: "https://meet.example.com/roms-tech-round-1",
    instructions: "Prepare a short walkthrough of a recent project.",
    createdByEmail: "recruiter@roms.local",
    interviewerEmails: ["interviewer@roms.local"],
  },
  {
    candidateEmail: "sneha.reddy@example.com",
    requisitionTitle: "Sales Development Representative",
    roundType: "HR",
    sequence: 1,
    status: "COMPLETED",
    scheduledDaysFromNow: -5,
    completedDaysFromNow: -4,
    durationMinutes: 45,
    mode: "VIRTUAL",
    meetingLink: "https://meet.example.com/roms-hr-round-1",
    instructions: "Focus on motivation, communication, and role fit.",
    completionNotes: "Panel completed on time.",
    createdByEmail: "recruiter@roms.local",
    completedByEmail: "hm@roms.local",
    interviewerEmails: ["interviewer@roms.local", "hm@roms.local"],
    feedback: [
      {
        authorEmail: "interviewer@roms.local",
        rating: 4,
        recommendation: "YES",
        strengths: "Clear communicator with relevant SDR experience.",
        concerns: "Limited enterprise sales exposure.",
        summary: "Recommend moving forward to the next round.",
      },
    ],
  },
  {
    candidateEmail: "sneha.reddy@example.com",
    requisitionTitle: "Sales Development Representative",
    roundType: "TECHNICAL",
    sequence: 2,
    status: "COMPLETED",
    scheduledDaysFromNow: -2,
    completedDaysFromNow: -1,
    durationMinutes: 60,
    mode: "VIRTUAL",
    meetingLink: "https://meet.example.com/roms-tech-round-2",
    instructions: "Deep-dive on prospecting workflow and CRM usage.",
    completionNotes: "Strong practical examples shared.",
    feedbackSummary:
      "Panel aligned on advancing the candidate. Solid CRM knowledge and confident communication.",
    createdByEmail: "recruiter@roms.local",
    completedByEmail: "hm@roms.local",
    interviewerEmails: ["interviewer@roms.local"],
    feedback: [
      {
        authorEmail: "interviewer@roms.local",
        rating: 5,
        recommendation: "STRONG_YES",
        strengths: "Excellent CRM workflow, confident objection handling.",
        concerns: "None significant.",
        summary: "Strong hire recommendation for the SDR role.",
      },
    ],
  },
];
