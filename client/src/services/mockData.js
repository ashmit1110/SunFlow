/**
 * SunFlow Realistic Mock Fixtures
 * For layout development and offline preview.
 * Matches PRD.md, Database-Design.md and API-Specification.md schemas exactly.
 */

export const mockUsers = [
  { id: 'usr_admin_1', name: 'Vikram Shah', email: 'admin@sunpower.demo', role: 'ADMIN' },
  { id: 'usr_sales_1', name: 'Priya Sharma', email: 'priya@sunpower.demo', role: 'SALES' },
  { id: 'usr_warehouse_1', name: 'Raghav Patel', email: 'raghav@sunpower.demo', role: 'WAREHOUSE' },
  { id: 'usr_tech_1', name: 'Arjun Rao', email: 'arjun@sunpower.demo', role: 'TECHNICIAN' },
  { id: 'usr_support_1', name: 'Meera Iyer', email: 'meera@sunpower.demo', role: 'SUPPORT' },
];

export const mockDashboardSummary = {
  range: 'month',
  recordedRevenue: '842000.00',
  recordedExpenses: '196000.00',
  outstandingBalance: '118500.00',
  openServiceTickets: 7,
  ordersCompleted: 12,
  note: 'Figures above are recorded sums of Payment and JobExpense rows. See orders-profitability for estimated — not audited — per-job margin.',
};

export const mockProfitability = [
  { orderId: 'ord_101', customerName: 'Rohit Verma', systemType: 'ON_GRID', capacityKw: 3, recordedPayments: '106300.00', bomCost: '82800.00', jobExpenses: '3500.00', estimatedMargin: '20000.00' },
  { orderId: 'ord_102', customerName: 'Sunita Joshi', systemType: 'OFF_GRID', capacityKw: 5, recordedPayments: '240000.00', bomCost: '185000.00', jobExpenses: '7200.00', estimatedMargin: '47800.00' },
  { orderId: 'ord_103', customerName: 'Apex Textiles Ltd', systemType: 'ON_GRID', capacityKw: 5, recordedPayments: '165000.00', bomCost: '132000.00', jobExpenses: '4800.00', estimatedMargin: '28200.00' },
  { orderId: 'ord_104', customerName: 'Deepak Rao', systemType: 'ON_GRID', capacityKw: 2, recordedPayments: '78000.00', bomCost: '64000.00', jobExpenses: '2200.00', estimatedMargin: '11800.00' },
];

export const mockLeads = [
  { id: 'lead_1', customerName: 'Rohit Verma', customerPhone: '9876543210', customerAddress: '12 MG Road, Pune', requestedCapacityKw: 3, systemTypeInterest: 'ON_GRID', subsidyInterest: true, status: 'SURVEY_APPROVED', createdAt: '2026-11-18T10:30:00.000Z' },
  { id: 'lead_2', customerName: 'Anil Deshmukh', customerPhone: '9822012345', customerAddress: 'Plot 44, Baner, Pune', requestedCapacityKw: 5, systemTypeInterest: 'OFF_GRID', subsidyInterest: false, status: 'QUALIFIED', createdAt: '2026-11-19T14:15:00.000Z' },
  { id: 'lead_3', customerName: 'Kavita Nair', customerPhone: '9811234567', customerAddress: 'B-202, Kothrud, Pune', requestedCapacityKw: 2, systemTypeInterest: 'ON_GRID', subsidyInterest: true, status: 'NEW', createdAt: '2026-11-20T09:00:00.000Z' },
  { id: 'lead_4', customerName: 'Amit Saxena', customerPhone: '9890123456', customerAddress: 'Sector 7, PCMC, Pune', requestedCapacityKw: 4, systemTypeInterest: 'ON_GRID', subsidyInterest: false, status: 'QUOTED', createdAt: '2026-11-15T11:20:00.000Z' },
  { id: 'lead_5', customerName: 'Green Meadows Co-op', customerPhone: '9922334455', customerAddress: 'Viman Nagar, Pune', requestedCapacityKw: 5, systemTypeInterest: 'ON_GRID', subsidyInterest: true, status: 'CONVERTED', createdAt: '2026-11-10T16:45:00.000Z' },
];

