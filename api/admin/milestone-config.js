import {
  getMilestoneSpinSchedule,
  normalizeMilestoneSpinSchedule,
  sendMethodNotAllowed,
  updateMilestoneSpinSchedule,
  isAuthorizedExportRequest,
} from '../_lib/spin-wheel.js';

export default async function handler(req, res) {
  const auth = isAuthorizedExportRequest(req);
  if (!auth.ok) {
    res.status(auth.status).json({ error: auth.error });
    return;
  }

  if (req.method === 'GET') {
    const milestoneSpinSchedule = await getMilestoneSpinSchedule();
    res.json({ milestoneSpinSchedule });
    return;
  }

  if (req.method === 'POST') {
    const schedule = normalizeMilestoneSpinSchedule(req.body?.milestoneSpinSchedule || req.body?.schedule || {});
    const milestoneSpinSchedule = await updateMilestoneSpinSchedule(schedule);
    res.json({ milestoneSpinSchedule });
    return;
  }

  sendMethodNotAllowed(res, ['GET', 'POST']);
}
