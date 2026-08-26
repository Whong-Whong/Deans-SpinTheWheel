import { MongoClient } from 'mongodb';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const projectRoot = path.join(currentDir, '..', '..');

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const databaseName = process.env.MONGODB_DB || 'SpinTheWheel';
const collectionName = process.env.MONGODB_COLLECTION || 'spin_the_wheel_entries';
const spinCounterCollectionName = process.env.MONGODB_SPIN_COUNTER_COLLECTION || 'spin_daily_counters';
const entriesConfigCollectionName = process.env.MONGODB_ENTRIES_COLLECTION || 'spin_the_wheel_config';
const spinResultsCollectionName = process.env.MONGODB_SPIN_RESULTS_COLLECTION || 'spin_wheel_results';
const entriesConfigDocumentId = 'wheel_entries';
const exportAdminEmail = String(process.env.EXPORT_ADMIN_EMAIL || 'katapills@gmail.com').trim().toLowerCase();
const exportAccessKey = String(process.env.EXPORT_ACCESS_KEY || 'Admin2468!').trim();

let mongoClient;
let mongoDatabase;
let participantsCollection;
let mongoConnectPromise;

export async function connectToMongo() {
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

export async function connectToDatabase() {
  await connectToMongo();
  return mongoDatabase;
}

export function normalizeEntryLabel(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeParticipant(participant) {
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

export function parseDateOnly(value) {
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

export function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function getLocalDayWindow(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

export function getLocalDayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function normalizeDateKey(value) {
  const dateKey = String(value || '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(dateKey) ? dateKey : '';
}

export function normalizeEntryList(entries) {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .map((entry) => String(entry).trim())
    .filter(Boolean);
}

export async function loadDefaultEntriesFromFile() {
  const candidates = [
    path.join(projectRoot, 'public', 'entries.json'),
    path.join(projectRoot, 'dist', 'entries.json'),
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

export async function getManagedEntriesCollection() {
  const database = await connectToDatabase();
  return database.collection(entriesConfigCollectionName);
}

export async function getSpinCounterCollection() {
  const database = await connectToDatabase();
  const collection = database.collection(spinCounterCollectionName);
  await collection.createIndex({ dateKey: 1 }, { unique: true });
  return collection;
}

export async function getSpinResultsCollection() {
  const database = await connectToDatabase();
  const collection = database.collection(spinResultsCollectionName);
  await collection.createIndex({ spunAt: 1 });
  await collection.createIndex({ winner: 1, spunAt: -1 });
  return collection;
}

export async function getConfiguredEntries() {
  const collection = await getManagedEntriesCollection();
  const config = await collection.findOne({ _id: entriesConfigDocumentId });
  return normalizeEntryList(config?.entries);
}

export async function getConfiguredLossMessages() {
  const collection = await getManagedEntriesCollection();
  const config = await collection.findOne({ _id: entriesConfigDocumentId });
  return normalizeLossMessages(config?.lossMessages || config?.messages || {});
}

export async function getConfiguredLossTypes() {
  const collection = await getManagedEntriesCollection();
  const config = await collection.findOne({ _id: entriesConfigDocumentId });
  return normalizeLossTypes(config?.lossTypes || config?.types || {});
}

export function normalizeLossMessages(messages) {
  if (!messages || typeof messages !== 'object' || Array.isArray(messages)) {
    return {};
  }

  const normalized = {};
  Object.entries(messages).forEach(([label, message]) => {
    const normalizedLabel = normalizeEntryLabel(label);
    const cleanedMessage = String(message || '').trim();
    if (!normalizedLabel || !cleanedMessage) {
      return;
    }

    normalized[normalizedLabel] = cleanedMessage;
  });

  return normalized;
}

export function normalizeLossTypes(types) {
  if (!types || typeof types !== 'object' || Array.isArray(types)) {
    return {};
  }

  const normalized = {};
  Object.entries(types).forEach(([label, type]) => {
    const normalizedLabel = normalizeEntryLabel(label);
    const cleanedType = String(type || '').trim().toLowerCase();
    if (!normalizedLabel || (cleanedType !== 'loss' && cleanedType !== 'free-spin')) {
      return;
    }

    normalized[normalizedLabel] = cleanedType;
  });

  return normalized;
}

export async function getCurrentEntriesForAdmin() {
  const configuredEntries = await getConfiguredEntries();
  if (configuredEntries.length > 0) {
    return configuredEntries;
  }

  return loadDefaultEntriesFromFile();
}

export async function saveConfiguredEntries(entries, lossMessages, lossTypes) {
  const collection = await getManagedEntriesCollection();
  const normalizedEntries = normalizeEntryList(entries);
  const update = {
    $set: {
      entries: normalizedEntries,
      updatedAt: new Date().toISOString(),
    },
  };

  if (lossMessages !== undefined) {
    update.$set.lossMessages = normalizeLossMessages(lossMessages);
  }

  if (lossTypes !== undefined) {
    update.$set.lossTypes = normalizeLossTypes(lossTypes);
  }

  await collection.updateOne({ _id: entriesConfigDocumentId }, update, { upsert: true });

  return normalizedEntries;
}

export async function getPrizeConfigCollection() {
  const database = await connectToDatabase();
  return database.collection('prize_config');
}

export async function getPrizeConfigurations() {
  const collection = await getPrizeConfigCollection();
  const configs = await collection.find({
    prizeName: { $exists: true, $type: 'string' },
  }).toArray();

  const latestByLabel = new Map();
  configs.forEach((config) => {
    const normalizedLabel = normalizeEntryLabel(config.prizeName);
    if (!normalizedLabel) {
      return;
    }

    const existing = latestByLabel.get(normalizedLabel);
    const currentTime = Date.parse(String(config.updatedAt || '')) || 0;
    const existingTime = existing ? Date.parse(String(existing.updatedAt || '')) || 0 : -1;
    if (!existing || currentTime >= existingTime) {
      latestByLabel.set(normalizedLabel, config);
    }
  });

  return [...latestByLabel.values()].map((config) => ({
    prizeName: config.prizeName,
    maxWins: config.maxWins || 1,
    currentWins: config.currentWins || 0,
    isEternal: config.isEternal || false,
    isDisabled: config.isDisabled || false,
    lossMessage: config.lossMessage || '',
    lossType: config.lossType || '',
  }));
}

export function normalizeMilestoneSpinSchedule(rawSchedule) {
  if (!rawSchedule || typeof rawSchedule !== 'object') {
    return {};
  }

  const normalized = {};
  Object.entries(rawSchedule).forEach(([spinNumber, prizeName]) => {
    const numericSpinNumber = Number(spinNumber);
    const cleanedPrizeName = String(prizeName || '').trim();
    if (!Number.isInteger(numericSpinNumber) || numericSpinNumber <= 0 || !cleanedPrizeName) {
      return;
    }
    normalized[String(numericSpinNumber)] = cleanedPrizeName;
  });

  return normalized;
}

export async function getMilestoneSpinSchedule() {
  const collection = await getPrizeConfigCollection();
  const config = await collection.findOne({ _id: '__milestone_spin_schedule__' });
  return normalizeMilestoneSpinSchedule(config?.milestoneSpinSchedule || config?.schedule || {});
}

export async function updateMilestoneSpinSchedule(schedule) {
  const collection = await getPrizeConfigCollection();
  const normalizedSchedule = normalizeMilestoneSpinSchedule(schedule);
  await collection.updateOne(
    { _id: '__milestone_spin_schedule__' },
    {
      $set: {
        milestoneSpinSchedule: normalizedSchedule,
        updatedAt: new Date().toISOString(),
      },
    },
    { upsert: true },
  );
  return normalizedSchedule;
}

export function normalizeRegularPrizeNames(prizes) {
  if (!Array.isArray(prizes)) {
    return [];
  }

  return [...new Set(
    prizes
      .map((prize) => String(prize || '').trim())
      .filter(Boolean),
  )];
}

export async function getRegularPrizeNames() {
  const collection = await getPrizeConfigCollection();
  const config = await collection.findOne({ _id: '__regular_spin_prizes__' });
  return normalizeRegularPrizeNames(config?.regularPrizeNames || config?.prizes || []);
}

export async function updateRegularPrizeNames(prizes) {
  const collection = await getPrizeConfigCollection();
  const normalizedNames = normalizeRegularPrizeNames(prizes);
  await collection.updateOne(
    { _id: '__regular_spin_prizes__' },
    {
      $set: {
        regularPrizeNames: normalizedNames,
        updatedAt: new Date().toISOString(),
      },
    },
    { upsert: true },
  );
  return normalizedNames;
}

export function normalizeSpinResult(payload) {
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

export async function handleRecordSpinResult(req, res) {
  let body;

  try {
    body = await readJsonBody(req);
  } catch {
    res.status(400).json({ error: 'Request body must be valid JSON.' });
    return;
  }

  const spinResult = normalizeSpinResult(body);
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
}

export async function updatePrizeConfig(prizeName, maxWins, isEternal, isDisabled) {
  const collection = await getPrizeConfigCollection();
  const normalizedPrizeName = normalizeEntryLabel(prizeName);
  const matchingConfigs = (await collection.find({
    prizeName: { $exists: true, $type: 'string' },
  }).toArray()).filter((config) => normalizeEntryLabel(config.prizeName) === normalizedPrizeName);

  const timestamp = new Date().toISOString();
  const update = {
    $set: {
      prizeName,
      maxWins,
      isEternal: isEternal || false,
      isDisabled: isDisabled || false,
      updatedAt: timestamp,
    },
    $setOnInsert: {
      currentWins: 0,
    },
  };

  if (matchingConfigs.length === 0) {
    return collection.updateOne({ prizeName }, update, { upsert: true });
  }

  const [primary, ...duplicates] = matchingConfigs.sort((left, right) => {
    const leftTime = Date.parse(String(left.updatedAt || '')) || 0;
    const rightTime = Date.parse(String(right.updatedAt || '')) || 0;
    return rightTime - leftTime;
  });

  const result = await collection.updateOne({ _id: primary._id }, update);
  if (duplicates.length > 0) {
    await collection.deleteMany({ _id: { $in: duplicates.map((config) => config._id) } });
  }
  return result;
}

export async function getPrizeConfig(prizeName) {
  const collection = await getPrizeConfigCollection();
  const normalizedPrizeName = normalizeEntryLabel(prizeName);
  const matchingConfigs = (await collection.find({
    prizeName: { $exists: true, $type: 'string' },
  }).toArray()).filter((config) => normalizeEntryLabel(config.prizeName) === normalizedPrizeName);
  const config = matchingConfigs.sort((left, right) => {
    const leftTime = Date.parse(String(left.updatedAt || '')) || 0;
    const rightTime = Date.parse(String(right.updatedAt || '')) || 0;
    return rightTime - leftTime;
  })[0];
  if (!config) {
    return { prizeName, maxWins: 1, currentWins: 0, isEternal: false };
  }
  return {
    prizeName: config.prizeName,
    maxWins: config.maxWins || 1,
    currentWins: config.currentWins || 0,
    isEternal: config.isEternal || false,
    isDisabled: config.isDisabled || false,
    lossMessage: config.lossMessage || '',
    lossType: config.lossType || '',
  };
}

export async function incrementPrizeWinCount(prizeName) {
  const collection = await getPrizeConfigCollection();
  const normalizedPrizeName = normalizeEntryLabel(prizeName);
  const matchingConfigs = (await collection.find({
    prizeName: { $exists: true, $type: 'string' },
  }).toArray()).filter((config) => normalizeEntryLabel(config.prizeName) === normalizedPrizeName);
  const timestamp = new Date().toISOString();
  const update = {
    $inc: { currentWins: 1 },
    $set: { updatedAt: timestamp },
    $setOnInsert: { maxWins: 1 },
  };

  if (matchingConfigs.length === 0) {
    return collection.updateOne({ prizeName }, update, { upsert: true });
  }

  const [primary, ...duplicates] = matchingConfigs.sort((left, right) => {
    const leftTime = Date.parse(String(left.updatedAt || '')) || 0;
    const rightTime = Date.parse(String(right.updatedAt || '')) || 0;
    return rightTime - leftTime;
  });

  const result = await collection.updateOne(
    { _id: primary._id },
    {
      ...update,
      $set: {
        ...update.$set,
        prizeName,
      },
    },
  );

  if (duplicates.length > 0) {
    await collection.deleteMany({ _id: { $in: duplicates.map((config) => config._id) } });
  }

  return result;
}

export async function resetPrizeWinCounts() {
  const collection = await getPrizeConfigCollection();
  await collection.updateMany({}, { $set: { currentWins: 0 } });
}

export function getHeader(req, name) {
  const headerName = name.toLowerCase();
  const headers = req.headers || {};
  const exactValue = headers[headerName];

  if (Array.isArray(exactValue)) {
    return exactValue[0];
  }

  if (typeof exactValue === 'string') {
    return exactValue;
  }

  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() !== headerName) {
      continue;
    }

    if (Array.isArray(value)) {
      return value[0];
    }

    if (typeof value === 'string') {
      return value;
    }
  }

  return '';
}

export function isAuthorizedExportRequest(req) {
  const requestEmail = String(getHeader(req, 'X-Admin-Email') || '').trim().toLowerCase();
  const requestKey = String(getHeader(req, 'X-Export-Key') || '').trim();

  if (!exportAccessKey) {
    return { ok: false, status: 503, error: 'Export access is not configured on the server.' };
  }

  if (requestEmail !== exportAdminEmail || requestKey !== exportAccessKey) {
    return { ok: false, status: 403, error: 'You are not allowed to download registrations.' };
  }

  return { ok: true };
}

export function isAuthorizedAdminLogin(email, accessKey) {
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

export async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }

  if (typeof req.body === 'string') {
    return req.body ? JSON.parse(req.body) : {};
  }

  const chunks = [];

  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  const bodyText = Buffer.concat(chunks).toString('utf8').trim();
  return bodyText ? JSON.parse(bodyText) : {};
}

export function getRequestUrl(req) {
  const host = getHeader(req, 'host') || 'localhost';
  return new URL(req.url || '/', `http://${host}`);
}

export function sendMethodNotAllowed(res, methods) {
  res.setHeader('Allow', methods.join(', '));
  res.status(405).json({ error: `Method ${res.req?.method || 'UNKNOWN'} Not Allowed` });
}

export async function handleHealth(_req, res) {
  try {
    const collection = await connectToMongo();
    res.status(200).json({
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
}

export async function handleGetParticipants(_req, res) {
  try {
    const collection = await connectToMongo();
    const participants = await collection.find({}).sort({ _id: 1 }).toArray();
    res.status(200).json(participants.map(normalizeParticipant).filter(Boolean));
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unable to load participants',
    });
  }
}

export async function handleReserveNextSpinCounter(_req, res) {
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
}

export async function readDailySpinCounter(dateKey) {
  const collection = await getSpinCounterCollection();
  const counter = await collection.findOne({ dateKey });
  const countValue = Number(counter?.count);
  const spinNumber = Number.isInteger(countValue) && countValue >= 0 ? countValue : 0;
  return { spinDateKey: dateKey, spinNumber, exists: Boolean(counter) };
}

export async function handleGetAdminSpinCounter(req, res) {
  const auth = isAuthorizedExportRequest(req);
  if (!auth.ok) {
    res.status(auth.status).json({ error: auth.error });
    return;
  }

  const requestUrl = getRequestUrl(req);
  const dateKeyFromQuery = normalizeDateKey(requestUrl.searchParams.get('dateKey'));
  const dateKey = dateKeyFromQuery || getLocalDayKey(new Date());

  try {
    const counter = await readDailySpinCounter(dateKey);
    res.status(200).json(counter);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unable to load spin counter',
    });
  }
}

export async function handleSetAdminSpinCounter(req, res) {
  const auth = isAuthorizedExportRequest(req);
  if (!auth.ok) {
    res.status(auth.status).json({ error: auth.error });
    return;
  }

  let body;

  try {
    body = await readJsonBody(req);
  } catch {
    res.status(400).json({ error: 'Request body must be valid JSON.' });
    return;
  }

  const requestedDateKey = normalizeDateKey(body?.dateKey);
  const dateKey = requestedDateKey || getLocalDayKey(new Date());
  const spinNumber = Number(body?.spinNumber);
  if (!Number.isInteger(spinNumber) || spinNumber < 0) {
    res.status(400).json({ error: 'spinNumber must be an integer greater than or equal to 0.' });
    return;
  }

  try {
    const timestamp = new Date().toISOString();
    const collection = await getSpinCounterCollection();
    await collection.updateOne(
      { dateKey },
      {
        $set: { count: spinNumber, updatedAt: timestamp },
        $setOnInsert: { dateKey, createdAt: timestamp },
      },
      { upsert: true },
    );

    res.status(200).json({ spinDateKey: dateKey, spinNumber, exists: true });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unable to update spin counter',
    });
  }
}

export async function handleCreateParticipant(req, res) {
  let body;

  try {
    body = await readJsonBody(req);
  } catch {
    res.status(400).json({ error: 'Request body must be valid JSON.' });
    return;
  }

  const { fullName, name, school, email } = body || {};
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
    res.status(201).json(participant);
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 11000) {
      res.status(409).json({ error: 'This email has already played today. Please try again tomorrow.' });
      return;
    }
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unable to save participant',
    });
  }
}

