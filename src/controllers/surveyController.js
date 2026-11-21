import * as surveyService from '../services/surveyService.js';

export async function create(req, res) {
  const survey = await surveyService.createSurvey(
    req.validated.params.leadId,
    req.validated.body,
    req.user.id,
  );
  res.status(201).json({ data: survey });
}

export async function get(req, res) {
  const survey = await surveyService.getSurvey(req.validated.params.id);
  res.status(200).json({ data: survey });
}

export async function approve(req, res) {
  const survey = await surveyService.approveSurvey(req.validated.params.id, req.user.id);
  res.status(200).json({ data: survey });
}

export async function reject(req, res) {
  const survey = await surveyService.rejectSurvey(
    req.validated.params.id,
    req.validated.body.rejectionReason,
  );
  res.status(200).json({ data: survey });
}
