import 'dotenv/config';
import bcrypt from 'bcrypt';
import { Prisma, PrismaClient, Role, ProductCategory, SystemType, LeadStatus, SurveyStatus, QuoteStatus, PaymentType, PaymentMethod } from '@prisma/client';
import { acceptQuote } from '../src/services/quoteService.js';

const prisma = new PrismaClient();
const demoPassword = process.env.SUNFLOW_DEMO_PASSWORD ?? 'demo1234';
if (process.env.NODE_ENV === 'production') throw new Error('Demo seed data is development-only');

async function seedLead({ id, name, phone, address, user, customerId }) {
  const customer = await prisma.customer.upsert({ where: { phone }, update: { name, address }, create: { id: customerId, name, phone, address } });
  const lead = await prisma.lead.upsert({
    where: { id },
    update: { customerId: customer.id, assignedSalesUserId: user.id, requestedCapacityKw: 3, systemTypeInterest: SystemType.ON_GRID },
    create: { id, customerId: customer.id, assignedSalesUserId: user.id, requestedCapacityKw: 3, systemTypeInterest: SystemType.ON_GRID, status: LeadStatus.QUOTED, source: 'Seed demo data' },
  });
  await prisma.siteSurvey.upsert({
    where: { leadId: id },
    update: { conductedByUserId: user.id, roofDirection: 'South', roofTiltDegrees: 15, cableDistanceMeters: 12, status: SurveyStatus.APPROVED, approvedByUserId: user.id, approvedAt: new Date() },
    create: { leadId: id, conductedByUserId: user.id, roofDirection: 'South', roofTiltDegrees: 15, cableDistanceMeters: 12, status: SurveyStatus.APPROVED, approvedByUserId: user.id, approvedAt: new Date() },
  });
  if (lead.status !== LeadStatus.CONVERTED) await prisma.lead.update({ where: { id }, data: { status: LeadStatus.QUOTED } });
  return { lead, customer };
}

async function seedQuote({ id, leadId, customerId, userId, products }) {
  const existing = await prisma.quote.findUnique({ where: { id } });
  if (existing) return existing;
  const quantities = [9, 1, 6];
  const items = products.map((product, index) => ({ productId: product.id, quantity: quantities[index], unitPriceAtQuote: product.unitPrice, lineTotal: product.unitPrice.mul(quantities[index]) }));
  const subtotal = items.reduce((sum, item) => sum.plus(item.lineTotal), new Prisma.Decimal(0));
  return prisma.quote.create({
    data: {
      id, leadId, customerId, bomTemplateId: 'demo-bom-on-grid', systemType: SystemType.ON_GRID, capacityKw: 3,
      subtotal, discount: 0, tax: 0, total: subtotal, status: QuoteStatus.SENT, createdByUserId: userId,
      validUntil: new Date(Date.UTC(new Date().getUTCFullYear(), 11, 31)), items: { create: items },
    },
  });
}

