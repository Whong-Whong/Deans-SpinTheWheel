import {
  getPrizeConfigurations,
  sendMethodNotAllowed,
  updatePrizeConfig,
  isAuthorizedExportRequest,
} from '../_lib/spin-wheel.js';

export default async function handler(req, res) {
  const auth = isAuthorizedExportRequest(req);
  if (!auth.ok) {
    res.status(auth.status).json({ error: auth.error });
    return;
  }

  if (req.method === 'GET') {
    const prizeConfigs = await getPrizeConfigurations();
    res.json({ prizeConfigs });
    return;
  }

  if (req.method === 'POST') {
    const { prizeName, maxWins, isEternal, isDisabled } = req.body || {};
    if (!prizeName || typeof maxWins !== 'number' || maxWins < 1) {
      res.status(400).json({ error: 'Prize name and valid maxWins (≥1) are required.' });
      return;
    }

    await updatePrizeConfig(prizeName, maxWins, isEternal, isDisabled);
    const prizeConfigs = await getPrizeConfigurations();
    const config = prizeConfigs.find((entry) => entry.prizeName === prizeName) || {
      prizeName,
      maxWins: 1,
      currentWins: 0,
      isEternal: false,
      isDisabled: false,
      lossMessage: '',
      lossType: '',
    };
    res.json({ config, prizeConfigs });
    return;
  }

  sendMethodNotAllowed(res, ['GET', 'POST']);
}
