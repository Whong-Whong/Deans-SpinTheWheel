import {
  handleAddAdminEntry,
  handleDeleteAdminEntry,
  handleGetAdminEntries,
  handleReorderAdminEntries,
  sendMethodNotAllowed,
} from '../_lib/spin-wheel.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    await handleGetAdminEntries(req, res);
    return;
  }

  if (req.method === 'POST') {
    await handleAddAdminEntry(req, res);
    return;
  }

  if (req.method === 'DELETE') {
    await handleDeleteAdminEntry(req, res);
    return;
  }

  if (req.method === 'PUT') {
    await handleReorderAdminEntries(req, res);
    return;
  }

  sendMethodNotAllowed(res, ['GET', 'POST', 'DELETE', 'PUT']);
}
