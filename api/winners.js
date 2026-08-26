import { handleRecordSpinResult, sendMethodNotAllowed } from './_lib/spin-wheel.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    sendMethodNotAllowed(res, ['POST']);
    return;
  }

  await handleRecordSpinResult(req, res);
}
