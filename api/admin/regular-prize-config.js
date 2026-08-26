import {
  getRegularPrizeNames,
  normalizeRegularPrizeNames,
  sendMethodNotAllowed,
  updateRegularPrizeNames,
  isAuthorizedExportRequest,
} from '../_lib/spin-wheel.js';

export default async function handler(req, res) {
  const auth = isAuthorizedExportRequest(req);
  if (!auth.ok) {
    res.status(auth.status).json({ error: auth.error });
    return;
  }

  if (req.method === 'GET') {
    const regularPrizeNames = await getRegularPrizeNames();
    res.json({ regularPrizeNames });
    return;
  }

  if (req.method === 'POST') {
    const names = normalizeRegularPrizeNames(req.body?.regularPrizeNames || req.body?.prizes || []);
    const regularPrizeNames = await updateRegularPrizeNames(names);
    res.json({ regularPrizeNames });
    return;
  }

  sendMethodNotAllowed(res, ['GET', 'POST']);
}
