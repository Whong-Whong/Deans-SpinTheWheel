import {
  handleCreateParticipant,
  handleGetParticipants,
  sendMethodNotAllowed,
} from '../_lib/spin-wheel.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    await handleGetParticipants(req, res);
    return;
  }

  if (req.method === 'POST') {
    await handleCreateParticipant(req, res);
    return;
  }

  sendMethodNotAllowed(res, ['GET', 'POST']);
}
