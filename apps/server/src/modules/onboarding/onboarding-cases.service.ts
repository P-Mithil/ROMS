import type { Prisma } from "@prisma/client";

type AcceptedOfferRef = {
  id: string;
  candidateId: string;
  requisitionId: string;
};

export async function createPendingOnboardingCase(
  tx: Prisma.TransactionClient,
  offer: AcceptedOfferRef,
) {
  const existing = await tx.onboardingCase.findUnique({
    where: { offerId: offer.id },
  });

  if (existing) {
    return existing;
  }

  return tx.onboardingCase.create({
    data: {
      offerId: offer.id,
      candidateId: offer.candidateId,
      requisitionId: offer.requisitionId,
      status: "PENDING",
    },
  });
}