export const mockCustomers = [
  { id: 'cust_1', name: 'Rohit Verma', phone: '9876543210', address: '12 MG Road, Pune', activeOrders: 1, totalSpent: '106300.00' },
  { id: 'cust_2', name: 'Sunita Joshi', phone: '9822331122', address: 'Plot 88, Model Colony, Pune', activeOrders: 1, totalSpent: '240000.00' },
  { id: 'cust_3', name: 'Apex Textiles Ltd', phone: '9811009988', address: 'MIDC Bhosari, Pune', activeOrders: 2, totalSpent: '380000.00' },
  { id: 'cust_4', name: 'Green Meadows Co-op', phone: '9922334455', address: 'Viman Nagar, Pune', activeOrders: 1, totalSpent: '185000.00' },
];

export const mockSurveys = [
  { id: 'surv_1', leadId: 'lead_1', customerName: 'Rohit Verma', roofDirection: 'South-East', roofTiltDegrees: 18, cableDistanceMeters: 22, status: 'APPROVED', approvedBy: 'Priya Sharma', approvedAt: '2026-11-18T14:20:00.000Z' },
  { id: 'surv_2', leadId: 'lead_2', customerName: 'Anil Deshmukh', roofDirection: 'South', roofTiltDegrees: 20, cableDistanceMeters: 30, status: 'PENDING', approvedBy: null, approvedAt: null },
  { id: 'surv_3', leadId: 'lead_3', customerName: 'Kavita Nair', roofDirection: 'North-West', roofTiltDegrees: 12, cableDistanceMeters: 45, status: 'REJECTED', rejectionReason: 'Roof shading too high due to adjacent high-rise' },
];

export const mockQuotes = [
  { id: 'qt_101', quoteNumber: 'Q-2026-0089', customerName: 'Amit Saxena', systemType: 'ON_GRID', capacityKw: 4, subtotal: '135000.00', discount: '5000.00', tax: '6500.00', total: '136500.00', status: 'SENT', validUntil: '2026-12-15' },
  { id: 'qt_102', quoteNumber: 'Q-2026-0090', customerName: 'Rohit Verma', systemType: 'ON_GRID', capacityKw: 3, subtotal: '101300.00', discount: '0.00', tax: '5000.00', total: '106300.00', status: 'ACCEPTED', validUntil: '2026-12-10' },
  { id: 'qt_103', quoteNumber: 'Q-2026-0091', customerName: 'Green Meadows Co-op', systemType: 'ON_GRID', capacityKw: 5, subtotal: '175000.00', discount: '7000.00', tax: '8400.00', total: '176400.00', status: 'ACCEPTED', validUntil: '2026-12-20' },
];

export const mockProducts = [
  { id: 'prod_1', sku: 'INV-3KW-STD', name: '3kW Grid-Tie Inverter', category: 'INVERTER', isSerialized: true, unitPrice: '18500.00', unit: 'piece', warrantyMonths: 24, inStock: 6 },
  { id: 'prod_2', sku: 'INV-5KW-STD', name: '5kW Hybrid Inverter', category: 'INVERTER', isSerialized: true, unitPrice: '32000.00', unit: 'piece', warrantyMonths: 36, inStock: 4 },
  { id: 'prod_3', sku: 'PANEL-335W-MONO', name: 'Solar Panel 335W Mono-PERC', category: 'PANEL', isSerialized: false, unitPrice: '9200.00', unit: 'piece', warrantyMonths: 240, inStock: 84 },
  { id: 'prod_4', sku: 'BAT-48V-100AH', name: 'Lithium Battery 48V 100Ah', category: 'BATTERY', isSerialized: true, unitPrice: '45000.00', unit: 'piece', warrantyMonths: 36, inStock: 8 },
  { id: 'prod_5', sku: 'WIRE-4SQMM-100M', name: 'Solar DC Cable 4 sq.mm (100m)', category: 'WIRE', isSerialized: false, unitPrice: '3500.00', unit: 'roll', warrantyMonths: 12, inStock: 22 },
  { id: 'prod_6', sku: 'EARTH-KIT-HD', name: 'Heavy Duty Earthing Kit', category: 'EARTHING', isSerialized: false, unitPrice: '4200.00', unit: 'kit', warrantyMonths: 24, inStock: 15 },
];

