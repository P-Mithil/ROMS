import type {
  CandidateStatus,
  EmployeeStatus,
  InterviewMode,
  InterviewRecommendation,
  InterviewRoundType,
  InterviewStatus,
  OfferStatus,
  OnboardingCaseStatus,
  ReportDepartmentsDto,
  ReportEmployeesDto,
  ReportFunnelDto,
  ReportInterviewsDto,
  ReportOffersDto,
  ReportOnboardingDto,
  ReportOverviewDto,
  ReportRecruitmentDto,
} from "@roms/shared";
import {
  CANDIDATE_STATUSES,
  EMPLOYEE_STATUSES,
  INTERVIEW_MODES,
  INTERVIEW_RECOMMENDATIONS,
  INTERVIEW_ROUND_TYPES,
  INTERVIEW_STATUSES,
  OFFER_STATUSES,
  ONBOARDING_CASE_STATUSES,
  REQUISITION_STATUSES,
} from "@roms/shared";
import { prisma } from "../../db/prisma.js";
import type { AuthenticatedUser } from "../../shared/types/express.js";
import {
  avg,
  candidateWhere,
  daysBetween,
  rate,
  requisitionLinkFilter,
  toPublicFilters,
  type ResolvedReportFilters,
} from "./reports.scope.js";

const ACTIVE_CANDIDATE_STATUSES: CandidateStatus[] = [
  "APPLIED",
  "SCREENING",
  "SHORTLISTED",
  "SELECTED",
  "OFFER_ACCEPTED",
  "JOINED",
];

const FUNNEL_STAGE_ORDER: Array<{ key: string; label: string; status?: CandidateStatus }> = [
  { key: "APPLIED", label: "Applied", status: "APPLIED" },
  { key: "SCREENING", label: "Screening", status: "SCREENING" },
  { key: "SHORTLISTED", label: "Shortlisted", status: "SHORTLISTED" },
  { key: "SELECTED", label: "Selected", status: "SELECTED" },
  { key: "OFFER_EXTENDED", label: "Offer Extended" },
  { key: "OFFER_ACCEPTED", label: "Offer Accepted", status: "OFFER_ACCEPTED" },
  { key: "JOINED", label: "Joined", status: "JOINED" },
  { key: "ONBOARDED", label: "Onboarded", status: "ONBOARDED" },
];

