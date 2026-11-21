import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const testDatabaseName = `catalogue-${randomUUID()}.db`;
const testDatabasePath = path.join(serverRoot, 'prisma', testDatabaseName);
const testDatabaseUrl = `file:./${testDatabaseName}`;
const testJwtSecret = 'sunflow-catalogue-bom-quotes-integration-secret';
const testEnv = {
  ...process.env,
  DATABASE_URL: testDatabaseUrl,
  JWT_SECRET: testJwtSecret,
  PORT: '4000',
  CORS_ORIGINS: 'http://localhost:5173',
};
let app;
let prisma;
let server;
let baseUrl;

function runNodeScript(scriptPath, args = []) {
  execFileSync(process.execPath, [scriptPath, ...args], { cwd: serverRoot, env: testEnv, stdio: 'pipe' });
}

before(async () => {
  process.env.DATABASE_URL = testDatabaseUrl;
  process.env.JWT_SECRET = testJwtSecret;
  process.env.PORT = '4000';
  process.env.CORS_ORIGINS = 'http://localhost:5173';
  runNodeScript('scripts/prepare-sqlite.js');
  runNodeScript('node_modules/prisma/build/index.js', ['migrate', 'deploy']);
  runNodeScript('prisma/seed.js');
  ({ default: app } = await import('../src/app.js'));
  ({ prisma } = await import('../src/config/database.js'));
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server?.listening) {
    await new Promise((resolve) => server.close(resolve));
    server.closeAllConnections();
  }
  if (prisma) await prisma.$disconnect();
  await rm(testDatabasePath, { force: true });
  await rm(`${testDatabasePath}-journal`, { force: true });
});

async function request(pathname, { method = 'GET', token, body } = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, body: await response.json() };
}

async function getToken(email) {
  const result = await request('/api/auth/login', {
    method: 'POST', body: { email, password: 'demo1234' },
  });
  assert.equal(result.status, 200);
  return result.body.data.token;
}

async function createApprovedLead(salesToken, suffix) {
  const lead = await request('/api/leads', {
    method: 'POST', token: salesToken,
    body: {
      customerName: `Quote Customer ${suffix}`,
      customerPhone: `97${Date.now().toString().slice(-7)}${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`,
      customerAddress: '1 Demo Road',
      requestedCapacityKw: 1.25,
      systemTypeInterest: 'ON_GRID',
      subsidyInterest: false,
    },
  });
  assert.equal(lead.status, 201);
  const survey = await request(`/api/leads/${lead.body.data.lead.id}/surveys`, {
    method: 'POST', token: salesToken,
    body: { roofDirection: 'South', roofTiltDegrees: 10, cableDistanceMeters: 5 },
  });
  assert.equal(survey.status, 201);
  const approved = await request(`/api/surveys/${survey.body.data.id}/approve`, { method: 'POST', token: salesToken });
  assert.equal(approved.status, 200);
  return lead.body.data.lead.id;
}

