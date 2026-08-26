import { getMilestoneSpinSchedule, sendMethodNotAllowed } from './_lib/spin-wheel.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    sendMethodNotAllowed(res, ['GET']);
    return;
  }

  const milestoneSpinSchedule = await getMilestoneSpinSchedule();
  res.json({ milestoneSpinSchedule });
}
