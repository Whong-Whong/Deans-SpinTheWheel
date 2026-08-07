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
const spinResultsCollectionName = process.env.MONGODB_SPIN_RESULTS_COLLECTION || 'spin_wheel_results';
const spinCounterCollectionName = process.env.MONGODB_SPIN_COUNTER_COLLECTION || 'spin_daily_counters';
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
      await participantsCollection.createIndex({ emailNormalized: 1, submittedAt: 1 });
      await participantsCollection.createIndex(
        { playDate: 1, emailNormalized: 1 },
        {
          unique: true,
          partialFilterExpression: {
            playDate: { $exists: true },
            emailNormalized: { $exists: true },
          },
        },
      );
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

async function getSpinResultsCollection() {
  const database = await connectToDatabase();
  const collection = database.collection(spinResultsCollectionName);
  await collection.createIndex({ spunAt: 1 });
  await collection.createIndex({ winner: 1, spunAt: -1 });
  return collection;
}

async function getSpinCounterCollection() {
  const database = await connectToDatabase();
  const collection = database.collection(spinCounterCollectionName);
  await collection.createIndex({ dateKey: 1 }, { unique: true });
  return collection;
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getLocalDayWindow(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

function getLocalDayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeSpinResult(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const winner = String(payload.winner || '').trim();
  if (!winner) {
    return null;
  }

  const outcomeType = String(payload.outcomeType || 'win').trim().toLowerCase();
  const allowedOutcomeTypes = new Set(['win', 'loss', 'free-spin']);
  const normalizedOutcomeType = allowedOutcomeTypes.has(outcomeType) ? outcomeType : 'win';
  const player = payload.player && typeof payload.player === 'object' ? payload.player : {};
  const fullName = String(player.fullName || player.name || '').trim();
  const school = String(player.school || '').trim();
  const email = String(player.email || '').trim();
  const spunAtValue = String(payload.spunAt || '').trim();
  const spunAt = spunAtValue || new Date().toISOString();
  const spunAtDate = new Date(spunAt);
  const spinNumberValue = Number(payload.spinNumber);
  const spinNumber = Number.isInteger(spinNumberValue) && spinNumberValue > 0 ? spinNumberValue : null;
  const spinDateKey = String(payload.spinDateKey || '').trim();

  return {
    id: String(payload.id || randomUUID()),
    spinNumber,
    spinDateKey: spinDateKey || null,
    winner,
    outcomeType: normalizedOutcomeType,
    removedFromWheel: Boolean(payload.removedFromWheel),
    player: {
      fullName,
      school,
      email,
    },
    spunAt: Number.isNaN(spunAtDate.getTime()) ? new Date().toISOString() : spunAtDate.toISOString(),
  };
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

async function getPrizeConfigCollection() {
  const database = await connectToDatabase();
  return database.collection('prize_config');
}

async function getPrizeConfigurations() {
  const collection = await getPrizeConfigCollection();
  const configs = await collection.find({}).toArray();
  return configs.map((config) => ({
    prizeName: config.prizeName,
    maxWins: config.maxWins || 1,
    currentWins: config.currentWins || 0,
    isEternal: config.isEternal || false,
  }));
}

async function getPrizeConfig(prizeName) {
  const collection = await getPrizeConfigCollection();
  const config = await collection.findOne({ prizeName });
  if (!config) {
    return { prizeName, maxWins: 1, currentWins: 0, isEternal: false };
  }
  return {
    prizeName: config.prizeName,
    maxWins: config.maxWins || 1,
    currentWins: config.currentWins || 0,
    isEternal: config.isEternal || false,
  };
}

async function updatePrizeConfig(prizeName, maxWins, isEternal) {
  const collection = await getPrizeConfigCollection();
  const result = await collection.updateOne(
    { prizeName },
    {
      $set: {
        maxWins,
        isEternal: isEternal || false,
        updatedAt: new Date().toISOString(),
      },
      $setOnInsert: {
        currentWins: 0,
      },
    },
    { upsert: true },
  );
  return result;
}

async function incrementPrizeWinCount(prizeName) {
  const collection = await getPrizeConfigCollection();
  const result = await collection.updateOne(
    { prizeName },
    {
      $inc: { currentWins: 1 },
      $set: { updatedAt: new Date().toISOString() },
      $setOnInsert: { maxWins: 1 },
    },
    { upsert: true },
  );
  return result;
}

async function resetPrizeWinCounts() {
  const collection = await getPrizeConfigCollection();
  await collection.updateMany({}, { $set: { currentWins: 0 } });
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

app.put('/api/admin/entries', async (req, res) => {
  const auth = isAuthorizedExportRequest(req);
  if (!auth.ok) {
    res.status(auth.status).json({ error: auth.error });
    return;
  }

  const order = req.body?.order;
  if (!Array.isArray(order)) {
    res.status(400).json({ error: 'Order must be an array of entries.' });
    return;
  }

  try {
    const entries = await getCurrentEntriesForAdmin();
    
    // Validate that the order contains the same entries
    if (order.length !== entries.length || !order.every(e => entries.includes(e))) {
      res.status(400).json({ error: 'Invalid order: entries do not match.' });
      return;
    }

    const updatedEntries = await saveConfiguredEntries(order);
    res.json({ entries: updatedEntries });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unable to reorder wheel entries',
    });
  }
});

app.get('/api/admin/prize-config', async (req, res) => {
  const auth = isAuthorizedExportRequest(req);
  if (!auth.ok) {
    res.status(auth.status).json({ error: auth.error });
    return;
  }

  try {
    const prizeConfigs = await getPrizeConfigurations();
    res.json({ prizeConfigs });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unable to load prize configuration',
    });
  }
});

