import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import Navbar from '../../components/Navbar';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    PieChart, Pie, Cell, ResponsiveContainer,
    LineChart, Line,
} from 'recharts';
import {
    FiShoppingBag, FiDollarSign, FiTrendingUp, FiUsers,
    FiAward, FiRefreshCw
} from 'react-icons/fi';

const PIE_COLORS = ['#22c55e', '#3b82f6', '#f97316'];
const BAR_COLOR = '#ff0000';
const LINE_COLOR = '#3b82f6';

const PERIODS = ['daily', 'weekly', 'monthly'];
const METHODS = ['all', 'cash', 'card', 'upi'];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '10px',
                padding: '10px 14px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                fontSize: '0.82rem',
            }}>
                <p style={{ fontWeight: 700, marginBottom: 4, color: '#1a1a2e' }}>{label}</p>
                {payload.map((p, i) => (
                    <p key={i} style={{ color: p.color }}>
                        {p.name}: {p.name === 'Revenue' ? `₹${p.value}` : p.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export default function Dashboard() {
    const [period, setPeriod] = useState('daily');
    const [paymentMethod, setPaymentMethod] = useState('all');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = { period };
            if (paymentMethod !== 'all') params.paymentMethod = paymentMethod;
            const res = await api.get('/dashboard', { params });
            setData(res.data);
        } catch (err) {
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    }, [period, paymentMethod]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const pieData = data
        ? [
            { name: 'Cash', value: data.paymentBreakdown.cash },
            { name: 'Card', value: data.paymentBreakdown.card },
            { name: 'UPI', value: data.paymentBreakdown.upi },
        ].filter((d) => d.value > 0)
        : [];

    const statCards = data
        ? [
            {
                label: 'Total Orders',
                value: data.summary.totalOrders,
                icon: <FiShoppingBag size={22} />,
                color: '#3b82f6',
                bg: 'rgba(59,130,246,0.08)',
            },
            {
                label: 'Total Revenue',
                value: `₹${data.summary.totalRevenue.toLocaleString('en-IN')}`,
                icon: <FiDollarSign size={22} />,
                color: '#22c55e',
                bg: 'rgba(34,197,94,0.08)',
            },
            {
                label: 'Avg Order Value',
                value: `₹${data.summary.avgOrderValue.toLocaleString('en-IN')}`,
                icon: <FiTrendingUp size={22} />,
                color: '#f97316',
                bg: 'rgba(249,115,22,0.08)',
            },
            {
                label: 'Repeat Customers',
                value: `${data.summary.repeatPercent}%`,
                icon: <FiUsers size={22} />,
                color: '#ff0000',
                bg: 'rgba(255,0,0,0.07)',
            },
        ]
        : [];

    return (
        <div>
            <Navbar activePage="dashboard" />

            <div className="dashboard-page">
                {/* ── Top Controls ─────────────────────────────────────── */}
                <div className="dashboard-controls">
                    <div className="dashboard-title">
                        <h2>📊 Analytics Dashboard</h2>
                        <button
                            className="btn-refresh"
                            onClick={fetchData}
                            title="Refresh"
                        >
                            <FiRefreshCw size={15} />
                        </button>
                    </div>

                    <div className="dashboard-filters">
                        {/* Period tabs */}
                        <div className="period-tabs">
                            {PERIODS.map((p) => (
                                <button
                                    key={p}
                                    className={`period-tab ${period === p ? 'active' : ''}`}
                                    onClick={() => setPeriod(p)}
                                >
                                    {p.charAt(0).toUpperCase() + p.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* Payment method chips */}
                        <div className="method-chips">
                            {METHODS.map((m) => (
                                <button
                                    key={m}
                                    className={`method-chip ${paymentMethod === m ? 'active' : ''}`}
                                    onClick={() => setPaymentMethod(m)}
                                >
                                    {m === 'all' ? 'All Methods' : m.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="dashboard-loading">
                        <div className="spinner" />
                        <p>Loading analytics…</p>
                    </div>
                ) : !data ? null : (
                    <>
                        {/* ── Stat Cards ────────────────────────────────── */}
                        <div className="stat-cards">
                            {statCards.map((card) => (
                                <div key={card.label} className="stat-card">
                                    <div
                                        className="stat-card-icon"
                                        style={{ background: card.bg, color: card.color }}
                                    >
                                        {card.icon}
                                    </div>
                                    <div className="stat-card-body">
                                        <div className="stat-card-value" style={{ color: card.color }}>
                                            {card.value}
                                        </div>
                                        <div className="stat-card-label">{card.label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* ── Charts Row 1: Sales + Payment ─────────────── */}
                        <div className="charts-row">
                            {/* Sales Chart */}
                            <div className="chart-card wide">
                                <div className="chart-card-title">
                                    <FiTrendingUp size={16} />
                                    Sales Overview
                                    <span className="chart-subtitle">
                                        {period === 'daily' ? 'Last 7 days'
                                            : period === 'weekly' ? 'Last 4 weeks'
                                                : 'Last 6 months'}
                                    </span>
                                </div>
                                {data.salesChart.length === 0 ? (
                                    <div className="chart-empty">No sales in this period</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={240}>
                                        <BarChart data={data.salesChart} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                            <XAxis
                                                dataKey="label"
                                                tick={{ fontSize: 11, fill: '#94a3b8' }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                yAxisId="left"
                                                tick={{ fontSize: 11, fill: '#94a3b8' }}
                                                axisLine={false}
                                                tickLine={false}
                                                tickFormatter={(v) => `₹${v}`}
                                            />
                                            <YAxis
                                                yAxisId="right"
                                                orientation="right"
                                                tick={{ fontSize: 11, fill: '#94a3b8' }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                                            <Bar
                                                yAxisId="left"
                                                dataKey="revenue"
                                                name="Revenue"
                                                fill={BAR_COLOR}
                                                radius={[4, 4, 0, 0]}
                                                fillOpacity={0.85}
                                            />
                                            <Line
                                                yAxisId="right"
                                                type="monotone"
                                                dataKey="orders"
                                                name="Orders"
                                                stroke={LINE_COLOR}
                                                strokeWidth={2}
                                                dot={{ r: 3, fill: LINE_COLOR }}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>

                            {/* Payment Pie Chart */}
                            <div className="chart-card">
                                <div className="chart-card-title">
                                    💳 Payment Methods
                                </div>
                                {pieData.length === 0 ? (
                                    <div className="chart-empty">No data</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={240}>
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={55}
                                                outerRadius={90}
                                                paddingAngle={3}
                                                dataKey="value"
                                                label={({ name, percent }) =>
                                                    `${name} ${(percent * 100).toFixed(0)}%`
                                                }
                                                labelLine={false}
                                            >
                                                {pieData.map((_, idx) => (
                                                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(v) => [`${v} orders`, '']}
                                            />
                                            <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>

                        {/* ── Charts Row 2: Best Selling Items ──────────── */}
                        <div className="chart-card" style={{ marginBottom: '1.5rem' }}>
                            <div className="chart-card-title">
                                <FiAward size={16} />
                                Top 5 Best-Selling Items
                            </div>
                            {data.bestSelling.length === 0 ? (
                                <div className="chart-empty">No sales data</div>
                            ) : (
                                <>
                                    <ResponsiveContainer width="100%" height={220}>
                                        <BarChart
                                            data={data.bestSelling}
                                            layout="vertical"
                                            margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                            <XAxis
                                                type="number"
                                                tick={{ fontSize: 11, fill: '#94a3b8' }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                type="category"
                                                dataKey="name"
                                                tick={{ fontSize: 12, fill: '#475569' }}
                                                axisLine={false}
                                                tickLine={false}
                                                width={110}
                                            />
                                            <Tooltip
                                                formatter={(v, name) => [
                                                    name === 'qty' ? `${v} sold` : `₹${v}`,
                                                    name === 'qty' ? 'Qty Sold' : 'Revenue',
                                                ]}
                                            />
                                            <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                                            <Bar
                                                dataKey="qty"
                                                name="Qty Sold"
                                                fill="#ff0000"
                                                radius={[0, 4, 4, 0]}
                                                fillOpacity={0.85}
                                            />
                                            <Bar
                                                dataKey="revenue"
                                                name="Revenue (₹)"
                                                fill="#3b82f6"
                                                radius={[0, 4, 4, 0]}
                                                fillOpacity={0.75}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                    {/* Item table below chart */}
                                    <div className="best-selling-table">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Item</th>
                                                    <th>Qty Sold</th>
                                                    <th>Revenue</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.bestSelling.map((item, idx) => (
                                                    <tr key={item.name}>
                                                        <td>
                                                            <span className={`rank rank-${idx + 1}`}>{idx + 1}</span>
                                                        </td>
                                                        <td className="item-name-cell">{item.name}</td>
                                                        <td>{item.qty}</td>
                                                        <td className="revenue-cell">₹{item.revenue.toLocaleString('en-IN')}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
