import express from 'express';
import { MongoClient } from 'mongodb';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import * as XLSX from 'xlsx';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3001);
const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const distDir = path.join(currentDir, 'dist');
const staticDir = existsSync(distDir) ? distDir : currentDir;

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const databaseName = process.env.MONGODB_DB || 'SpinTheWheel';
const collectionName = process.env.MONGODB_COLLECTION || 'spin_the_wheel_entries';
const entriesConfigCollectionName = process.env.MONGODB_ENTRIES_COLLECTION || 'spin_the_wheel_config';
const entriesConfigDocumentId = 'wheel_entries';
const exportAdminEmail = String(process.env.EXPORT_ADMIN_EMAIL || 'katapills@gmail.com').trim().toLowerCase();
const exportAccessKey = String(process.env.EXPORT_ACCESS_KEY || 'Admin2468!').trim();

let mongoClient;
let mongoDatabase;
let participantsCollection;
let mongoConnectPromise;

async function connectToMongo() {
  if (participantsCollection) {
    return participantsCollection;
  }

  if (!mongoConnectPromise) {
    mongoConnectPromise = (async () => {
      const client = new MongoClient(mongoUri, {
        serverSelectionTimeoutMS: 2000,
      });
      await client.connect();
      mongoClient = client;
      mongoDatabase = mongoClient.db(databaseName);
      participantsCollection = mongoDatabase.collection(collectionName);
      await participantsCollection.createIndex({ submittedAt: 1 });
      return participantsCollection;
    })().catch((error) => {
      mongoConnectPromise = null;
      throw error;
    });
  }

  return mongoConnectPromise;
}

async function connectToDatabase() {
  await connectToMongo();
  return mongoDatabase;
}

function normalizeParticipant(participant) {
  if (!participant || typeof participant !== 'object') {
    return null;
  }

  const fullName = String(participant.fullName || participant.name || '').trim();
  const school = String(participant.school || '').trim();
  const email = String(participant.email || '').trim();

  if (!fullName && !school && !email) {
    return null;
  }

  return {
    id: participant.id || participant._id?.toString() || randomUUID(),
    fullName,
    name: fullName,
    school,
    email,
    submittedAt: participant.submittedAt || participant.createdAt || new Date().toISOString(),
  };
}

function parseDateOnly(value) {
  const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateOnlyPattern.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function isAuthorizedExportRequest(req) {
  const requestEmail = String(req.get('X-Admin-Email') || '').trim().toLowerCase();
  const requestKey = String(req.get('X-Export-Key') || '').trim();

  if (!exportAccessKey) {
    return { ok: false, status: 503, error: 'Export access is not configured on the server.' };
  }

  if (requestEmail !== exportAdminEmail || requestKey !== exportAccessKey) {
    return { ok: false, status: 403, error: 'You are not allowed to download registrations.' };
  }

  return { ok: true };
}

function isAuthorizedAdminLogin(email, accessKey) {
  const requestEmail = String(email || '').trim().toLowerCase();
  const requestKey = String(accessKey || '').trim();

  if (!exportAccessKey) {
    return { ok: false, status: 503, error: 'Export access is not configured on the server.' };
  }

  if (requestEmail !== exportAdminEmail || requestKey !== exportAccessKey) {
    return { ok: false, status: 403, error: 'Invalid admin credentials.' };
  }

  return { ok: true };
}

function normalizeEntryList(entries) {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .map((entry) => String(entry).trim())
    .filter(Boolean);
}

async function loadDefaultEntriesFromFile() {
  const candidates = [
    path.join(staticDir, 'entries.json'),
    path.join(currentDir, 'public', 'entries.json'),
  ];

  for (const filePath of candidates) {
    try {
      const fileContents = await readFile(filePath, 'utf8');
      const json = JSON.parse(fileContents);
      const list = Array.isArray(json) ? json : json.entries;
      const normalized = normalizeEntryList(list);
      if (normalized.length > 0) {
        return normalized;
      }
    } catch {
      // try next candidate path
    }
  }

  return ['Option 1', 'Option 2'];
}

async function getManagedEntriesCollection() {
  const database = await connectToDatabase();
  return database.collection(entriesConfigCollectionName);
}

async function getConfiguredEntries() {
  const collection = await getManagedEntriesCollection();
  const config = await collection.findOne({ _id: entriesConfigDocumentId });
  return normalizeEntryList(config?.entries);
}

async function getCurrentEntriesForAdmin() {
  const configuredEntries = await getConfiguredEntries();
  if (configuredEntries.length > 0) {
    return configuredEntries;
  }

  return loadDefaultEntriesFromFile();
}

async function saveConfiguredEntries(entries) {
  const collection = await getManagedEntriesCollection();
  const normalizedEntries = normalizeEntryList(entries);
  await collection.updateOne(
    { _id: entriesConfigDocumentId },
    {
      $set: {
        entries: normalizedEntries,
        updatedAt: new Date().toISOString(),
      },
    },
    { upsert: true },
  );

  return normalizedEntries;
}

app.use(express.json());
app.use(express.static(staticDir));

app.get('/api/health', async (_req, res) => {
  try {
    const collection = await connectToMongo();
    res.json({
      status: 'ok',
      database: databaseName,
      collection: collection.collectionName,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/participants', async (_req, res) => {
  try {
    const collection = await connectToMongo();
    const participants = await collection.find({}).sort({ _id: 1 }).toArray();
    res.json(participants.map(normalizeParticipant).filter(Boolean));
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unable to load participants',
    });
  }
});

app.get('/api/entries', async (_req, res) => {
  try {
    const configuredEntries = await getConfiguredEntries();
    if (configuredEntries.length > 0) {
      res.json({ entries: configuredEntries, source: 'admin' });
      return;
    }

    const defaultEntries = await loadDefaultEntriesFromFile();
    res.json({ entries: defaultEntries, source: 'default' });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unable to load wheel entries',
    });
  }
});

