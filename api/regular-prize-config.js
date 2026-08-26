import { getRegularPrizeNames, sendMethodNotAllowed } from './_lib/spin-wheel.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    sendMethodNotAllowed(res, ['GET']);
    return;
  }

  const regularPrizeNames = await getRegularPrizeNames();
  res.json({ regularPrizeNames });
}
