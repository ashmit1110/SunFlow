import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dbName = `completion-${randomUUID()}.db`;
const dbPath = path.join(root, 'prisma', dbName);
const dbUrl = `file:./${dbName}`;
const jwtSecret = 'sunflow-completion-integration-test-secret';
const testEnv = { ...process.env, NODE_ENV: 'test', DATABASE_URL: dbUrl, JWT_SECRET: jwtSecret, CORS_ORIGINS: 'http://localhost:5173' };
let app;
let prisma;
let server;
let baseUrl;
let uploadedInstallationId;

function runNode(script, args = []) {
  execFileSync(process.execPath, [script, ...args], { cwd: root, env: testEnv, stdio: 'pipe' });
}

before(async () => {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = dbUrl;
  process.env.JWT_SECRET = jwtSecret;
  process.env.CORS_ORIGINS = 'http://localhost:5173';
  runNode('scripts/prepare-sqlite.js');
  runNode('node_modules/prisma/build/index.js', ['migrate', 'deploy']);
  runNode('prisma/seed.js');
  ({ default: app } = await import('../src/app.js'));
  ({ prisma } = await import('../src/config/database.js'));
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server?.listening) {
    await new Promise((resolve) => server.close(resolve));
    server.closeAllConnections();
  }
  if (prisma) await prisma.$disconnect();
  await rm(dbPath, { force: true });
  await rm(`${dbPath}-journal`, { force: true });
  if (uploadedInstallationId) await rm(path.join(root, 'uploads', 'installations', uploadedInstallationId), { recursive: true, force: true });
});

async function request(url, { method = 'GET', token, body } = {}) {
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  const response = await fetch(`${baseUrl}${url}`, {
    method,
    headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body && !isForm ? { 'content-type': 'application/json' } : {}) },
    ...(body ? { body: isForm ? body : JSON.stringify(body) } : {}),
  });
  const contentType = response.headers.get('content-type') ?? '';
  return { status: response.status, body: contentType.includes('application/json') ? await response.json() : await response.arrayBuffer(), headers: response.headers };
}

async function login(email = 'admin@sunpower.demo', password = 'demo1234') {
  const result = await request('/api/auth/login', { method: 'POST', body: { email, password } });
  assert.equal(result.status, 200);
  return result.body.data.token;
}

