import { LeadStatus, SurveyStatus } from '@prisma/client';
import { prisma } from '../config/database.js';
import { conflictError, notFoundError } from '../utils/errors.js';

export async function createSurvey(leadId, input, conductorId) {
  return prisma.$transaction(async (tx) => {
    const lead = await tx.lead.findUnique({ where: { id: leadId }, include: { survey: true } });
    if (!lead) throw notFoundError('Lead not found');
    if ([LeadStatus.LOST, LeadStatus.CONVERTED].includes(lead.status)) {
      throw conflictError(`A ${lead.status} lead cannot receive a survey`);
    }
    if (lead.survey && lead.survey.status !== SurveyStatus.REJECTED) {
      throw conflictError('This lead already has a pending or approved survey');
    }

    if (lead.survey) await tx.siteSurvey.delete({ where: { id: lead.survey.id } });

    const survey = await tx.siteSurvey.create({
      data: { leadId, conductedByUserId: conductorId, ...input },
    });
    await tx.lead.update({ where: { id: leadId }, data: { status: LeadStatus.SURVEY_SCHEDULED } });
    return survey;
  });
}

export async function getSurvey(id) {
  const survey = await prisma.siteSurvey.findUnique({
    where: { id },
    include: {
      lead: { include: { customer: true } },
      conductedBy: { select: { id: true, name: true, role: true } },
      approvedBy: { select: { id: true, name: true, role: true } },
    },
  });
  if (!survey) throw notFoundError('Site survey not found');
  return survey;
}

export async function approveSurvey(id, approverId) {
  return prisma.$transaction(async (tx) => {
    const survey = await tx.siteSurvey.findUnique({ where: { id } });
    if (!survey) throw notFoundError('Site survey not found');
    if (survey.status !== SurveyStatus.PENDING) throw conflictError('Only a pending survey can be approved');

    const updated = await tx.siteSurvey.update({
      where: { id },
      data: { status: SurveyStatus.APPROVED, approvedByUserId: approverId, approvedAt: new Date(), rejectionReason: null },
    });
    await tx.lead.update({ where: { id: survey.leadId }, data: { status: LeadStatus.SURVEY_APPROVED } });
    return updated;
  });
}

export async function rejectSurvey(id, rejectionReason) {
  return prisma.$transaction(async (tx) => {
    const survey = await tx.siteSurvey.findUnique({ where: { id } });
    if (!survey) throw notFoundError('Site survey not found');
    if (survey.status !== SurveyStatus.PENDING) throw conflictError('Only a pending survey can be rejected');

    return tx.siteSurvey.update({
      where: { id },
      data: { status: SurveyStatus.REJECTED, rejectionReason, approvedByUserId: null, approvedAt: null },
    });
  });
}