test('Product catalogue, inventory, BOM, and quotation workflows', async (t) => {
  await t.test('keeps the health endpoint public and connected', async () => {
    const response = await request('/api/health');
    assert.equal(response.status, 200);
    assert.equal(response.body.data.status, 'ok');
    assert.equal(response.body.data.database, 'connected');
  });

  const adminToken = await getToken('admin@sunpower.demo');
  const warehouseToken = await getToken('raghav@sunpower.demo');
  const salesToken = await getToken('priya@sunpower.demo');

  await t.test('enforces auth and product catalogue roles', async () => {
    const noToken = await request('/api/products');
    const forbidden = await request('/api/products', {
      method: 'POST', token: salesToken,
      body: { sku: 'DENIED', name: 'Denied', category: 'PANEL', isSerialized: false, unitPrice: '1.00', unit: 'piece' },
    });
    assert.equal(noToken.status, 401);
    assert.equal(forbidden.status, 403);
  });

  const suffix = randomUUID().slice(0, 8).toUpperCase();
  const panel = await request('/api/products', {
    method: 'POST', token: adminToken,
    body: { sku: `PANEL-${suffix}`, name: 'Sample panel', category: 'PANEL', isSerialized: false, unitPrice: '10.50', unit: 'piece', warrantyMonths: 12 },
  });
  const connector = await request('/api/products', {
    method: 'POST', token: warehouseToken,
    body: { sku: `CONN-${suffix}`, name: 'Sample connector', category: 'CONNECTOR', isSerialized: false, unitPrice: '2.00', unit: 'piece' },
  });
  assert.equal(panel.status, 201);
  assert.equal(panel.body.data.unitPrice, '10.50');
  assert.equal(connector.status, 201);

  await t.test('creates inventory only for non-serialized products and rejects invalid product data', async () => {
    const serialized = await request('/api/products', {
      method: 'POST', token: adminToken,
      body: { sku: `INV-${suffix}`, name: 'Sample inverter', category: 'INVERTER', isSerialized: true, unitPrice: '15.00', unit: 'piece', warrantyMonths: 24 },
    });
    const invalidPrice = await request('/api/products', {
      method: 'POST', token: adminToken,
      body: { sku: `BAD-${suffix}`, name: 'Bad price', category: 'PANEL', isSerialized: false, unitPrice: '-5.00', unit: 'piece' },
    });
    const serializedInventory = await prisma.inventory.findUnique({ where: { productId: serialized.body.data.id } });
    assert.equal(serialized.status, 201);
    assert.equal(serializedInventory, null);
    assert.equal(invalidPrice.status, 400);
  });

  await t.test('records stock movements atomically and prevents negative inventory', async () => {
    const deniedInventory = await request('/api/inventory', { token: salesToken });
    const inbound = await request(`/api/inventory/${panel.body.data.id}/adjust`, {
      method: 'POST', token: warehouseToken,
      body: { type: 'INBOUND', quantity: 5, referenceType: 'GOODS_RECEIPT', notes: 'PO-TEST-1' },
    });
    const tooMuch = await request(`/api/inventory/${panel.body.data.id}/adjust`, {
      method: 'POST', token: warehouseToken,
      body: { type: 'OUTBOUND', quantity: 6, referenceType: 'CORRECTION' },
    });
    const adjustmentTooMuch = await request(`/api/inventory/${panel.body.data.id}/adjust`, {
      method: 'POST', token: warehouseToken,
      body: { type: 'ADJUSTMENT', quantity: 6, referenceType: 'ADJUSTMENT' },
    });
    const inventory = await prisma.inventory.findUnique({ where: { productId: panel.body.data.id } });
    const movements = await prisma.stockMovement.findMany({ where: { productId: panel.body.data.id } });
    assert.equal(deniedInventory.status, 403);
    assert.equal(inbound.status, 200);
    assert.equal(inbound.body.data.inventory.quantityOnHand, 5);
    assert.equal(inbound.body.data.stockMovement.notes, 'PO-TEST-1');
    assert.equal(tooMuch.status, 422);
    assert.equal(adjustmentTooMuch.status, 422);
    assert.equal(inventory.quantityOnHand, 5);
    assert.equal(movements.length, 1);
  });

  await t.test('validates BOM quantity rules, rejects overlapping ranges, and expands deterministically', async () => {
    const invalidItem = await request('/api/bom-templates', {
      method: 'POST', token: adminToken,
      body: {
        name: 'Invalid template', systemType: 'ON_GRID', minCapacityKw: 1, maxCapacityKw: 2,
        items: [{ productId: panel.body.data.id, quantityPerKw: 2, quantityFixed: 1 }],
      },
    });
    const created = await request('/api/bom-templates', {
      method: 'POST', token: adminToken,
      body: {
        name: `On-grid ${suffix}`, systemType: 'ON_GRID', minCapacityKw: 1, maxCapacityKw: 2,
        items: [
          { productId: panel.body.data.id, quantityPerKw: 2 },
          { productId: connector.body.data.id, quantityFixed: 1 },
        ],
      },
    });
    const overlap = await request('/api/bom-templates', {
      method: 'POST', token: adminToken,
      body: {
        name: 'Overlapping template', systemType: 'ON_GRID', minCapacityKw: 1.5, maxCapacityKw: 2.5,
        items: [{ productId: panel.body.data.id, quantityFixed: 1 }],
      },
    });
    const resolved = await request('/api/bom-templates/resolve', {
      method: 'POST', token: salesToken, body: { systemType: 'ON_GRID', capacityKw: 1.25 },
    });
    const missing = await request('/api/bom-templates/resolve', {
      method: 'POST', token: salesToken, body: { systemType: 'OFF_GRID', capacityKw: 1.25 },
    });
    assert.equal(invalidItem.status, 400);
    assert.equal(created.status, 201);
    assert.equal(overlap.status, 409);
    assert.equal(resolved.status, 200);
    assert.deepEqual(resolved.body.data.items.map((item) => item.quantity), [3, 1]);
    assert.equal(resolved.body.data.items[0].lineTotal, '31.50');
    assert.equal(resolved.body.data.subtotal, '33.50');
    assert.equal(missing.status, 404);
  });

  await t.test('blocks quotes before survey approval, snapshots prices, and accepts exactly once', async () => {
    const unapprovedLead = await request('/api/leads', {
      method: 'POST', token: salesToken,
      body: {
        customerName: 'Unapproved customer', customerPhone: `98${Date.now().toString().slice(-8)}`,
        customerAddress: '2 Demo Road', requestedCapacityKw: 1.25, systemTypeInterest: 'ON_GRID', subsidyInterest: false,
      },
    });
    const blockedQuote = await request(`/api/leads/${unapprovedLead.body.data.lead.id}/quotes`, {
      method: 'POST', token: salesToken,
      body: { systemType: 'ON_GRID', capacityKw: 1.25, discount: '1.00', tax: '0.50' },
    });
    assert.equal(blockedQuote.status, 409);

    const leadId = await createApprovedLead(salesToken, 'Q');
    const quoteResponse = await request(`/api/leads/${leadId}/quotes`, {
      method: 'POST', token: salesToken,
      body: { systemType: 'ON_GRID', capacityKw: 1.25, discount: '1.00', tax: '0.50', validUntil: '2026-12-15' },
    });
    assert.equal(quoteResponse.status, 201);
    assert.equal(quoteResponse.body.data.subtotal, '33.50');
    assert.equal(quoteResponse.body.data.total, '33.00');
    assert.equal(quoteResponse.body.data.items[0].unitPriceAtQuote, '10.50');

    const createdAt = quoteResponse.body.data.createdAt;
    const adjusted = await request(`/api/quotes/${quoteResponse.body.data.id}/items`, {
      method: 'PATCH', token: salesToken,
      body: { items: [
        { productId: panel.body.data.id, quantity: 4 },
        { productId: connector.body.data.id, quantity: 2 },
      ] },
    });
    const updatedProduct = await request(`/api/products/${panel.body.data.id}`, {
      method: 'PATCH', token: adminToken, body: { unitPrice: '99.99' },
    });
    const quoteDetail = await request(`/api/quotes/${quoteResponse.body.data.id}`, { token: salesToken });
    const sent = await request(`/api/quotes/${quoteResponse.body.data.id}/send`, { method: 'POST', token: salesToken });
    const accepted = await request(`/api/quotes/${quoteResponse.body.data.id}/accept`, { method: 'POST', token: salesToken });
    const repeatedAccept = await request(`/api/quotes/${quoteResponse.body.data.id}/accept`, { method: 'POST', token: salesToken });
    const convertedLead = await prisma.lead.findUnique({ where: { id: leadId }, select: { status: true } });

    assert.equal(adjusted.status, 200);
    assert.equal(adjusted.body.data.subtotal, '46.00');
    assert.equal(adjusted.body.data.total, '45.50');
    assert.ok(new Date(adjusted.body.data.updatedAt) >= new Date(createdAt));
    assert.equal(updatedProduct.status, 200);
    assert.equal(quoteDetail.body.data.items[0].unitPriceAtQuote, '10.50');
    assert.equal(sent.body.data.status, 'SENT');
    assert.equal(accepted.status, 200);
    assert.equal(accepted.body.data.quote.status, 'ACCEPTED');
    assert.equal(accepted.body.data.order.totalAmount, '45.50');
    assert.equal(repeatedAccept.status, 409);
    assert.equal(convertedLead.status, 'CONVERTED');
  });

  await t.test('rejects quotes and rolls back quote acceptance when order creation fails', async () => {
    const rejectLeadId = await createApprovedLead(salesToken, 'R');
    const rejectQuote = await request(`/api/leads/${rejectLeadId}/quotes`, {
      method: 'POST', token: salesToken, body: { systemType: 'ON_GRID', capacityKw: 1.25 },
    });
    const rejected = await request(`/api/quotes/${rejectQuote.body.data.id}/reject`, { method: 'POST', token: salesToken });
    assert.equal(rejected.status, 200);
    assert.equal(rejected.body.data.status, 'REJECTED');

    const rollbackLeadId = await createApprovedLead(salesToken, 'T');
    const rollbackQuote = await request(`/api/leads/${rollbackLeadId}/quotes`, {
      method: 'POST', token: salesToken, body: { systemType: 'ON_GRID', capacityKw: 1.25 },
    });
    await request(`/api/quotes/${rollbackQuote.body.data.id}/send`, { method: 'POST', token: salesToken });
    const lead = await prisma.lead.findUnique({ where: { id: rollbackLeadId } });
    await prisma.installationOrder.create({
      data: {
        quoteId: rollbackQuote.body.data.id,
        customerId: lead.customerId,
        totalAmount: '33.50',
        advancePaid: '0.00',
        balanceDue: '33.50',
      },
    });
    const failedAccept = await request(`/api/quotes/${rollbackQuote.body.data.id}/accept`, { method: 'POST', token: salesToken });
    const unchangedQuote = await prisma.quote.findUnique({ where: { id: rollbackQuote.body.data.id }, select: { status: true } });
    const unchangedLead = await prisma.lead.findUnique({ where: { id: rollbackLeadId }, select: { status: true } });
    assert.equal(failedAccept.status, 409);
    assert.equal(unchangedQuote.status, 'SENT');
    assert.equal(unchangedLead.status, 'QUOTED');
  });
});