export async function handleGetEntries(_req, res) {
  try {
    const configuredEntries = await getConfiguredEntries();
    const lossMessages = await getConfiguredLossMessages();
    const lossTypes = await getConfiguredLossTypes();
    if (configuredEntries.length > 0) {
      res.status(200).json({ entries: configuredEntries, lossMessages, lossTypes, source: 'admin' });
      return;
    }

    const defaultEntries = await loadDefaultEntriesFromFile();
    res.status(200).json({ entries: defaultEntries, lossMessages: {}, lossTypes: {}, source: 'default' });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unable to load wheel entries',
    });
  }
}

export async function handleAdminLogin(req, res) {
  let body;

  try {
    body = await readJsonBody(req);
  } catch {
    res.status(400).json({ error: 'Request body must be valid JSON.' });
    return;
  }

  const { email, accessKey } = body || {};
  const auth = isAuthorizedAdminLogin(email, accessKey);
  if (!auth.ok) {
    res.status(auth.status).json({ error: auth.error });
    return;
  }

  res.status(200).json({ status: 'ok', email: exportAdminEmail });
}

export async function handleGetAdminEntries(req, res) {
  const auth = isAuthorizedExportRequest(req);
  if (!auth.ok) {
    res.status(auth.status).json({ error: auth.error });
    return;
  }

  try {
    const entries = await getCurrentEntriesForAdmin();
    const lossMessages = await getConfiguredLossMessages();
    const lossTypes = await getConfiguredLossTypes();
    res.status(200).json({ entries, lossMessages, lossTypes });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unable to load wheel entries',
    });
  }
}