export const mockInventory = [
  { productId: 'prod_3', sku: 'PANEL-335W-MONO', name: 'Solar Panel 335W Mono-PERC', category: 'PANEL', quantityOnHand: 84, unit: 'piece', reorderThreshold: 20 },
  { productId: 'prod_5', sku: 'WIRE-4SQMM-100M', name: 'Solar DC Cable 4 sq.mm (100m)', category: 'WIRE', quantityOnHand: 22, unit: 'roll', reorderThreshold: 5 },
  { productId: 'prod_6', sku: 'EARTH-KIT-HD', name: 'Heavy Duty Earthing Kit', category: 'EARTHING', quantityOnHand: 15, unit: 'kit', reorderThreshold: 5 },
];

export const mockDispatches = [
  { id: 'disp_101', orderId: 'ord_101', customerName: 'Rohit Verma', scheduledDate: '2026-11-22', status: 'PREPARED', serializedCount: 1, nonSerializedItemsCount: 3 },
  { id: 'disp_102', orderId: 'ord_102', customerName: 'Sunita Joshi', scheduledDate: '2026-11-19', status: 'DISPATCHED', serializedCount: 2, nonSerializedItemsCount: 4 },
  { id: 'disp_103', orderId: 'ord_103', customerName: 'Apex Textiles Ltd', scheduledDate: '2026-11-15', status: 'DISPATCHED', serializedCount: 2, nonSerializedItemsCount: 5 },
];

export const mockPassport = {
  serialNumber: 'INV-2026-000481',
  productName: '3kW Grid-Tie Inverter',
  manufacturer: 'SampleSolar Inc.',
  model: 'SS-INV-3K',
  status: 'INSTALLED',
  customer: {
    id: 'cust_1',
    name: 'Rohit Verma',
    phone: '9876543210',
    address: '12 MG Road, Pune',
  },
  installationOrderId: 'ord_101',
  deliveredAt: '2025-05-02T00:00:00.000Z',
  warranty: {
    startDate: '2025-05-02T00:00:00.000Z',
    expiryDate: '2027-05-02T00:00:00.000Z',
    status: 'ACTIVE',
  },
  photos: [
    { filePath: 'installations/ord1/roof-1.jpg', caption: 'Completed rooftop inverter array' },
    { filePath: 'installations/ord1/wiring-2.jpg', caption: 'AC/DC distribution box isolation' },
  ],
  serviceHistory: [
    {
      ticketNumber: 'SVC-00042',
      issueDescription: 'Grid sync intermittent error during peak hours',
      status: 'RESOLVED',
      warrantyCovered: true,
      createdAt: '2026-08-10T10:00:00.000Z',
      resolvedAt: '2026-08-11T16:00:00.000Z',
    },
  ],
};

export const mockServiceTickets = [
  { id: 'tkt_1', ticketNumber: 'SVC-00042', serialNumber: 'INV-2026-000481', customerName: 'Rohit Verma', issueDescription: 'Grid sync intermittent error', faultCode: 'E04', warrantyCovered: true, status: 'RESOLVED', createdAt: '2026-08-10T10:00:00.000Z' },
  { id: 'tkt_2', ticketNumber: 'SVC-00043', serialNumber: 'BAT-2025-001092', customerName: 'Sunita Joshi', issueDescription: 'Low backup duration overnight', faultCode: 'B02', warrantyCovered: true, status: 'IN_PROGRESS', createdAt: '2026-11-19T11:30:00.000Z' },
  { id: 'tkt_3', ticketNumber: 'SVC-00044', serialNumber: 'INV-2024-000105', customerName: 'Apex Textiles Ltd', issueDescription: 'Physical terminal burnout due to lightning strike', faultCode: 'EXT_FAIL', warrantyCovered: false, status: 'AWAITING_PARTS', createdAt: '2026-11-20T15:00:00.000Z' },
];

export const mockInstallations = [
  { id: 'inst_1', orderId: 'ord_101', customerName: 'Rohit Verma', address: '12 MG Road, Pune', capacityKw: 3, status: 'DISPATCHED', scheduledDate: '2026-11-22', checklist: { panelsMounted: true, inverterConnected: false, earthingTested: false, generationTested: false } },
  { id: 'inst_2', orderId: 'ord_102', customerName: 'Sunita Joshi', address: 'Plot 88, Model Colony, Pune', capacityKw: 5, status: 'INSTALLED', scheduledDate: '2026-11-19', checklist: { panelsMounted: true, inverterConnected: true, earthingTested: true, generationTested: true } },
];
