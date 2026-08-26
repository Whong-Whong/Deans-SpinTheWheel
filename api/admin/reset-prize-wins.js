import { resetPrizeWinCounts, isAuthorizedExportRequest, sendMethodNotAllowed } from '../_lib/spin-wheel.js';

export default async function handler(req, res) {
  const auth = isAuthorizedExportRequest(req);
  if (!auth.ok) {
    res.status(auth.status).json({ error: auth.error });
    return;
  }

  if (req.method !== 'POST') {
    sendMethodNotAllowed(res, ['POST']);
    return;
  }

  await resetPrizeWinCounts();
  res.json({ status: 'ok', message: 'All prize win counts have been reset.' });
}