export async function handleAddAdminEntry(req, res) {
  const auth = isAuthorizedExportRequest(req);
  if (!auth.ok) {
    res.status(auth.status).json({ error: auth.error });
    return;
  }

  let body;

  try {
    body = await readJsonBody(req);
  } catch {
    res.status(400).json({ error: 'Request body must be valid JSON.' });
    return;
  }

  const label = String(body?.label || '').trim();
  const message = String(body?.message || '').trim();
  const lossType = String(body?.lossType || 'loss').trim().toLowerCase();
  if (!label) {
    res.status(400).json({ error: 'Entry label is required.' });
    return;
  }

  try {
    const entries = await getCurrentEntriesForAdmin();
    const lossMessages = await getConfiguredLossMessages();
    const lossTypes = await getConfiguredLossTypes();
    const normalizedLabel = normalizeEntryLabel(label);
    const existingIndex = entries.findIndex((entry) => normalizeEntryLabel(entry) === normalizedLabel);
    if (existingIndex < 0) {
      entries.push(label);
    }
    const nextLossMessages = { ...lossMessages };
    const nextLossTypes = { ...lossTypes };
    if (message) {
      nextLossMessages[normalizedLabel] = message;
    }
    nextLossTypes[normalizedLabel] = lossType === 'free-spin' ? 'free-spin' : 'loss';
    const updatedEntries = await saveConfiguredEntries(entries, nextLossMessages, nextLossTypes);
    res.status(existingIndex < 0 ? 201 : 200).json({
      entries: updatedEntries,
      lossMessages: nextLossMessages,
      lossTypes: nextLossTypes,
      action: existingIndex < 0 ? 'created' : 'updated',
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unable to add wheel entry',
    });
  }
}