async function main() {
  const passwordHash = await bcrypt.hash(demoPassword, 12);
  const users = {};
  const userSpecs = [
    ['admin', 'Vikram Shah', 'admin@sunpower.demo', '9000000001', Role.ADMIN],
    ['sales', 'Priya Sharma', 'priya@sunpower.demo', '9000000002', Role.SALES],
    ['warehouse', 'Raghav Patel', 'raghav@sunpower.demo', '9000000003', Role.WAREHOUSE],
    ['technician', 'Arjun Rao', 'arjun@sunpower.demo', '9000000004', Role.TECHNICIAN],
    ['support', 'Meera Iyer', 'meera@sunpower.demo', '9000000005', Role.SUPPORT],
  ];
  for (const [key, name, email, phone, role] of userSpecs) {
    users[key] = await prisma.user.upsert({ where: { email }, update: { name, phone, role, passwordHash, isActive: true }, create: { name, email, phone, role, passwordHash } });
  }

  const productSpecs = [
    { id: 'demo-product-panel', sku: 'DEMO-PANEL-550', name: 'Demo 550W Solar Panel', category: ProductCategory.PANEL, isSerialized: false, unitPrice: '10500.00', unit: 'piece', warrantyMonths: 240 },
    { id: 'demo-product-inverter', sku: 'DEMO-INV-3K', name: 'Demo 3kW Inverter', category: ProductCategory.INVERTER, isSerialized: true, unitPrice: '35000.00', unit: 'piece', warrantyMonths: 24 },
    { id: 'demo-product-cable', sku: 'DEMO-DC-CABLE', name: 'Demo DC Cable', category: ProductCategory.WIRE, isSerialized: false, unitPrice: '150.00', unit: 'meter', warrantyMonths: 12 },
  ];
  const products = [];
  for (const spec of productSpecs) {
    const { id, ...update } = spec;
    products.push(await prisma.product.upsert({ where: { sku: spec.sku }, update, create: spec }));
  }
  for (const [product, quantity, reorderLevel, warehouseLocation] of [[products[0], 120, 20, 'Demo rack A1'], [products[2], 500, 50, 'Demo rack B2']]) {
    await prisma.inventory.upsert({ where: { productId: product.id }, update: { reorderLevel, warehouseLocation }, create: { productId: product.id, quantityOnHand: quantity, reorderLevel, warehouseLocation } });
  }
  await prisma.serializedEquipment.upsert({ where: { serialNumber: 'DEMO-INV-0001' }, update: { productId: products[1].id, manufacturer: 'SampleSolar Demo', model: 'SS-3K' }, create: { serialNumber: 'DEMO-INV-0001', productId: products[1].id, manufacturer: 'SampleSolar Demo', model: 'SS-3K' } });

  await prisma.bOMTemplate.upsert({
    where: { id: 'demo-bom-on-grid' },
    update: { name: 'Demo On-Grid 1-5 kW', systemType: SystemType.ON_GRID, minCapacityKw: 1, maxCapacityKw: 5, description: 'Configurable demo components; not engineering guidance.' },
    create: { id: 'demo-bom-on-grid', name: 'Demo On-Grid 1-5 kW', systemType: SystemType.ON_GRID, minCapacityKw: 1, maxCapacityKw: 5, description: 'Configurable demo components; not engineering guidance.' },
  });
  for (const item of [
    { id: 'demo-bom-panel', productId: products[0].id, quantityPerKw: 3 },
    { id: 'demo-bom-inverter', productId: products[1].id, quantityFixed: 1 },
    { id: 'demo-bom-cable', productId: products[2].id, quantityPerKw: 2 },
  ]) await prisma.bOMTemplateItem.upsert({ where: { id: item.id }, update: { bomTemplateId: 'demo-bom-on-grid', ...item }, create: { bomTemplateId: 'demo-bom-on-grid', ...item } });

  const ready = await seedLead({ id: 'demo-lead-quote-ready', name: 'Demo Quote Customer', phone: '9880000001', address: '1 Demo Solar Lane, Pune', user: users.sales, customerId: 'demo-customer-ready' });
  const ops = await seedLead({ id: 'demo-lead-operations', name: 'Demo Operations Customer', phone: '9880000002', address: '2 Demo Solar Lane, Pune', user: users.sales, customerId: 'demo-customer-ops' });
  let readyQuote = await prisma.quote.findFirst({ where: { leadId: ready.lead.id, status: QuoteStatus.SENT, order: null } });
  if (!readyQuote) {
    let sequence = 1;
    while (await prisma.quote.findUnique({ where: { id: `demo-quote-ready-${sequence}` } })) sequence += 1;
    readyQuote = await seedQuote({ id: `demo-quote-ready-${sequence}`, leadId: ready.lead.id, customerId: ready.customer.id, userId: users.sales.id, products });
  }
  const opsQuote = await seedQuote({ id: 'demo-quote-operations', leadId: ops.lead.id, customerId: ops.customer.id, userId: users.sales.id, products });
  let order = await prisma.installationOrder.findUnique({ where: { quoteId: opsQuote.id } });
  if (!order) {
    if (opsQuote.status !== QuoteStatus.SENT) await prisma.quote.update({ where: { id: opsQuote.id }, data: { status: QuoteStatus.SENT } });
    await prisma.lead.update({ where: { id: ops.lead.id }, data: { status: LeadStatus.QUOTED } });
    await acceptQuote(opsQuote.id);
    order = await prisma.installationOrder.findUnique({ where: { quoteId: opsQuote.id } });
  }
  await prisma.payment.upsert({
    where: { id: 'demo-payment-advance' },
    update: { installationOrderId: order.id, amount: '15000.00', type: PaymentType.ADVANCE, method: PaymentMethod.UPI, recordedByUserId: users.sales.id },
    create: { id: 'demo-payment-advance', installationOrderId: order.id, amount: '15000.00', type: PaymentType.ADVANCE, method: PaymentMethod.UPI, recordedByUserId: users.sales.id },
  });
  const paid = await prisma.payment.aggregate({ where: { installationOrderId: order.id, type: { not: PaymentType.SERVICE } }, _sum: { amount: true } });
  await prisma.installationOrder.update({ where: { id: order.id }, data: { advancePaid: paid._sum.amount ?? 0, balanceDue: order.totalAmount.sub(paid._sum.amount ?? 0) } });

  console.log('Seeded five demo roles, three products, non-serialized stock, serialized demo unit, active BOM, two approved leads, and quotes.');
  console.log(`Ready-to-accept quote: ${readyQuote.id}; operations order: ${order.id}; available inverter serial: DEMO-INV-0001.`);
  console.log(`Development-only demo password for all five accounts: ${demoPassword}`);
}

main().catch((error) => { console.error('Database seed failed:', error); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
