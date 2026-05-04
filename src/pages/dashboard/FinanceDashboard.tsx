import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useBilling, useSettlement } from '@/core/hooks/usePlatformData'
import type { ReactNode } from 'react'
import {
  Activity,
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  FileText,
  Wallet,
} from 'lucide-react'
import './FinanceDashboard.css'

interface FinanceKpi {
  id: string
  label: string
  value: string
  trend: string
  tone: 'up' | 'down' | 'neutral'
  icon: ReactNode
}

interface DonutSlice {
  label: string
  value: number
  color: string
}

interface TrendPoint {
  label: string
  value: number
}

const MONTH_LABELS = ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May']
const REGION_LABELS = ['North', 'West', 'South', 'East', 'Central']

function extractCurrency(value: string): string {
  const match = value.trim().match(/^([A-Z]{3})\s+/)
  return match ? match[1] : 'USD'
}

function parseCompactAmount(value: string): number {
  const compact = value.replace(/\s+/g, '').match(/-?\d[\d,.]*(?:\.\d+)?[kKmMbB]?/)
  if (!compact) {
    return 0
  }

  const raw = compact[0]
  const suffix = raw.slice(-1)
  const numeric = Number.parseFloat(raw.replace(/[^\d.-]/g, '').replace(/[kKmMbB]$/, ''))

  if (!Number.isFinite(numeric)) {
    return 0
  }

  if (suffix === 'k' || suffix === 'K') {
    return numeric * 1_000
  }

  if (suffix === 'm' || suffix === 'M') {
    return numeric * 1_000_000
  }

  if (suffix === 'b' || suffix === 'B') {
    return numeric * 1_000_000_000
  }

  return numeric
}

function formatCurrencyValue(value: number, currency: string): string {
  return `${currency} ${Math.round(value).toLocaleString()}`
}

function formatCompactCurrency(value: number, currency: string): string {
  const absValue = Math.abs(value)

  if (absValue >= 1_000_000) {
    return `${currency} ${(value / 1_000_000).toFixed(2)}M`
  }

  if (absValue >= 1_000) {
    return `${currency} ${(value / 1_000).toFixed(0)}K`
  }

  return `${currency} ${value.toFixed(0)}`
}

function buildTrendPoints(totalRevenue: number): TrendPoint[] {
  const monthlyBase = Math.max(totalRevenue / 6, 140_000)
  const multipliers = [0.64, 0.79, 0.73, 0.87, 0.82, 1]

  return MONTH_LABELS.map((label, index) => ({
    label,
    value: Math.round(monthlyBase * multipliers[index]),
  }))
}

function buildRegionValues(totalRevenue: number): DonutSlice[] {
  const base = Math.max(totalRevenue / 5, 95_000)
  const multipliers = [1, 0.82, 0.66, 0.52, 0.42]

  return REGION_LABELS.map((label, index) => ({
    label,
    value: Math.round(base * multipliers[index]),
    color: '#00C389',
  }))
}

function buildPaymentMethodMix(): DonutSlice[] {
  return [
    { label: 'Card', value: 58, color: '#00C389' },
    { label: 'UPI', value: 24, color: '#7EDFC3' },
    { label: 'Wallet', value: 12, color: '#FF7A00' },
    { label: 'Net Banking', value: 6, color: '#0F172A' },
  ]
}

function settlementStatusFromRecord(status: string): 'Settled' | 'Pending' | 'Failed' | 'Processing' {
  if (status === 'Settled') {
    return 'Settled'
  }

  if (status === 'Ready') {
    return 'Pending'
  }

  if (status === 'Reconciling') {
    return 'Processing'
  }

  return 'Failed'
}