test('Orders through installation, service, dashboard, and quote list workflows', async (t) => {
  const admin = await login();
  const sales = await login('priya@sunpower.demo');
  const warehouse = await login('raghav@sunpower.demo');
  const technician = await login('arjun@sunpower.demo');
  const support = await login('meera@sunpower.demo');
  const wrongTechRow = await prisma.user.create({
    data: { name: 'Unassigned Demo Tech', email: `other-tech-${randomUUID()}@sunpower.demo`, phone: `${Math.floor(9100000000 + Math.random() * 89999999)}`, passwordHash: await bcrypt.hash('other-tech-password', 10), role: 'TECHNICIAN' },
  });
  const wrongTech = await login(wrongTechRow.email, 'other-tech-password');

  await t.test('lists quotes from SQLite with quote number, customer and frozen item prices', async () => {
    const noAuth = await request('/api/quotes');
    const result = await request('/api/quotes?status=SENT&search=Demo%20Quote%20Customer', { token: sales });
    assert.equal(noAuth.status, 401);
    assert.equal(result.status, 200);
    assert.ok(result.body.data.length >= 1);
    const quote = result.body.data.find((item) => item.leadId === 'demo-lead-quote-ready');
    assert.ok(quote);
    assert.match(quote.quoteNumber, /^Q-\d{4}-/);
    assert.equal(quote.customer.name, 'Demo Quote Customer');
    assert.ok(quote.items.every((item) => /^\d+\.\d{2}$/.test(item.unitPriceAtQuote)));
    assert.deepEqual(result.body.meta, { page: 1, pageSize: 20, total: result.body.meta.total });
  });

  const quoteList = await request('/api/quotes?leadId=demo-lead-quote-ready&status=SENT', { token: sales });
  const quote = quoteList.body.data[0];
  const accepted = await request(`/api/quotes/${quote.id}/accept`, { method: 'POST', token: sales });
  assert.equal(accepted.status, 200);
  const orderId = accepted.body.data.order.id;

  await t.test('acceptance created the order; order reads and payments use persistent records', async () => {
    assert.equal(accepted.body.data.order.status, 'CONFIRMED');
    assert.equal(accepted.body.data.order.customer.name, 'Demo Quote Customer');
    const list = await request('/api/orders?status=CONFIRMED&page=1&pageSize=10', { token: warehouse });
    const detail = await request(`/api/orders/${orderId}`, { token: sales });
    const picking = await request(`/api/orders/${orderId}/picking-list`, { token: warehouse });
    const payment = await request(`/api/orders/${orderId}/payments`, { method: 'POST', token: sales, body: { amount: '10000.00', type: 'ADVANCE', method: 'UPI' } });
    const overpayment = await request(`/api/orders/${orderId}/payments`, { method: 'POST', token: sales, body: { amount: '9999999.00', type: 'FULL', method: 'CASH' } });
    const payments = await request(`/api/orders/${orderId}/payments`, { token: sales });
    assert.equal(list.status, 200);
    assert.ok(list.body.data.some((item) => item.id === orderId));
    assert.equal(detail.body.data.customer.name, 'Demo Quote Customer');
    assert.equal(detail.body.data.quote.items[0].unitPriceAtQuote, '10500.00');
    assert.equal(picking.body.data.nonSerializedRequirements.find((item) => item.name.includes('Panel')).quantityNeeded, 9);
    assert.equal(payment.status, 201);
    assert.equal(payment.body.data.order.advancePaid, '10000.00');
    assert.equal(overpayment.status, 422);
    assert.equal(payments.body.meta.total, 1);
    const expense = await request(`/api/orders/${orderId}/expenses`, { method: 'POST', token: warehouse, body: { type: 'TRANSPORT', amount: '250.00', description: 'Demo delivery expense' } });
    assert.equal(expense.status, 201);
    assert.equal(expense.body.data.amount, '250.00');
    const forbiddenExpense = await request(`/api/orders/${orderId}/expenses`, { method: 'POST', token: sales, body: { type: 'MISC', amount: '1.00' } });
    assert.equal(forbiddenExpense.status, 403);
  });

  const orderDetail = await request(`/api/orders/${orderId}`, { token: sales });
  const serializedUnit = await request('/api/equipment/DEMO-INV-0001', { token: warehouse });
  const quoteItems = orderDetail.body.data.quote.items;
  const nonSerializedItems = quoteItems.filter((item) => !item.product.isSerialized).map(({ productId, quantity }) => ({ productId, quantity }));
  const serialId = serializedUnit.body.data.id;

  await t.test('dispatch blocks short stock, then reserves serials and atomically decrements stock on confirmation', async () => {
    const panelLine = nonSerializedItems.find((item) => item.productId === 'demo-product-panel');
    await prisma.inventory.update({ where: { productId: panelLine.productId }, data: { quantityOnHand: 0 } });
    const insufficient = await request(`/api/orders/${orderId}/dispatches`, { method: 'POST', token: warehouse, body: { serializedEquipmentIds: [serialId], nonSerializedItems } });
    assert.equal(insufficient.status, 422);
    await prisma.inventory.update({ where: { productId: panelLine.productId }, data: { quantityOnHand: 120 } });

    const created = await request(`/api/orders/${orderId}/dispatches`, { method: 'POST', token: warehouse, body: { serializedEquipmentIds: [serialId], nonSerializedItems } });
    assert.equal(created.status, 201);
    const dispatchId = created.body.data.id;
    assert.equal(created.body.data.status, 'PREPARED');
    assert.equal((await prisma.serializedEquipment.findUnique({ where: { id: serialId } })).status, 'RESERVED');
    assert.equal((await prisma.inventory.findUnique({ where: { productId: panelLine.productId } })).quantityOnHand, 120);
    const confirmed = await request(`/api/dispatches/${dispatchId}/confirm`, { method: 'POST', token: warehouse });
    const duplicate = await request(`/api/dispatches/${dispatchId}/confirm`, { method: 'POST', token: warehouse });
    const dispatchDetail = await request(`/api/dispatches/${dispatchId}`, { token: warehouse });
    assert.equal(confirmed.status, 200);
    assert.equal(confirmed.body.data.order.status, 'DISPATCHED');
    assert.equal(duplicate.status, 409);
    assert.equal(dispatchDetail.body.data.status, 'DISPATCHED');
    assert.equal((await prisma.inventory.findUnique({ where: { productId: panelLine.productId } })).quantityOnHand, 111);
    assert.equal(await prisma.stockMovement.count({ where: { referenceType: 'DISPATCH', referenceId: dispatchId, type: 'OUTBOUND' } }), nonSerializedItems.length);
    const delivered = await request(`/api/dispatches/${dispatchId}/deliver`, { method: 'POST', token: warehouse });
    assert.equal(delivered.status, 200);
    assert.equal(delivered.body.data.status, 'DELIVERED');
    assert.equal((await prisma.serializedEquipment.findUnique({ where: { id: serialId }, include: { warranty: true } })).warranty, null);
    const denied = await request(`/api/orders/${orderId}/dispatches`, { method: 'POST', token: sales, body: { serializedEquipmentIds: [], nonSerializedItems: [] } });
    assert.equal(denied.status, 403);
    void dispatchId;
  });
  const technicianUser = await prisma.user.findUnique({ where: { email: 'arjun@sunpower.demo' } });
  const assigned = await request(`/api/orders/${orderId}/assign-technician`, { method: 'POST', token: sales, body: { technicianUserId: technicianUser.id, scheduledDate: new Date().toISOString() } });
  assert.equal(assigned.status, 200);
  const installationRow = await prisma.installationRecord.findUnique({ where: { installationOrderId: orderId } });
  uploadedInstallationId = installationRow.id;
  await t.test('technician ownership, checklist, protected uploads, and atomic warranty registration', async () => {
    const ownInstallations = await request('/api/installations/my', { token: technician });
    assert.equal(ownInstallations.status, 200);
    assert.ok(ownInstallations.body.data.some((record) => record.id === installationRow.id));
    const detail = await request(`/api/installations/${installationRow.id}`, { token: wrongTech });
    assert.equal(detail.status, 403);
    const started = await request(`/api/installations/${installationRow.id}/start`, { method: 'PATCH', token: technician });
    assert.equal(started.status, 200);
    const incomplete = await request(`/api/installations/${installationRow.id}/checklist`, { method: 'PATCH', token: technician, body: { checklist: { panelsMounted: false }, confirmedCapacityKw: 3 } });
    assert.equal(incomplete.status, 200);
    const incompleteResult = await request(`/api/installations/${installationRow.id}/complete`, { method: 'POST', token: technician, body: { confirmedCapacityKw: 3, customerSignedName: 'Demo Customer' } });
    assert.equal(incompleteResult.status, 422);
    await request(`/api/installations/${installationRow.id}/checklist`, { method: 'PATCH', token: technician, body: { checklist: { panelsMounted: true, inverterConnected: true, generationTested: true }, confirmedCapacityKw: 3 } });
    const missingSignature = await request(`/api/installations/${installationRow.id}/complete`, { method: 'POST', token: technician, body: { confirmedCapacityKw: 3, customerSignedName: 'Demo Customer' } });
    assert.equal(missingSignature.status, 422);

    const wrongOwnerForm = new FormData();
    wrongOwnerForm.append('photos', new Blob([Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10])], { type: 'image/png' }), 'roof.png');
    const wrongOwnerUpload = await request(`/api/installations/${installationRow.id}/photos`, { method: 'POST', token: wrongTech, body: wrongOwnerForm });
    assert.equal(wrongOwnerUpload.status, 403);

    const photoForm = new FormData();
    photoForm.append('caption', 'Completed demo array');
    photoForm.append('photos', new Blob([Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10])], { type: 'image/png' }), 'roof.png');
    const photos = await request(`/api/installations/${installationRow.id}/photos`, { method: 'POST', token: technician, body: photoForm });
    assert.equal(photos.status, 201);
    const signatureForm = new FormData();
    signatureForm.append('customerSignedName', 'Demo Customer');
    signatureForm.append('signature', new Blob([Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10])], { type: 'image/png' }), 'signature.png');
    const signature = await request(`/api/installations/${installationRow.id}/signature`, { method: 'POST', token: technician, body: signatureForm });
    assert.equal(signature.status, 201);
    const protectedFile = await request(photos.body.data[0].fileUrl, { token: support });
    assert.equal(protectedFile.status, 200);

    const complete = await request(`/api/installations/${installationRow.id}/complete`, { method: 'POST', token: technician, body: { confirmedCapacityKw: 3, customerSignedName: 'Demo Customer' } });
    assert.equal(complete.status, 200);
    assert.equal(complete.body.data.installationRecord.status, 'INSTALLED');
    assert.equal(complete.body.data.order.status, 'INSTALLED');
    assert.equal(complete.body.data.warrantiesCreated, 1);
    assert.equal((await prisma.serializedEquipment.findUnique({ where: { id: serialId } })).status, 'INSTALLED');
  });

  await t.test('equipment passport computes warranty live and support can manage service tickets', async () => {
    const passport = await request('/api/equipment/DEMO-INV-0001/passport', { token: support });
    assert.equal(passport.status, 200);
    assert.equal(passport.body.data.customer.name, 'Demo Quote Customer');
    assert.equal(passport.body.data.warranty.status, 'ACTIVE');
    assert.equal(passport.body.data.photos.length, 1);
    assert.equal(passport.body.data.serviceHistory.length, 0);

    const ticket = await request('/api/service-tickets', { method: 'POST', token: support, body: { serialNumber: 'DEMO-INV-0001', issueDescription: 'Demo inverter needs inspection', faultCode: 'D-01' } });
    assert.equal(ticket.status, 201);
    assert.equal(ticket.body.data.warrantyCovered, true);
    const forbidden = await request('/api/service-tickets', { method: 'POST', token: sales, body: { serialNumber: 'DEMO-INV-0001', issueDescription: 'Denied ticket' } });
    assert.equal(forbidden.status, 403);
    const invalidTransition = await request(`/api/service-tickets/${ticket.body.data.id}/status`, { method: 'PATCH', token: support, body: { status: 'CLOSED' } });
    assert.equal(invalidTransition.status, 409);
    const uncovered = await request(`/api/service-tickets/${ticket.body.data.id}/status`, { method: 'PATCH', token: support, body: { warrantyCovered: false } });
    assert.equal(uncovered.status, 200);
    const charge = await request(`/api/service-tickets/${ticket.body.data.id}/charges`, { method: 'POST', token: support, body: { description: 'Replacement fuse', amount: '45.00', type: 'PART' } });
    assert.equal(charge.status, 201);
    assert.equal(charge.body.data.charges[0].amount, '45.00');
    const inProgress = await request(`/api/service-tickets/${ticket.body.data.id}/status`, { method: 'PATCH', token: support, body: { status: 'IN_PROGRESS' } });
    assert.equal(inProgress.status, 200);
    await request(`/api/service-tickets/${ticket.body.data.id}/status`, { method: 'PATCH', token: support, body: { status: 'RESOLVED' } });
    const closed = await request(`/api/service-tickets/${ticket.body.data.id}/status`, { method: 'PATCH', token: support, body: { status: 'CLOSED' } });
    assert.equal(closed.status, 200);
    const overview = await request('/api/dashboard/service-overview', { token: support });
    assert.equal(overview.status, 200);
    assert.equal(overview.body.data.find((item) => item.status === 'CLOSED').count, 1);
    const list = await request('/api/service-tickets?customerId=demo-customer-ready', { token: support });
    assert.equal(list.body.meta.total, 1);
  });

  await t.test('dashboard aggregates persisted payments and expenses; cancellation applies before dispatch', async () => {
    const summary = await request('/api/dashboard/summary?range=month', { token: admin });
    const profitability = await request('/api/dashboard/orders-profitability', { token: admin });
    const deniedDashboard = await request('/api/dashboard/summary', { token: sales });
    assert.equal(summary.status, 200);
    assert.equal(summary.body.data.recordedRevenue, '25000.00');
    assert.equal(summary.body.data.recordedExpenses, '250.00');
    assert.ok(profitability.body.data.some((row) => row.orderId === orderId && row.estimatedMargin === '-120650.00'));
    assert.equal(deniedDashboard.status, 403);

    const operationsOrder = (await request('/api/orders', { token: admin })).body.data.find((item) => item.quoteId === 'demo-quote-operations');
    const cancelled = await request(`/api/orders/${operationsOrder.id}/cancel`, { method: 'POST', token: sales });
    assert.equal(cancelled.status, 200);
    assert.equal(cancelled.body.data.status, 'CANCELLED');
    const pickingAfterCancel = await request(`/api/orders/${operationsOrder.id}/picking-list`, { token: warehouse });
    assert.equal(pickingAfterCancel.status, 409);
  });
});
