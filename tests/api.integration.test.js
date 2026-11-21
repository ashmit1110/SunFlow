import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const testDatabaseName = `milestone2-${randomUUID()}.db`;
const testDatabasePath = path.join(serverRoot, 'prisma', testDatabaseName);
const testDatabaseUrl = `file:./${testDatabaseName}`;
const testJwtSecret = 'sunflow-milestone-two-integration-test-secret';
let app;
let prisma;
let server;
let baseUrl;

const testEnv = {
  ...process.env,
  DATABASE_URL: testDatabaseUrl,
  JWT_SECRET: testJwtSecret,
  PORT: '4000',
  CORS_ORIGINS: 'http://localhost:5173',
};

function runNodeScript(scriptPath, args = []) {
  execFileSync(process.execPath, [scriptPath, ...args], {
    cwd: serverRoot,
    env: testEnv,
    stdio: 'pipe',
  });
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

test('Auth, customers, leads, and site survey API integration', async (t) => {
  const adminLogin = await request('/api/auth/login', {
    method: 'POST',
    body: { email: 'admin@sunpower.demo', password: 'demo1234' },
  });
  const salesLogin = await request('/api/auth/login', {
    method: 'POST',
    body: { email: 'priya@sunpower.demo', password: 'demo1234' },
  });
  const technicianLogin = await request('/api/auth/login', {
    method: 'POST',
    body: { email: 'arjun@sunpower.demo', password: 'demo1234' },
  });
  assert.equal(adminLogin.status, 200);
  assert.equal(salesLogin.status, 200);
  assert.equal(technicianLogin.status, 200);
  const adminToken = adminLogin.body.data.token;
  const salesToken = salesLogin.body.data.token;
  const technicianToken = technicianLogin.body.data.token;

  await t.test('accepts seeded credentials and rejects bad or missing credentials', async () => {
    const wrongPassword = await request('/api/auth/login', {
      method: 'POST', body: { email: 'priya@sunpower.demo', password: 'wrong-password' },
    });
    const missingToken = await request('/api/auth/me');
    const invalidToken = await request('/api/auth/me', { token: 'not-a-signed-jwt' });
    const currentUser = await request('/api/auth/me', { token: salesToken });
    assert.equal(wrongPassword.status, 401);
    assert.equal(wrongPassword.body.error.code, 'UNAUTHENTICATED');
    assert.equal(missingToken.status, 401);
    assert.equal(invalidToken.status, 401);
    assert.equal(currentUser.status, 200);
    assert.equal(currentUser.body.data.role, 'SALES');
  });

  await t.test('enforces role access and omits password hashes from user endpoints', async () => {
    const denied = await request('/api/users', { token: salesToken });
    const users = await request('/api/users?role=SUPPORT', { token: adminToken });
    assert.equal(denied.status, 403);
    assert.equal(denied.body.error.code, 'FORBIDDEN');
    assert.equal(users.status, 200);
    assert.equal(users.body.data.length, 1);
    assert.equal('passwordHash' in users.body.data[0], false);
  });

  await t.test('allows ADMIN to create a user and deactivate it without exposing its hash', async () => {
    const phone = `92${Date.now().toString().slice(-8)}`;
    const created = await request('/api/users', {
      method: 'POST', token: adminToken,
      body: { name: 'Temporary User', email: `temp-${randomUUID()}@example.test`, phone, password: 'temporary-pass', role: 'SUPPORT' },
    });
    const beforeDeactivation = await request('/api/auth/login', {
      method: 'POST', body: { email: created.body.data.email, password: 'temporary-pass' },
    });
    const deactivated = await request(`/api/users/${created.body.data.id}`, {
      method: 'PATCH', token: adminToken, body: { isActive: false },
    });
    const afterDeactivation = await request('/api/auth/me', { token: beforeDeactivation.body.data.token });
    assert.equal(created.status, 201);
    assert.equal('passwordHash' in created.body.data, false);
    assert.equal(beforeDeactivation.status, 200);
    assert.equal(deactivated.status, 200);
    assert.equal(deactivated.body.data.isActive, false);
    assert.equal(afterDeactivation.status, 401);
  });

  const customerPhone = `91${Date.now().toString().slice(-8)}`;
  const customerResponse = await request('/api/customers', {
    method: 'POST', token: salesToken,
    body: { name: 'Demo Customer', phone: customerPhone, email: 'demo.customer@example.test', address: '12 Demo Road' },
  });
  assert.equal(customerResponse.status, 201);
  const customerId = customerResponse.body.data.id;

  await t.test('creates, searches, reads, updates, and de-duplicates customers', async () => {
    const duplicate = await request('/api/customers', {
      method: 'POST', token: salesToken,
      body: { name: 'Another Name', phone: customerPhone, address: 'Other Road' },
    });
    const list = await request(`/api/customers?search=${customerPhone}`, { token: salesToken });
    const detail = await request(`/api/customers/${customerId}`, { token: salesToken });
    const updated = await request(`/api/customers/${customerId}`, {
      method: 'PATCH', token: salesToken, body: { address: '13 Demo Road' },
    });
    assert.equal(duplicate.status, 409);
    assert.equal(list.status, 200);
    assert.equal(list.body.data.length, 1);
    assert.equal(detail.status, 200);
    assert.equal(updated.body.data.address, '13 Demo Road');
  });

  const leadBody = {
    customerName: 'Lead Customer',
    customerPhone,
    customerAddress: 'Ignored existing address',
    requestedCapacityKw: 3,
    systemTypeInterest: 'ON_GRID',
    subsidyInterest: true,
    source: 'integration_test',
  };
  const firstLeadResponse = await request('/api/leads', { method: 'POST', token: salesToken, body: leadBody });
  assert.equal(firstLeadResponse.status, 201);
  const leadId = firstLeadResponse.body.data.lead.id;
  const existingCustomerId = firstLeadResponse.body.data.customer.id;

  await t.test('creates leads and reuses one customer for a matching phone', async () => {
    const secondLeadResponse = await request('/api/leads', { method: 'POST', token: salesToken, body: leadBody });
    const sameCustomerCount = await prisma.customer.count({ where: { phone: customerPhone } });
    const forbiddenLead = await request('/api/leads', { method: 'POST', token: technicianToken, body: leadBody });
    const leadDetail = await request(`/api/leads/${leadId}`, { token: salesToken });
    assert.equal(secondLeadResponse.status, 201);
    assert.equal(secondLeadResponse.body.data.customer.id, existingCustomerId);
    assert.equal(sameCustomerCount, 1);
    assert.equal(forbiddenLead.status, 403);
    assert.equal(leadDetail.status, 200);
    assert.equal(leadDetail.body.data.customer.id, existingCustomerId);
  });

  await t.test('qualifies the lead without regressing later pipeline stages', async () => {
    const qualification = await request(`/api/leads/${leadId}/qualify`, {
      method: 'PATCH', token: salesToken,
      body: { shadowFreeRoofAreaSqm: 28.5, avgMonthlyBillInr: 4200, gridSuitable: true },
    });
    const invalidConversion = await request(`/api/leads/${leadId}/status`, {
      method: 'PATCH', token: salesToken, body: { status: 'CONVERTED' },
    });
    assert.equal(qualification.status, 200);
    assert.equal(qualification.body.data.status, 'QUALIFIED');
    assert.equal(invalidConversion.status, 409);
  });

  const surveyResponse = await request(`/api/leads/${leadId}/surveys`, {
    method: 'POST', token: technicianToken,
    body: { roofDirection: 'South-East', roofTiltDegrees: 18, cableDistanceMeters: 22 },
  });
  assert.equal(surveyResponse.status, 201);
  const surveyId = surveyResponse.body.data.id;

  await t.test('requires sales/admin approval and advances the lead only on approval', async () => {
    const technicianApproval = await request(`/api/surveys/${surveyId}/approve`, { method: 'POST', token: technicianToken });
    const detail = await request(`/api/surveys/${surveyId}`, { token: salesToken });
    const approval = await request(`/api/surveys/${surveyId}/approve`, { method: 'POST', token: salesToken });
    const approvedLead = await prisma.lead.findUnique({ where: { id: leadId }, select: { status: true } });
    assert.equal(technicianApproval.status, 403);
    assert.equal(detail.status, 200);
    assert.equal(approval.status, 200);
    assert.equal(approval.body.data.status, 'APPROVED');
    assert.equal(typeof approval.body.data.approvedAt, 'string');
    assert.equal(approvedLead.status, 'SURVEY_APPROVED');
  });

  const rejectionLead = await request('/api/leads', {
    method: 'POST', token: salesToken,
    body: { ...leadBody, customerPhone: `${customerPhone}1` },
  });
  const rejectionLeadId = rejectionLead.body.data.lead.id;
  const pendingSurvey = await request(`/api/leads/${rejectionLeadId}/surveys`, {
    method: 'POST', token: technicianToken,
    body: { roofDirection: 'West', roofTiltDegrees: 12, cableDistanceMeters: 8 },
  });
  const rejection = await request(`/api/surveys/${pendingSurvey.body.data.id}/reject`, {
    method: 'POST', token: salesToken, body: { rejectionReason: 'Roof shading too high' },
  });

  await t.test('rejects surveys without changing the lead stage and allows resubmission', async () => {
    const leadAfterReject = await prisma.lead.findUnique({ where: { id: rejectionLeadId }, select: { status: true } });
    const replacement = await request(`/api/leads/${rejectionLeadId}/surveys`, {
      method: 'POST', token: technicianToken,
      body: { roofDirection: 'South', roofTiltDegrees: 10, cableDistanceMeters: 9 },
    });
    assert.equal(rejection.status, 200);
    assert.equal(rejection.body.data.status, 'REJECTED');
    assert.equal(leadAfterReject.status, 'SURVEY_SCHEDULED');
    assert.equal(replacement.status, 201);
    assert.notEqual(replacement.body.data.id, pendingSurvey.body.data.id);
  });
});