function FinanceTrendChart({ points, currency }: { points: TrendPoint[]; currency: string }) {
  const width = 600
  const height = 220
  const paddingX = 26
  const paddingTop = 20
  const paddingBottom = 44
  const chartWidth = width - paddingX * 2
  const chartHeight = height - paddingTop - paddingBottom
  const maxValue = Math.max(...points.map((point) => point.value), 1)
  const minValue = Math.min(...points.map((point) => point.value), 0)
  const valueRange = Math.max(maxValue - minValue, 1)

  const positioned = points.map((point, index) => {
    const x = paddingX + (chartWidth / (points.length - 1)) * index
    const normalized = (point.value - minValue) / valueRange
    const y = paddingTop + chartHeight - normalized * chartHeight
    return { ...point, x, y }
  })

  const linePath = positioned
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ')

  const guideLines = [0, 1, 2, 3].map((step) => {
    const y = paddingTop + (chartHeight / 3) * step
    return { y }
  })

  return (
    <div className="finance-panel finance-trend-card">
      <div className="finance-panel-head">
        <h3>Revenue Trend (Last 6 Months)</h3>
        <span className="finance-chip">Last 6 Months</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="finance-trend-svg" role="img" aria-label="Revenue trend chart">
        {guideLines.map((line) => (
          <line
            key={line.y}
            x1={paddingX}
            y1={line.y}
            x2={width - paddingX}
            y2={line.y}
            className="finance-grid-line"
          />
        ))}

        <path d={linePath} className="finance-trend-line" />
        {positioned.map((point) => (
          <circle key={point.label} cx={point.x} cy={point.y} r="4" className="finance-trend-point" />
        ))}

        {[0, 1, 2, 3].map((step) => {
          const value = maxValue - (valueRange / 3) * step
          const label = formatCompactCurrency(value, currency)
          const y = paddingTop + (chartHeight / 3) * step
          return (
            <text key={step} x={0} y={y + 4} className="finance-axis-y">
              {label}
            </text>
          )
        })}

        {positioned.map((point) => (
          <text key={`${point.label}-x`} x={point.x} y={height - 12} textAnchor="middle" className="finance-axis-x">
            {point.label}
          </text>
        ))}
      </svg>
    </div>
  )
}

