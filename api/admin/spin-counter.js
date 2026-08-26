import {
  handleGetAdminSpinCounter,
  handleSetAdminSpinCounter,
  sendMethodNotAllowed,
} from '../_lib/spin-wheel.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    await handleGetAdminSpinCounter(req, res);
    return;
  }

  if (req.method === 'POST') {
    await handleSetAdminSpinCounter(req, res);
    return;
  }

  sendMethodNotAllowed(res, ['GET', 'POST']);
}
