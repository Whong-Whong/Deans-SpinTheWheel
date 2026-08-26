import {
  getPrizeConfig,
  incrementPrizeWinCount,
  isAuthorizedExportRequest,
  sendMethodNotAllowed,
} from '../_lib/spin-wheel.js';

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

  const { prizeName } = req.body || {};
  if (!prizeName) {
    res.status(400).json({ error: 'Prize name is required.' });
    return;
  }

  await incrementPrizeWinCount(prizeName);
  const config = await getPrizeConfig(prizeName);
  res.json({ config });
}