app.post('/api/admin/login', (req, res) => {
  const { email, accessKey } = req.body || {};
  const auth = isAuthorizedAdminLogin(email, accessKey);
  if (!auth.ok) {
    res.status(auth.status).json({ error: auth.error });
    return;
  }

  res.json({ status: 'ok', email: exportAdminEmail });
});

app.get('/api/admin/entries', async (req, res) => {
  const auth = isAuthorizedExportRequest(req);
  if (!auth.ok) {
    res.status(auth.status).json({ error: auth.error });
    return;
  }

  try {
    const entries = await getCurrentEntriesForAdmin();
    res.json({ entries });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unable to load wheel entries',
    });
  }
});

app.post('/api/admin/entries', async (req, res) => {
  const auth = isAuthorizedExportRequest(req);
  if (!auth.ok) {
    res.status(auth.status).json({ error: auth.error });
    return;
  }

  const label = String(req.body?.label || '').trim();
  if (!label) {
    res.status(400).json({ error: 'Entry label is required.' });
    return;
  }

  try {
    const entries = await getCurrentEntriesForAdmin();
    entries.push(label);
    const updatedEntries = await saveConfiguredEntries(entries);
    res.status(201).json({ entries: updatedEntries });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unable to add wheel entry',
    });
  }
});

app.delete('/api/admin/entries', async (req, res) => {
  const auth = isAuthorizedExportRequest(req);
  if (!auth.ok) {
    res.status(auth.status).json({ error: auth.error });
    return;
  }

  const index = Number(req.body?.index);
  if (!Number.isInteger(index) || index < 0) {
    res.status(400).json({ error: 'A valid entry index is required.' });
    return;
  }

  try {
    const entries = await getCurrentEntriesForAdmin();
    if (index >= entries.length) {
      res.status(404).json({ error: 'Wheel entry not found.' });
      return;
    }

    entries.splice(index, 1);
    const updatedEntries = await saveConfiguredEntries(entries);
    res.json({ entries: updatedEntries });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unable to remove wheel entry',
    });
  }
});

app.get('/api/participants/export', async (req, res) => {
  const auth = isAuthorizedExportRequest(req);
  if (!auth.ok) {
    res.status(auth.status).json({ error: auth.error });
    return;
  }

  const from = String(req.query.from || '').trim();
  const to = String(req.query.to || '').trim();
  const fromDate = parseDateOnly(from);
  const toDate = parseDateOnly(to);

  if (!fromDate || !toDate) {
    res.status(400).json({ error: 'Provide valid from/to dates in YYYY-MM-DD format.' });
    return;
  }

  if (fromDate.getTime() > toDate.getTime()) {
    res.status(400).json({ error: 'The from date must be before or equal to the to date.' });
    return;
  }

  try {
    const collection = await connectToMongo();
    const registrations = (await collection.find({}).sort({ _id: 1 }).toArray())
      .map(normalizeParticipant)
      .filter(Boolean);

    const toDateExclusive = new Date(toDate.getTime() + (24 * 60 * 60 * 1000));
    const filteredRegistrations = registrations.filter((participant) => {
      const submittedAt = new Date(participant.submittedAt);
      if (Number.isNaN(submittedAt.getTime())) {
        return false;
      }

      return submittedAt >= fromDate && submittedAt < toDateExclusive;
    });

    const rows = filteredRegistrations.map((participant) => ({
      'Full Name': participant.fullName,
      School: participant.school,
      Email: participant.email,
      'Registered At': participant.submittedAt,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrations');
    const output = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const filename = `spin-wheel-registrations-${from}-to-${to}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(output);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unable to export participants',
    });
  }
});

app.post('/api/participants', async (req, res) => {
  const { fullName, name, school, email } = req.body || {};
  const resolvedFullName = String(fullName || name || '').trim();

  if (!resolvedFullName || !school || !email) {
    res.status(400).json({ error: 'Full name, school, and email are required.' });
    return;
  }

  try {
    const collection = await connectToMongo();
    const participant = {
      id: randomUUID(),
      fullName: resolvedFullName,
      name: resolvedFullName,
      school: String(school).trim(),
      email: String(email).trim(),
      submittedAt: new Date().toISOString(),
    };

    await collection.insertOne(participant);
    res.status(201).json(participant);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unable to save participant',
    });
  }
});

app.use((_req, res) => {
  res.sendFile(path.join(staticDir, 'index.html'));
});

app.listen(port, () => {
  console.log(`Spin the wheel server listening on http://localhost:${port}`);
  console.log(`Using MongoDB database: ${databaseName} / collection: ${collectionName}`);
});