app.get('/api/prize-config', async (_req, res) => {
  try {
    const prizeConfigs = await getPrizeConfigurations();
    res.json({ prizeConfigs });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unable to load prize configuration',
    });
  }
});

app.post('/api/admin/prize-config', async (req, res) => {
  const auth = isAuthorizedExportRequest(req);
  if (!auth.ok) {
    res.status(auth.status).json({ error: auth.error });
    return;
  }

  const { prizeName, maxWins, isEternal } = req.body || {};
  if (!prizeName || typeof maxWins !== 'number' || maxWins < 1) {
    res.status(400).json({ error: 'Prize name and valid maxWins (≥1) are required.' });
    return;
  }

  try {
    await updatePrizeConfig(prizeName, maxWins, isEternal);
    const config = await getPrizeConfig(prizeName);
    res.json({ config });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unable to update prize configuration',
    });
  }
});

app.post('/api/admin/prize-win', async (req, res) => {
  const auth = isAuthorizedExportRequest(req);
  if (!auth.ok) {
    res.status(auth.status).json({ error: auth.error });
    return;
  }

  const { prizeName } = req.body || {};
  if (!prizeName) {
    res.status(400).json({ error: 'Prize name is required.' });
    return;
  }

  try {
    await incrementPrizeWinCount(prizeName);
    const config = await getPrizeConfig(prizeName);
    res.json({ config });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unable to record prize win',
    });
  }
});

app.post('/api/admin/reset-prize-wins', async (req, res) => {
  const auth = isAuthorizedExportRequest(req);
  if (!auth.ok) {
    res.status(auth.status).json({ error: auth.error });
    return;
  }

  try {
    await resetPrizeWinCounts();
    res.json({ status: 'ok', message: 'All prize win counts have been reset.' });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unable to reset prize wins',
    });
  }
});

app.post('/api/winners', async (req, res) => {
  const spinResult = normalizeSpinResult(req.body);
  if (!spinResult) {
    res.status(400).json({ error: 'Valid spin result payload is required.' });
    return;
  }

  try {
    const collection = await getSpinResultsCollection();
    await collection.insertOne(spinResult);
    res.status(201).json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unable to save spin result',
    });
  }
});

app.post('/api/spin-counter/next', async (_req, res) => {
  const now = new Date();
  const dateKey = getLocalDayKey(now);
  const timestamp = now.toISOString();

  try {
    const collection = await getSpinCounterCollection();
    const counter = await collection.findOneAndUpdate(
      { dateKey },
      {
        $inc: { count: 1 },
        $set: { updatedAt: timestamp },
        $setOnInsert: { dateKey, createdAt: timestamp },
      },
      { upsert: true, returnDocument: 'after' },
    );

    if (!counter || !Number.isInteger(counter.count) || counter.count < 1) {
      res.status(500).json({ error: 'Unable to reserve spin counter.' });
      return;
    }

    res.status(200).json({ spinNumber: counter.count, spinDateKey: dateKey });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unable to reserve spin counter',
    });
  }
});

