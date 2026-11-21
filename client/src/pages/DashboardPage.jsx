import React, { useState } from 'react';
import {
  TrendingUp,
  CreditCard,
  Receipt,
  LifeBuoy,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import PageContainer from '../layouts/PageContainer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { mockDashboardSummary, mockProfitability } from '../services/mockData';

export function DashboardPage() {
  const [range, setRange] = useState('month');
  const summary = mockDashboardSummary;
  const profitability = mockProfitability;

  // Visual distinction between recorded and estimated figures (FR-111 & FR-112)
  const chartData = profitability.map((item) => ({
    name: item.customerName.split(' ')[0],
    revenue: parseFloat(item.recordedPayments),
    costs: parseFloat(item.bomCost) + parseFloat(item.jobExpenses),
    margin: parseFloat(item.estimatedMargin),
  }));

  return (
    <PageContainer
      title="Executive Operations Dashboard"
      subtitle="Financial overview, job margins, and real-time operations status"
      actions={
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-xl shadow-2xs">
          {['today', 'week', 'month'].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${
                range === r
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              This {r}
            </button>
          ))}
        </div>
      }
    >
      {/* FR-112 Audit Note Callout */}
      <div className="p-3.5 bg-amber-50/80 border border-amber-200/90 rounded-xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <strong>Accounting Transparency Guard (FR-111 & FR-112):</strong> Figures shown below visually distinguish <em>Recorded</em> sums (backed by actual Payment/JobExpense ledger rows) from <em>Estimated Margin</em> (which excludes unbooked administrative overhead).
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Recorded Revenue */}
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Recorded Revenue
              </span>
              <div className="text-2xl font-bold text-slate-900">
                ₹{parseFloat(summary.recordedRevenue).toLocaleString('en-IN')}
              </div>
              <span className="inline-flex items-center text-[11px] font-medium text-emerald-600 gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed Payments
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <CreditCard className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Recorded Expenses */}
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Recorded Expenses
              </span>
              <div className="text-2xl font-bold text-slate-900">
                ₹{parseFloat(summary.recordedExpenses).toLocaleString('en-IN')}
              </div>
              <span className="inline-flex items-center text-[11px] font-medium text-slate-500 gap-1">
                <Receipt className="w-3.5 h-3.5" /> Job Expenses Ledger
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <Receipt className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Outstanding Balance */}
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Outstanding Balance
              </span>
              <div className="text-2xl font-bold text-amber-600">
                ₹{parseFloat(summary.outstandingBalance).toLocaleString('en-IN')}
              </div>
              <span className="inline-flex items-center text-[11px] font-medium text-amber-700 gap-1">
                Customer Balance Due
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <TrendingUp className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Open Service Tickets */}
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Open Support Tickets
              </span>
              <div className="text-2xl font-bold text-slate-900">
                {summary.openServiceTickets}
              </div>
              <span className="inline-flex items-center text-[11px] font-medium text-blue-600 gap-1">
                Active Cases In Progress
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <LifeBuoy className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts & Profitability Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue vs Margin Chart */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Job Revenue vs Estimated Margin</CardTitle>
            <CardDescription>Visual comparison per recent installation order</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={(val) => `₹${Number(val).toLocaleString('en-IN')}`}
                    contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="revenue" name="Recorded Revenue" fill="#0f172a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="margin" name="Estimated Margin" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Per-Order Profitability Table (FR-111) */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Per-Order Estimated Margin (FR-111)</CardTitle>
              <CardDescription>
                Formula: Recorded Payments − (BOM Cost + Job Expenses)
              </CardDescription>
            </div>
            <Badge status="ADMIN" label="Admin Only" showDot={false} />
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order / Customer</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Recorded Payments</TableHead>
                  <TableHead>BOM + Expenses</TableHead>
                  <TableHead>Estimated Margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profitability.map((row) => (
                  <TableRow key={row.orderId}>
                    <TableCell>
                      <div className="font-semibold text-slate-900">{row.customerName}</div>
                      <div className="text-xs text-slate-400 font-mono">{row.orderId}</div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{row.capacityKw} kW</span>{' '}
                      <span className="text-xs text-slate-500">({row.systemType})</span>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      ₹{parseFloat(row.recordedPayments).toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-600">
                      ₹{(parseFloat(row.bomCost) + parseFloat(row.jobExpenses)).toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80 font-mono font-semibold text-xs">
                        ₹{parseFloat(row.estimatedMargin).toLocaleString('en-IN')}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

export default DashboardPage;