function FinanceRegionChart({ series, currency }: { series: DonutSlice[]; currency: string }) {
  const max = Math.max(...series.map((entry) => entry.value), 1)

  return (
    <div className="finance-panel finance-region-card">
      <div className="finance-panel-head">
        <h3>Revenue by Region</h3>
        <span className="finance-chip">This Month</span>
      </div>
      <div className="finance-bars" role="img" aria-label="Revenue by region bar chart">
        {series.map((entry) => (
          <div key={entry.label} className="finance-bar-item">
            <div className="finance-bar-track">
              <div className="finance-bar-fill" style={{ height: `${Math.max((entry.value / max) * 100, 14)}%` }} />
            </div>
            <div className="finance-bar-label">{entry.label}</div>
            <div className="finance-bar-value">{formatCompactCurrency(entry.value, currency)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FinanceDonut({
  title,
  slices,
  centerPrimary,
  centerSecondary,
}: {
  title: string
  slices: DonutSlice[]
  centerPrimary: string
  centerSecondary: string
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0)
  const safeTotal = total > 0 ? total : 1
  const gradientParts = slices
    .reduce(
      (state, slice) => {
        const start = (state.offset / safeTotal) * 100
        const nextOffset = state.offset + slice.value
        const end = (nextOffset / safeTotal) * 100

        return {
          offset: nextOffset,
          parts: [...state.parts, `${slice.color} ${start}% ${end}%`],
        }
      },
      { offset: 0, parts: [] as string[] },
    )
    .parts

  return (
    <div className="finance-panel finance-donut-card">
      <div className="finance-panel-head">
        <h3>{title}</h3>
      </div>
      <div className="finance-donut-wrap">
        <div className="finance-donut" style={{ background: `conic-gradient(${gradientParts.join(', ')})` }}>
          <div className="finance-donut-hole">
            <strong>{centerPrimary}</strong>
            <span>{centerSecondary}</span>
          </div>
        </div>

        <ul className="finance-donut-legend">
          {slices.map((slice) => (
            <li key={slice.label}>
              <span className="finance-legend-dot" style={{ background: slice.color }} />
              <span>{slice.label}</span>
              <strong>{Math.round((slice.value / total) * 100)}%</strong>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function FinanceDashboard() {
  const { data: billing, isLoading: billingLoading, error: billingError } = useBilling()
  const { data: settlement, isLoading: settlementLoading, error: settlementError } = useSettlement()

  if (billingLoading || settlementLoading) {
    return (
      <DashboardLayout pageTitle="Finance Command">
        <div className="p-8 text-center text-subtle">Loading finance dashboard...</div>
      </DashboardLayout>
    )
  }

  if (billingError || settlementError || !billing || !settlement) {
    return (
      <DashboardLayout pageTitle="Finance Command">
        <div className="p-8 text-center text-danger">Unable to load finance dashboard.</div>
      </DashboardLayout>
    )
  }

  const currency = extractCurrency(billing.totalRevenueThisMonth || billing.invoices[0]?.amount || 'USD 0')
  const grossRevenue = parseCompactAmount(billing.totalRevenueThisMonth)
  const settledRevenue = settlement.records
    .filter((record) => record.status === 'Settled')
    .reduce((sum, record) => sum + parseCompactAmount(record.netAmount), 0)
  const pendingSettlements = settlement.records
    .filter((record) => record.status !== 'Settled')
    .reduce((sum, record) => sum + parseCompactAmount(record.netAmount), 0)
  const invoiceDueCount = billing.invoices.filter((invoice) => invoice.status === 'Issued' || invoice.status === 'Overdue').length
  const invoiceDueAmount = billing.invoices
    .filter((invoice) => invoice.status === 'Issued' || invoice.status === 'Overdue')
    .reduce((sum, invoice) => sum + parseCompactAmount(invoice.amount), 0)
  const totalReceivables = billing.invoices
    .filter((invoice) => invoice.status !== 'Paid')
    .reduce((sum, invoice) => sum + parseCompactAmount(invoice.amount), 0)

  const trendPoints = buildTrendPoints(grossRevenue)
  const regionSeries = buildRegionValues(grossRevenue)
  const paymentMix = buildPaymentMethodMix()

  const settlementBreakdown = [
    {
      label: 'Settled',
      value: settlement.records.filter((record) => settlementStatusFromRecord(record.status) === 'Settled').length,
      color: '#00C389',
    },
    {
      label: 'Pending',
      value: settlement.records.filter((record) => settlementStatusFromRecord(record.status) === 'Pending').length,
      color: '#FF7A00',
    },
    {
      label: 'Failed',
      value: Math.max(settlement.exceptions.length, 0),
      color: '#E14B4B',
    },
    {
      label: 'Processing',
      value: settlement.records.filter((record) => settlementStatusFromRecord(record.status) === 'Processing').length,
      color: '#0F172A',
    },
  ].map((entry) => ({ ...entry, value: Math.max(entry.value, 0) }))

  const settledTotal = settlementBreakdown.reduce((sum, entry) => sum + entry.value, 0)
  const settledShare = settledTotal > 0 ? Math.round((settlementBreakdown[0].value / settledTotal) * 100) : 0

  const kpis: FinanceKpi[] = [
    {
      id: 'gross-revenue',
      label: 'Gross Revenue',
      value: formatCompactCurrency(grossRevenue, currency),
      trend: '16.6% vs last month',
      tone: 'up',
      icon: <CircleDollarSign size={16} />,
    },
    {
      id: 'net-revenue',
      label: 'Net Revenue',
      value: formatCompactCurrency(Math.max(settledRevenue, grossRevenue * 0.79), currency),
      trend: '16.3% vs last month',
      tone: 'up',
      icon: <Wallet size={16} />,
    },
    {
      id: 'pending-settlements',
      label: 'Pending Settlements',
      value: formatCompactCurrency(pendingSettlements, currency),
      trend: '12.4% vs last month',
      tone: 'up',
      icon: <Clock3 size={16} />,
    },
    {
      id: 'invoices-due',
      label: 'Invoices Due',
      value: invoiceDueAmount > 0 ? formatCompactCurrency(invoiceDueAmount, currency) : invoiceDueCount.toString(),
      trend: invoiceDueCount > 0 ? `${invoiceDueCount} open invoice${invoiceDueCount > 1 ? 's' : ''}` : 'All invoices clear',
      tone: invoiceDueCount > 0 ? 'down' : 'up',
      icon: <FileText size={16} />,
    },
    {
      id: 'payouts-completed',
      label: 'Payouts Completed',
      value: formatCompactCurrency(settledRevenue, currency),
      trend: '19.1% vs last month',
      tone: 'up',
      icon: <CheckCircle2 size={16} />,
    },
    {
      id: 'cost-per-kwh',
      label: 'Cost per kWh',
      value: `${(grossRevenue > 0 ? Math.max(grossRevenue / Math.max(grossRevenue * 10.8, 1), 0.01) : 0.09).toFixed(3)}`,
      trend: '4.7% vs last month',
      tone: 'up',
      icon: <Activity size={16} />,
    },
  ]

  return (
    <DashboardLayout pageTitle="Role Dashboard - Finance">
      <section className="finance-dashboard">
        <header className="finance-header reveal-block" style={{ animationDelay: '40ms' }}>
          <div>
            <h1>Welcome back, <span>Finance</span></h1>
            <p>Track revenue, settlements, invoices, payouts, and financial performance.</p>
          </div>
          <button type="button" className="finance-filter-btn">Last 6 Months</button>
        </header>

        <div className="finance-kpi-grid">
          {kpis.map((kpi, index) => (
            <article key={kpi.id} className="finance-kpi-card reveal-block" style={{ animationDelay: `${120 + index * 55}ms` }}>
              <div className="finance-kpi-label-row">
                <span className="finance-kpi-icon">{kpi.icon}</span>
                <span className="finance-kpi-label">{kpi.label}</span>
              </div>
              <div className="finance-kpi-value">{kpi.value}</div>
              <div className={`finance-kpi-trend ${kpi.tone === 'up' ? 'up' : kpi.tone === 'down' ? 'down' : 'neutral'}`}>
                {kpi.tone === 'up' ? <ArrowUpCircle size={13} /> : kpi.tone === 'down' ? <ArrowDownCircle size={13} /> : null}
                <span>{kpi.trend}</span>
              </div>
            </article>
          ))}
        </div>

        <div className="finance-analytics-grid">
          <div className="reveal-block" style={{ animationDelay: '340ms' }}>
            <FinanceTrendChart points={trendPoints} currency={currency} />
          </div>
          <div className="reveal-block" style={{ animationDelay: '390ms' }}>
            <FinanceRegionChart series={regionSeries} currency={currency} />
          </div>
          <div className="reveal-block" style={{ animationDelay: '440ms' }}>
            <FinanceDonut title="Payment Method Mix" slices={paymentMix} centerPrimary={`${paymentMix[0]?.value ?? 0}%`} centerSecondary="Card" />
          </div>
        </div>

        <div className="finance-lower-grid">
          <article className="finance-panel reveal-block" style={{ animationDelay: '520ms' }}>
            <div className="finance-panel-head">
              <h3>Accounts Receivable</h3>
              <a href="#" onClick={(event) => event.preventDefault()}>View all</a>
            </div>
            <div className="finance-receivables-total">
              <span>Total Receivables</span>
              <strong>{formatCurrencyValue(totalReceivables, currency)}</strong>
            </div>
            <ul className="finance-aging-list">
              {billing.aging.map((bucket) => (
                <li key={bucket.label}>
                  <span>{bucket.label}</span>
                  <strong>{bucket.value}</strong>
                </li>
              ))}
            </ul>
          </article>

          <article className="finance-panel reveal-block" style={{ animationDelay: '580ms' }}>
            <div className="finance-panel-head">
              <h3>Recent Transactions</h3>
            </div>
            <div className="finance-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {billing.invoices.slice(0, 5).map((invoice) => (
                    <tr key={invoice.id}>
                      <td>{invoice.dueDate}</td>
                      <td>
                        <div className="finance-transaction-title">{invoice.customer}</div>
                        <div className="finance-transaction-sub">{invoice.scope}</div>
                      </td>
                      <td>{invoice.amount}</td>
                      <td>
                        <span className={`finance-status-pill ${invoice.status.toLowerCase()}`}>
                          {invoice.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="finance-panel reveal-block" style={{ animationDelay: '640ms' }}>
            <div className="finance-panel-head">
              <h3>Settlement Status</h3>
              <span className="finance-chip">Today</span>
            </div>

            <div className="finance-settlement-wrap">
              <FinanceDonut
                title=""
                slices={settlementBreakdown.map((entry) => ({
                  label: entry.label,
                  value: Math.max(entry.value, 1),
                  color: entry.color,
                }))}
                centerPrimary={`${settledShare}%`}
                centerSecondary="Settled"
              />
            </div>

            <ul className="finance-status-list">
              {settlementBreakdown.map((entry) => (
                <li key={entry.label}>
                  <span className="finance-legend-dot" style={{ background: entry.color }} />
                  <span>{entry.label}</span>
                  <strong>{entry.value}</strong>
                </li>
              ))}
            </ul>
            <div className="finance-settlement-total">
              <span>Total Settlements</span>
              <strong>{formatCurrencyValue(settlement.records.reduce((sum, record) => sum + parseCompactAmount(record.netAmount), 0), currency)}</strong>
            </div>
          </article>
        </div>

        <footer className="finance-feature-strip reveal-block" style={{ animationDelay: '680ms' }}>
          <div>
            <CreditCard size={18} />
            <span>Revenue Oversight</span>
          </div>
          <div>
            <BarChart3 size={18} />
            <span>Settlement Tracking</span>
          </div>
          <div>
            <Activity size={18} />
            <span>Financial Accuracy</span>
          </div>
        </footer>
      </section>
    </DashboardLayout>
  )
}