export async function handleDeleteAdminEntry(req, res) {
  const auth = isAuthorizedExportRequest(req);
  if (!auth.ok) {
    res.status(auth.status).json({ error: auth.error });
    return;
  }

  let body;

  try {
    body = await readJsonBody(req);
  } catch {
    res.status(400).json({ error: 'Request body must be valid JSON.' });
    return;
  }

  const index = Number(body?.index);
  if (!Number.isInteger(index) || index < 0) {
    res.status(400).json({ error: 'A valid entry index is required.' });
    return;
  }

  try {
    const entries = await getCurrentEntriesForAdmin();
    const lossMessages = await getConfiguredLossMessages();
    const lossTypes = await getConfiguredLossTypes();
    if (index >= entries.length) {
      res.status(404).json({ error: 'Wheel entry not found.' });
      return;
    }

    const removedEntry = entries[index];
    const normalizedRemovedEntry = normalizeEntryLabel(removedEntry);
    entries.splice(index, 1);
    const nextLossMessages = { ...lossMessages };
    const nextLossTypes = { ...lossTypes };
    delete nextLossMessages[normalizedRemovedEntry];
    delete nextLossTypes[normalizedRemovedEntry];
    const updatedEntries = await saveConfiguredEntries(entries, nextLossMessages, nextLossTypes);
    res.status(200).json({ entries: updatedEntries, lossMessages: nextLossMessages, lossTypes: nextLossTypes });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unable to remove wheel entry',
    });
  }
}