app.post('/api/spin-counter-next', async (_req, res) => {
  const now = new Date();
  const dateKey = getLocalDayKey(now);
  const timestamp = now.toISOString();

  try {
    const collection = await getSpinCounterCollection();
    const counter = await collection.findOneAndUpdate(
      { dateKey },
      {
        $inc: { count: 1 },
        $set: { updatedAt: timestamp },
        $setOnInsert: { dateKey, createdAt: timestamp },
      },
      { upsert: true, returnDocument: 'after' },
    );

    if (!counter || !Number.isInteger(counter.count) || counter.count < 1) {
      res.status(500).json({ error: 'Unable to reserve spin counter.' });
      return;
    }

    res.status(200).json({ spinNumber: counter.count, spinDateKey: dateKey });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unable to reserve spin counter',
    });
  }
});

app.post('/api/spin-counter', async (_req, res) => {
  const now = new Date();
  const dateKey = getLocalDayKey(now);
  const timestamp = now.toISOString();

  try {
    const collection = await getSpinCounterCollection();
    const counter = await collection.findOneAndUpdate(
      { dateKey },
      {
        $inc: { count: 1 },
        $set: { updatedAt: timestamp },
        $setOnInsert: { dateKey, createdAt: timestamp },
      },
      { upsert: true, returnDocument: 'after' },
    );

    if (!counter || !Number.isInteger(counter.count) || counter.count < 1) {
      res.status(500).json({ error: 'Unable to reserve spin counter.' });
      return;
    }

    res.status(200).json({ spinNumber: counter.count, spinDateKey: dateKey });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unable to reserve spin counter',
    });
  }
});

app.get('/api/admin/winners', async (req, res) => {
  const auth = isAuthorizedExportRequest(req);
  if (!auth.ok) {
    res.status(auth.status).json({ error: auth.error });
    return;
  }

  try {
    const collection = await getSpinResultsCollection();
    const results = await collection.find({}).sort({ _id: -1 }).limit(500).toArray();
    res.json({ results });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unable to load spin results',
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
    const spinResultsCollection = await getSpinResultsCollection();
    const registrations = (await collection.find({}).sort({ _id: 1 }).toArray())
      .map(normalizeParticipant)
      .filter(Boolean);
    const spinResults = await spinResultsCollection.find({}).sort({ _id: 1 }).toArray();

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
    const filteredSpinResults = spinResults.filter((result) => {
      const spunAt = new Date(result.spunAt);
      if (Number.isNaN(spunAt.getTime())) {
        return false;
      }

      return spunAt >= fromDate && spunAt < toDateExclusive;
    });
    const spinResultRows = filteredSpinResults.map((result) => ({
      'Full Name': result.player?.fullName || '',
      School: result.player?.school || '',
      Email: result.player?.email || '',
      Result: result.winner || '',
      'Outcome Type': result.outcomeType || 'win',
      'Removed From Wheel': result.removedFromWheel ? 'Yes' : 'No',
      'Spun At': result.spunAt || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrations');
    const spinWorksheet = XLSX.utils.json_to_sheet(spinResultRows);
    XLSX.utils.book_append_sheet(workbook, spinWorksheet, 'Spin Results');
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
  const resolvedSchool = String(school || '').trim();
  const resolvedEmail = String(email || '').trim();
  const normalizedEmail = resolvedEmail.toLowerCase();

  if (!resolvedFullName || !resolvedSchool || !resolvedEmail) {
    res.status(400).json({ error: 'Full name, school, and email are required.' });
    return;
  }

  try {
    const collection = await connectToMongo();
    const { startIso, endIso } = getLocalDayWindow();
    const duplicateToday = await collection.findOne({
      submittedAt: { $gte: startIso, $lt: endIso },
      $or: [
        { emailNormalized: normalizedEmail },
        { email: { $regex: `^${escapeRegExp(resolvedEmail)}$`, $options: 'i' } },
      ],
    });
    if (duplicateToday) {
      res.status(409).json({ error: 'This email has already played today. Please try again tomorrow.' });
      return;
    }

    const participant = {
      id: randomUUID(),
      fullName: resolvedFullName,
      name: resolvedFullName,
      school: resolvedSchool,
      email: resolvedEmail,
      emailNormalized: normalizedEmail,
      playDate: getLocalDayKey(),
      submittedAt: new Date().toISOString(),
    };

    await collection.insertOne(participant);
    res.status(201).json(normalizeParticipant(participant));
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 11000) {
      res.status(409).json({ error: 'This email has already played today. Please try again tomorrow.' });
      return;
    }
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