export const reportsRepository = {
  async overview(
    actor: AuthenticatedUser,
    filters: ResolvedReportFilters,
  ): Promise<ReportOverviewDto> {
    const reqFilter = requisitionLinkFilter(actor, filters);
    const candBase = candidateWhere(actor, filters);
    const candInRange = candidateWhere(actor, filters, { createdInRange: true });

    const [
      openRequisitions,
      activeCandidates,
      interviewsScheduled,
      offersPendingResponse,
      onboardingInProgress,
      employeesJoined,
      acceptedOffers,
      declinedOffers,
      interviewsCompleted,
      offersExtended,
      onboardingsCompleted,
      candidateStatusRows,
      offersExtendedCount,
      joinedCandidates,
      departments,
    ] = await Promise.all([
      prisma.jobRequisition.count({
        where: { ...reqFilter, status: "OPEN" },
      }),
      prisma.candidate.count({
        where: { ...candBase, status: { in: ACTIVE_CANDIDATE_STATUSES } },
      }),
      prisma.interview.count({
        where: {
          deletedAt: null,
          status: "SCHEDULED",
          requisition: reqFilter,
        },
      }),
      prisma.offer.count({
        where: {
          deletedAt: null,
          status: "EXTENDED",
          requisition: reqFilter,
        },
      }),
      prisma.onboardingCase.count({
        where: {
          status: { in: ["PENDING", "IN_PROGRESS", "JOINED"] },
          requisition: reqFilter,
        },
      }),
      prisma.employee.count({
        where: {
          requisition: reqFilter,
          actualJoiningDate: {
            gte: filters.dateFromDate,
            lte: filters.dateToDate,
          },
        },
      }),
      prisma.offer.count({
        where: {
          deletedAt: null,
          status: "ACCEPTED",
          requisition: reqFilter,
          respondedAt: { gte: filters.dateFromDate, lte: filters.dateToDate },
        },
      }),
      prisma.offer.count({
        where: {
          deletedAt: null,
          status: "DECLINED",
          requisition: reqFilter,
          respondedAt: { gte: filters.dateFromDate, lte: filters.dateToDate },
        },
      }),
      prisma.interview.count({
        where: {
          deletedAt: null,
          status: "COMPLETED",
          requisition: reqFilter,
          completedAt: { gte: filters.dateFromDate, lte: filters.dateToDate },
        },
      }),
      prisma.offer.count({
        where: {
          deletedAt: null,
          requisition: reqFilter,
          extendedAt: { gte: filters.dateFromDate, lte: filters.dateToDate },
        },
      }),
      prisma.onboardingCase.count({
        where: {
          status: "COMPLETED",
          requisition: reqFilter,
          completedAt: { gte: filters.dateFromDate, lte: filters.dateToDate },
        },
      }),
      prisma.candidate.groupBy({
        by: ["status"],
        where: candInRange,
        _count: { _all: true },
      }),
      prisma.offer.count({
        where: {
          deletedAt: null,
          status: "EXTENDED",
          requisition: reqFilter,
          OR: [
            {
              extendedAt: {
                gte: filters.dateFromDate,
                lte: filters.dateToDate,
              },
            },
            {
              extendedAt: null,
              createdAt: {
                gte: filters.dateFromDate,
                lte: filters.dateToDate,
              },
            },
          ],
        },
      }),
      prisma.candidate.findMany({
        where: {
          ...candBase,
          status: { in: ["JOINED", "ONBOARDED"] },
          OR: [
            {
              employee: {
                actualJoiningDate: {
                  gte: filters.dateFromDate,
                  lte: filters.dateToDate,
                },
              },
            },
            {
              onboardingCases: {
                some: {
                  joinedAt: {
                    gte: filters.dateFromDate,
                    lte: filters.dateToDate,
                  },
                },
              },
            },
          ],
        },
        select: {
          createdAt: true,
          onboardingCases: { select: { joinedAt: true }, take: 1 },
          employee: { select: { actualJoiningDate: true } },
        },
      }),
      prisma.department.findMany({
        where: {
          requisitions: { some: reqFilter },
        },
        select: {
          id: true,
          name: true,
          requisitions: {
            where: reqFilter,
            select: {
              status: true,
              _count: {
                select: {
                  onboardingCases: {
                    where: { status: { in: ["JOINED", "COMPLETED"] } },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    const statusMap = new Map(
      candidateStatusRows.map((row) => [row.status, row._count._all]),
    );

    const funnelSnapshot = FUNNEL_STAGE_ORDER.map((stage) => ({
      key: stage.key,
      label: stage.label,
      count:
        stage.key === "OFFER_EXTENDED"
          ? offersExtendedCount
          : (statusMap.get(stage.status!) ?? 0),
    }));

    const hireDays = joinedCandidates
      .map((candidate) => {
        const joinedAt =
          candidate.employee?.actualJoiningDate ??
          candidate.onboardingCases[0]?.joinedAt;
        if (!joinedAt) {
          return null;
        }
        return daysBetween(candidate.createdAt, joinedAt);
      })
      .filter((value): value is number => value != null && value >= 0);

    const topDepartments = departments
      .map((department) => ({
        departmentId: department.id,
        departmentName: department.name,
        openRequisitions: department.requisitions.filter(
          (req) => req.status === "OPEN",
        ).length,
        joined: department.requisitions.reduce(
          (sum, req) => sum + req._count.onboardingCases,
          0,
        ),
      }))
      .sort(
        (a, b) =>
          b.openRequisitions + b.joined - (a.openRequisitions + a.joined),
      )
      .slice(0, 5);

    return {
      filters: toPublicFilters(filters),
      kpis: {
        openRequisitions,
        activeCandidates,
        interviewsScheduled,
        offersPendingResponse,
        onboardingInProgress,
        employeesJoinedInPeriod: employeesJoined,
        offerAcceptRate: rate(acceptedOffers, acceptedOffers + declinedOffers),
        avgTimeToHireDays: avg(hireDays),
      },
      recentActivity: {
        interviewsCompleted,
        offersExtended,
        onboardingsCompleted,
      },
      funnelSnapshot,
      topDepartments,
    };
  },

  async recruitment(
    actor: AuthenticatedUser,
    filters: ResolvedReportFilters,
  ): Promise<ReportRecruitmentDto> {
    const reqFilter = requisitionLinkFilter(actor, filters);
    const candInRange = candidateWhere(actor, filters, { createdInRange: true });

    const [
      requisitionStatusRows,
      openReqs,
      filledAccepted,
      candidatesCreatedInRange,
      candidateStatusRows,
      rejected,
      withdrawn,
      openReqCount,
      deptRows,
      priorityRows,
      employmentRows,
      workModeRows,
    ] = await Promise.all([
      prisma.jobRequisition.groupBy({
        by: ["status"],
        where: reqFilter,
        _count: { _all: true },
      }),
      prisma.jobRequisition.findMany({
        where: { ...reqFilter, status: "OPEN" },
        select: { openings: true },
      }),
      prisma.offer.count({
        where: {
          deletedAt: null,
          status: "ACCEPTED",
          requisition: reqFilter,
        },
      }),
      prisma.candidate.count({ where: candInRange }),
      prisma.candidate.groupBy({
        by: ["status"],
        where: candInRange,
        _count: { _all: true },
      }),
      prisma.candidate.count({
        where: { ...candInRange, status: "REJECTED" },
      }),
      prisma.candidate.count({
        where: { ...candInRange, status: "WITHDRAWN" },
      }),
      prisma.jobRequisition.count({
        where: { ...reqFilter, status: "OPEN" },
      }),
      prisma.candidate.groupBy({
        by: ["requisitionId"],
        where: candInRange,
        _count: { _all: true },
      }),
      prisma.jobRequisition.groupBy({
        by: ["hiringPriority"],
        where: reqFilter,
        _count: { _all: true },
      }),
      prisma.jobRequisition.groupBy({
        by: ["employmentType"],
        where: reqFilter,
        _count: { _all: true },
      }),
      prisma.jobRequisition.groupBy({
        by: ["workMode"],
        where: reqFilter,
        _count: { _all: true },
      }),
    ]);

    const requisitions = await prisma.jobRequisition.findMany({
      where: {
        id: { in: deptRows.map((row) => row.requisitionId) },
      },
      select: { id: true, department: { select: { id: true, name: true } } },
    });
    const reqDept = new Map(
      requisitions.map((req) => [req.id, req.department]),
    );
    const deptCounts = new Map<string, { label: string; count: number }>();
    for (const row of deptRows) {
      const department = reqDept.get(row.requisitionId);
      if (!department) {
        continue;
      }
      const current = deptCounts.get(department.id) ?? {
        label: department.name,
        count: 0,
      };
      current.count += row._count._all;
      deptCounts.set(department.id, current);
    }

    const reqStatusMap = new Map(
      requisitionStatusRows.map((row) => [row.status, row._count._all]),
    );
    const candStatusMap = new Map(
      candidateStatusRows.map((row) => [row.status, row._count._all]),
    );

    const totalOpenings = openReqs.reduce((sum, req) => sum + req.openings, 0);

    return {
      filters: toPublicFilters(filters),
      requisitionsByStatus: REQUISITION_STATUSES.map((status) => ({
        status,
        count: reqStatusMap.get(status) ?? 0,
      })),
      openingsVsFilled: {
        totalOpenings,
        totalFilled: filledAccepted,
      },
      candidatesCreatedInRange,
      candidatesByStatus: CANDIDATE_STATUSES.map((status) => ({
        status,
        count: candStatusMap.get(status) ?? 0,
      })),
      rejectionRate: rate(rejected, candidatesCreatedInRange),
      withdrawalRate: rate(withdrawn, candidatesCreatedInRange),
      avgCandidatesPerOpenRequisition:
        openReqCount > 0
          ? Math.round((candidatesCreatedInRange / openReqCount) * 10) / 10
          : null,
      byDepartment: [...deptCounts.entries()].map(([key, value]) => ({
        key,
        label: value.label,
        count: value.count,
      })),
      byHiringPriority: priorityRows.map((row) => ({
        key: row.hiringPriority,
        count: row._count._all,
      })),
      byEmploymentType: employmentRows.map((row) => ({
        key: row.employmentType,
        count: row._count._all,
      })),
      byWorkMode: workModeRows.map((row) => ({
        key: row.workMode,
        count: row._count._all,
      })),
    };
  },

  async funnel(
    actor: AuthenticatedUser,
    filters: ResolvedReportFilters,
  ): Promise<ReportFunnelDto> {
    const candInRange = candidateWhere(actor, filters, { createdInRange: true });
    const reqFilter = requisitionLinkFilter(actor, filters);

    const [statusRows, offersExtended, offersAccepted, offersExtendedTotal] =
      await Promise.all([
        prisma.candidate.groupBy({
          by: ["status"],
          where: candInRange,
          _count: { _all: true },
        }),
        prisma.offer.count({
          where: {
            deletedAt: null,
            status: "EXTENDED",
            requisition: reqFilter,
            createdAt: { gte: filters.dateFromDate, lte: filters.dateToDate },
          },
        }),
        prisma.offer.count({
          where: {
            deletedAt: null,
            status: "ACCEPTED",
            requisition: reqFilter,
            respondedAt: { gte: filters.dateFromDate, lte: filters.dateToDate },
          },
        }),
        prisma.offer.count({
          where: {
            deletedAt: null,
            status: { in: ["EXTENDED", "ACCEPTED", "DECLINED", "EXPIRED", "WITHDRAWN"] },
            requisition: reqFilter,
            extendedAt: { gte: filters.dateFromDate, lte: filters.dateToDate },
          },
        }),
      ]);

    const statusMap = new Map(
      statusRows.map((row) => [row.status, row._count._all]),
    );

    const applied = statusMap.get("APPLIED") ?? 0;
    const shortlisted = statusMap.get("SHORTLISTED") ?? 0;
    const selected = statusMap.get("SELECTED") ?? 0;
    const offerAccepted = statusMap.get("OFFER_ACCEPTED") ?? 0;
    const joined = statusMap.get("JOINED") ?? 0;

    return {
      filters: toPublicFilters(filters),
      stages: FUNNEL_STAGE_ORDER.map((stage) => ({
        key: stage.key,
        label: stage.label,
        count:
          stage.key === "OFFER_EXTENDED"
            ? offersExtended
            : (statusMap.get(stage.status!) ?? 0),
      })),
      exits: [
        {
          key: "REJECTED",
          label: "Rejected",
          count: statusMap.get("REJECTED") ?? 0,
        },
        {
          key: "OFFER_DECLINED",
          label: "Offer declined",
          count: statusMap.get("OFFER_DECLINED") ?? 0,
        },
        {
          key: "WITHDRAWN",
          label: "Withdrawn",
          count: statusMap.get("WITHDRAWN") ?? 0,
        },
      ],
      conversions: [
        {
          key: "shortlisted_per_applied",
          label: "Shortlisted / Applied",
          numerator: shortlisted,
          denominator: applied + shortlisted + selected + offerAccepted + joined,
          rate: rate(
            shortlisted,
            applied + shortlisted + selected + offerAccepted + joined,
          ),
        },
        {
          key: "selected_per_shortlisted",
          label: "Selected / Shortlisted",
          numerator: selected,
          denominator: shortlisted + selected,
          rate: rate(selected, shortlisted + selected),
        },
        {
          key: "accepted_per_extended",
          label: "Accepted / Extended",
          numerator: offersAccepted,
          denominator: offersExtendedTotal,
          rate: rate(offersAccepted, offersExtendedTotal),
        },
        {
          key: "joined_per_accepted",
          label: "Joined / Accepted",
          numerator: joined,
          denominator: offerAccepted + joined,
          rate: rate(joined, offerAccepted + joined),
        },
      ],
    };
  },

  async departments(
    actor: AuthenticatedUser,
    filters: ResolvedReportFilters,
  ): Promise<ReportDepartmentsDto> {
    const reqFilter = requisitionLinkFilter(actor, filters);
    const departments = await prisma.department.findMany({
      where: {
        OR: [
          { isActive: true },
          { requisitions: { some: reqFilter } },
        ],
        ...(filters.departmentId ? { id: filters.departmentId } : {}),
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    });

    const rows = await Promise.all(
      departments.map(async (department) => {
        const deptReqFilter = {
          ...reqFilter,
          departmentId: department.id,
        };

        const [
          openRequisitions,
          openReqs,
          candidates,
          interviews,
          offersExtended,
          offersAccepted,
          joined,
          onboarded,
          joinLags,
        ] = await Promise.all([
          prisma.jobRequisition.count({
            where: { ...deptReqFilter, status: "OPEN" },
          }),
          prisma.jobRequisition.findMany({
            where: { ...deptReqFilter, status: "OPEN" },
            select: { openings: true },
          }),
          prisma.candidate.count({
            where: candidateWhere(actor, {
              ...filters,
              departmentId: department.id,
            }, { createdInRange: true }),
          }),
          prisma.interview.count({
            where: {
              deletedAt: null,
              requisition: deptReqFilter,
              scheduledAt: {
                gte: filters.dateFromDate,
                lte: filters.dateToDate,
              },
            },
          }),
          prisma.offer.count({
            where: {
              deletedAt: null,
              status: "EXTENDED",
              requisition: deptReqFilter,
              extendedAt: {
                gte: filters.dateFromDate,
                lte: filters.dateToDate,
              },
            },
          }),
          prisma.offer.count({
            where: {
              deletedAt: null,
              status: "ACCEPTED",
              requisition: deptReqFilter,
              respondedAt: {
                gte: filters.dateFromDate,
                lte: filters.dateToDate,
              },
            },
          }),
          prisma.onboardingCase.count({
            where: {
              status: { in: ["JOINED", "COMPLETED"] },
              requisition: deptReqFilter,
              joinedAt: {
                gte: filters.dateFromDate,
                lte: filters.dateToDate,
              },
            },
          }),
          prisma.onboardingCase.count({
            where: {
              status: "COMPLETED",
              requisition: deptReqFilter,
              completedAt: {
                gte: filters.dateFromDate,
                lte: filters.dateToDate,
              },
            },
          }),
          prisma.onboardingCase.findMany({
            where: {
              joinedAt: {
                gte: filters.dateFromDate,
                lte: filters.dateToDate,
              },
              requisition: deptReqFilter,
              candidate: { deletedAt: null },
            },
            select: {
              joinedAt: true,
              candidate: { select: { createdAt: true } },
            },
          }),
        ]);

        return {
          departmentId: department.id,
          departmentName: department.name,
          isActive: department.isActive,
          openRequisitions,
          openings: openReqs.reduce((sum, req) => sum + req.openings, 0),
          candidates,
          interviews,
          offersExtended,
          offersAccepted,
          joined,
          onboarded,
          avgDaysToJoin: avg(
            joinLags
              .filter((row) => row.joinedAt)
              .map((row) =>
                daysBetween(row.candidate.createdAt, row.joinedAt!),
              )
              .filter((value) => value >= 0),
          ),
        };
      }),
    );

    return {
      filters: toPublicFilters(filters),
      rows,
    };
  },

  async interviews(
    actor: AuthenticatedUser,
    filters: ResolvedReportFilters,
  ): Promise<ReportInterviewsDto> {
    const reqFilter = requisitionLinkFilter(actor, filters);
    const dateField =
      filters.interviewDateBasis === "completedAt" ? "completedAt" : "scheduledAt";

    const where = {
      deletedAt: null,
      requisition: reqFilter,
      [dateField]: {
        gte: filters.dateFromDate,
        lte: filters.dateToDate,
      },
    };

    const [statusRows, roundRows, modeRows, completed, noShow, cancelled, withFeedback, ratings, feedbackRecs] =
      await Promise.all([
        prisma.interview.groupBy({
          by: ["status"],
          where,
          _count: { _all: true },
        }),
        prisma.interview.groupBy({
          by: ["roundType"],
          where,
          _count: { _all: true },
        }),
        prisma.interview.groupBy({
          by: ["mode"],
          where,
          _count: { _all: true },
        }),
        prisma.interview.count({ where: { ...where, status: "COMPLETED" } }),
        prisma.interview.count({ where: { ...where, status: "NO_SHOW" } }),
        prisma.interview.count({ where: { ...where, status: "CANCELLED" } }),
        prisma.interview.count({
          where: {
            ...where,
            status: "COMPLETED",
            feedbackItems: { some: {} },
          },
        }),
        prisma.interviewFeedback.findMany({
          where: {
            rating: { not: null },
            interview: where,
          },
          select: { rating: true, recommendation: true },
        }),
        prisma.interviewFeedback.groupBy({
          by: ["recommendation"],
          where: { interview: where },
          _count: { _all: true },
        }),
      ]);

    const statusMap = new Map(
      statusRows.map((row) => [row.status, row._count._all]),
    );
    const roundMap = new Map(
      roundRows.map((row) => [row.roundType, row._count._all]),
    );
    const modeMap = new Map(modeRows.map((row) => [row.mode, row._count._all]));

    const closed = completed + noShow + cancelled;
    const ratingValues = ratings
      .map((item) => item.rating)
      .filter((value): value is number => value != null);

    const recMap = new Map(
      feedbackRecs.map((row) => [row.recommendation ?? "NONE", row._count._all]),
    );

    return {
      filters: toPublicFilters(filters),
      byStatus: INTERVIEW_STATUSES.map((status) => ({
        status: status as InterviewStatus,
        count: statusMap.get(status) ?? 0,
      })),
      byRoundType: INTERVIEW_ROUND_TYPES.map((key) => ({
        key: key as InterviewRoundType,
        count: roundMap.get(key) ?? 0,
      })),
      byMode: INTERVIEW_MODES.map((key) => ({
        key: key as InterviewMode,
        count: modeMap.get(key) ?? 0,
      })),
      completionRate: rate(completed, closed),
      noShowRate: rate(noShow, closed),
      feedbackCoverage: rate(withFeedback, completed),
      avgRating: avg(ratingValues),
      recommendations: [
        ...INTERVIEW_RECOMMENDATIONS.map((key) => ({
          key: key as InterviewRecommendation,
          count: recMap.get(key) ?? 0,
        })),
        { key: "NONE" as const, count: recMap.get("NONE") ?? 0 },
      ],
    };
  },

  async offers(
    actor: AuthenticatedUser,
    filters: ResolvedReportFilters,
  ): Promise<ReportOffersDto> {
    const reqFilter = requisitionLinkFilter(actor, filters);
    const dateField = filters.offerDateBasis;

    const where = {
      deletedAt: null,
      requisition: reqFilter,
      [dateField]: {
        gte: filters.dateFromDate,
        lte: filters.dateToDate,
      },
    };

    const [statusRows, approvalPairs, responsePairs, salaryRows, pendingApproval, extended] =
      await Promise.all([
        prisma.offer.groupBy({
          by: ["status"],
          where,
          _count: { _all: true },
        }),
        prisma.offer.findMany({
          where: {
            deletedAt: null,
            requisition: reqFilter,
            submittedAt: { not: null },
            approvedAt: {
              not: null,
              gte: filters.dateFromDate,
              lte: filters.dateToDate,
            },
          },
          select: { submittedAt: true, approvedAt: true },
        }),
        prisma.offer.findMany({
          where: {
            deletedAt: null,
            requisition: reqFilter,
            extendedAt: { not: null },
            respondedAt: {
              gte: filters.dateFromDate,
              lte: filters.dateToDate,
            },
          },
          select: { extendedAt: true, respondedAt: true },
        }),
        prisma.offer.groupBy({
          by: ["currency"],
          where: {
            ...where,
            status: { in: ["EXTENDED", "ACCEPTED", "APPROVED", "PENDING_APPROVAL"] },
          },
          _avg: { baseSalary: true },
          _count: { _all: true },
        }),
        prisma.offer.count({
          where: {
            deletedAt: null,
            status: "PENDING_APPROVAL",
            requisition: reqFilter,
          },
        }),
        prisma.offer.count({
          where: {
            deletedAt: null,
            status: "EXTENDED",
            requisition: reqFilter,
          },
        }),
      ]);

    const statusMap = new Map(
      statusRows.map((row) => [row.status, row._count._all]),
    );
    const totalInRange = [...statusMap.values()].reduce((a, b) => a + b, 0);
    const accepted = statusMap.get("ACCEPTED") ?? 0;
    const declined = statusMap.get("DECLINED") ?? 0;
    const withdrawn = statusMap.get("WITHDRAWN") ?? 0;
    const expired = statusMap.get("EXPIRED") ?? 0;

    return {
      filters: toPublicFilters(filters),
      byStatus: OFFER_STATUSES.map((status) => ({
        status: status as OfferStatus,
        count: statusMap.get(status) ?? 0,
      })),
      avgApprovalDays: avg(
        approvalPairs
          .filter((row) => row.submittedAt && row.approvedAt)
          .map((row) => daysBetween(row.submittedAt!, row.approvedAt!))
          .filter((value) => value >= 0),
      ),
      avgResponseDays: avg(
        responsePairs
          .filter((row) => row.extendedAt && row.respondedAt)
          .map((row) => daysBetween(row.extendedAt!, row.respondedAt!))
          .filter((value) => value >= 0),
      ),
      acceptRate: rate(accepted, totalInRange),
      declineRate: rate(declined, totalInRange),
      withdrawRate: rate(withdrawn, totalInRange),
      expireRate: rate(expired, totalInRange),
      avgSalaryByCurrency: salaryRows.map((row) => ({
        currency: row.currency,
        average: Math.round(row._avg.baseSalary ?? 0),
        count: row._count._all,
      })),
      pipeline: {
        pendingApproval,
        extendedAwaitingResponse: extended,
      },
    };
  },

  async onboarding(
    actor: AuthenticatedUser,
    filters: ResolvedReportFilters,
  ): Promise<ReportOnboardingDto> {
    const reqFilter = requisitionLinkFilter(actor, filters);
    const dateField = filters.onboardingDateBasis;

    const where = {
      requisition: reqFilter,
      [dateField]: {
        gte: filters.dateFromDate,
        lte: filters.dateToDate,
      },
    };

    const [statusRows, timingRows, tasks, docs, cancelReasons] = await Promise.all([
      prisma.onboardingCase.groupBy({
        by: ["status"],
        where,
        _count: { _all: true },
      }),
      prisma.onboardingCase.findMany({
        where,
        select: {
          startedAt: true,
          joinedAt: true,
          completedAt: true,
          status: true,
        },
      }),
      prisma.onboardingTask.groupBy({
        by: ["status"],
        where: {
          isRequired: true,
          onboardingCase: where,
        },
        _count: { _all: true },
      }),
      prisma.onboardingDocument.groupBy({
        by: ["status"],
        where: {
          isRequired: true,
          onboardingCase: where,
        },
        _count: { _all: true },
      }),
      prisma.onboardingCase.groupBy({
        by: ["cancelReason"],
        where: {
          ...where,
          status: "CANCELLED",
          cancelReason: { not: null },
        },
        _count: { _all: true },
      }),
    ]);

    const statusMap = new Map(
      statusRows.map((row) => [row.status, row._count._all]),
    );
    const total = [...statusMap.values()].reduce((a, b) => a + b, 0);
    const cancelled = statusMap.get("CANCELLED") ?? 0;

    const taskMap = new Map(tasks.map((row) => [row.status, row._count._all]));
    const requiredTasks = [...taskMap.values()].reduce((a, b) => a + b, 0);
    const completedTasks =
      (taskMap.get("COMPLETED") ?? 0) + (taskMap.get("SKIPPED") ?? 0);

    const docMap = new Map(docs.map((row) => [row.status, row._count._all]));
    const requiredDocs = [...docMap.values()].reduce((a, b) => a + b, 0);
    const readyDocs =
      (docMap.get("VERIFIED") ?? 0) + (docMap.get("WAIVED") ?? 0);

    return {
      filters: toPublicFilters(filters),
      byStatus: ONBOARDING_CASE_STATUSES.map((status) => ({
        status: status as OnboardingCaseStatus,
        count: statusMap.get(status) ?? 0,
      })),
      avgDaysStartToJoin: avg(
        timingRows
          .filter((row) => row.startedAt && row.joinedAt)
          .map((row) => daysBetween(row.startedAt!, row.joinedAt!))
          .filter((value) => value >= 0),
      ),
      avgDaysJoinToComplete: avg(
        timingRows
          .filter((row) => row.joinedAt && row.completedAt)
          .map((row) => daysBetween(row.joinedAt!, row.completedAt!))
          .filter((value) => value >= 0),
      ),
      taskCompletionRate: rate(completedTasks, requiredTasks),
      documentReadinessRate: rate(readyDocs, requiredDocs),
      cancelRate: rate(cancelled, total),
      topCancelReasons: cancelReasons
        .filter((row) => row.cancelReason)
        .map((row) => ({
          key: row.cancelReason!,
          label: row.cancelReason!,
          count: row._count._all,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
    };
  },

  async employees(
    actor: AuthenticatedUser,
    filters: ResolvedReportFilters,
  ): Promise<ReportEmployeesDto> {
    const reqFilter = requisitionLinkFilter(actor, filters);
    const where = {
      requisition: reqFilter,
      ...(filters.departmentId ? { departmentId: filters.departmentId } : {}),
      ...(filters.search
        ? {
            OR: [
              { fullName: { contains: filters.search, mode: "insensitive" as const } },
              { email: { contains: filters.search, mode: "insensitive" as const } },
              {
                employeeCode: {
                  contains: filters.search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    };

    const [statusRows, joinsInPeriod, withdrawalsInPeriod, deptRows, employmentRows, workModeRows] =
      await Promise.all([
        prisma.employee.groupBy({
          by: ["status"],
          where,
          _count: { _all: true },
        }),
        prisma.employee.count({
          where: {
            ...where,
            actualJoiningDate: {
              gte: filters.dateFromDate,
              lte: filters.dateToDate,
            },
          },
        }),
        prisma.employee.count({
          where: {
            ...where,
            status: "WITHDRAWN",
            updatedAt: {
              gte: filters.dateFromDate,
              lte: filters.dateToDate,
            },
          },
        }),
        prisma.employee.groupBy({
          by: ["departmentId"],
          where,
          _count: { _all: true },
        }),
        prisma.employee.groupBy({
          by: ["employmentType"],
          where,
          _count: { _all: true },
        }),
        prisma.employee.groupBy({
          by: ["workMode"],
          where,
          _count: { _all: true },
        }),
      ]);

    const departments = await prisma.department.findMany({
      where: { id: { in: deptRows.map((row) => row.departmentId) } },
      select: { id: true, name: true },
    });
    const deptNames = new Map(departments.map((d) => [d.id, d.name]));
    const statusMap = new Map(
      statusRows.map((row) => [row.status, row._count._all]),
    );

    return {
      filters: toPublicFilters(filters),
      byStatus: EMPLOYEE_STATUSES.map((status) => ({
        status: status as EmployeeStatus,
        count: statusMap.get(status) ?? 0,
      })),
      joinsInPeriod,
      withdrawalsInPeriod,
      byDepartment: deptRows.map((row) => ({
        key: row.departmentId,
        label: deptNames.get(row.departmentId) ?? "Unknown",
        count: row._count._all,
      })),
      byEmploymentType: employmentRows.map((row) => ({
        key: row.employmentType,
        count: row._count._all,
      })),
      byWorkMode: workModeRows.map((row) => ({
        key: row.workMode,
        count: row._count._all,
      })),
    };
  },
};