export async function handleReorderAdminEntries(req, res) {
  const auth = isAuthorizedExportRequest(req);
  if (!auth.ok) {
    res.status(auth.status).json({ error: auth.error });
    return;
  }

  let body;

  try {
    body = await readJsonBody(req);
  } catch {
    res.status(400).json({ error: 'Request body must be valid JSON.' });
    return;
  }

  const order = body?.order;
  if (!Array.isArray(order)) {
    res.status(400).json({ error: 'Order must be an array of entries.' });
    return;
  }

  try {
    const entries = await getCurrentEntriesForAdmin();
    const lossMessages = await getConfiguredLossMessages();
    const lossTypes = await getConfiguredLossTypes();
     
    // Validate that the order contains the same entries
    if (order.length !== entries.length || !order.every(e => entries.includes(e))) {
      res.status(400).json({ error: 'Invalid order: entries do not match.' });
      return;
    }

    const updatedEntries = await saveConfiguredEntries(order, lossMessages, lossTypes);
    res.status(200).json({ entries: updatedEntries, lossMessages, lossTypes });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unable to reorder wheel entries',
    });
  }
}

export async function handleParticipantsExport(req, res) {
  const auth = isAuthorizedExportRequest(req);
  if (!auth.ok) {
    res.status(auth.status).json({ error: auth.error });
    return;
  }

  const requestUrl = getRequestUrl(req);
  const from = String(requestUrl.searchParams.get('from') || '').trim();
  const to = String(requestUrl.searchParams.get('to') || '').trim();
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
    res.status(200).send(output);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unable to export participants',
    });
  }
}
