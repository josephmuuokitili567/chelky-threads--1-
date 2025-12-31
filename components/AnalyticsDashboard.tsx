import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, ShoppingCart, DollarSign, BarChart3, AlertCircle } from 'lucide-react';

interface AnalyticsOverview {
  totalRevenue: number;
  totalOrders: number;
  completedOrders: number;
  completionRate: number;
  totalCustomers: number;
  totalProducts: number;
  averageRating: number;
  totalReviews: number;
}

interface RevenueData {
  date: string;
  revenue: number;
}

interface OrderStatusData {
  status: string;
  count: number;
}

interface TopProductData {
  productId: string;
  name: string;
  sales: number;
}

interface CustomerMetrics {
  totalCustomers: number;
  oneTimeCustomers: number;
  repeatCustomers: number;
  repeatRate: number;
  averageOrdersPerCustomer: number;
}

interface PaymentMethodData {
  method: string;
  count: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

const AnalyticsDashboard: React.FC<{ token: string }> = ({ token }) => {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [orderData, setOrderData] = useState<OrderStatusData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductData[]>([]);
  const [customerMetrics, setCustomerMetrics] = useState<CustomerMetrics | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, [token]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!token) {
        setError('No authentication token found. Please log in again.');
        setLoading(false);
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const endpoints = [
        { url: '/api/analytics/overview', setState: setOverview },
        { url: '/api/analytics/revenue', setState: setRevenueData },
        { url: '/api/analytics/orders', setState: setOrderData },
        { url: '/api/analytics/top-products', setState: setTopProducts },
        { url: '/api/analytics/customer-metrics', setState: setCustomerMetrics },
        { url: '/api/analytics/payment-methods', setState: setPaymentMethods }
      ];

      const results = await Promise.allSettled(
        endpoints.map(async ({ url, setState }) => {
          try {
            const response = await fetch(url, { headers });
            
            if (!response.ok) {
              console.error(`${url} returned ${response.status}: ${response.statusText}`);
              // Set appropriate default based on what the component expects
              if (url.includes('overview') || url.includes('customer-metrics')) {
                setState(null);
              } else {
                setState([]);
              }
              return;
            }
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
              console.warn(`${url} returned non-JSON content type: ${contentType}`);
              if (url.includes('overview') || url.includes('customer-metrics')) {
                setState(null);
              } else {
                setState([]);
              }
              return;
            }
            
            const text = await response.text();
            if (!text || text.trim() === '') {
              console.warn(`Empty response from ${url}`);
              if (url.includes('overview') || url.includes('customer-metrics')) {
                setState(null);
              } else {
                setState([]);
              }
              return;
            }
            
            try {
              const data = JSON.parse(text);
              setState(data);
            } catch (parseErr) {
              console.error(`Failed to parse JSON from ${url}:`, parseErr);
              console.error('Response text:', text.substring(0, 200));
              if (url.includes('overview') || url.includes('customer-metrics')) {
                setState(null);
              } else {
                setState([]);
              }
            }
          } catch (err) {
            console.error(`Network error fetching ${url}:`, err);
            if (url.includes('overview') || url.includes('customer-metrics')) {
              setState(null);
            } else {
              setState([]);
            }
          }
        })
      );

      // Check if all requests failed
      const allFailed = results.every(r => r.status === 'rejected');
      if (allFailed) {
        setError('Failed to load analytics data. Please try refreshing the page.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
        <AlertCircle className="text-red-600" size={20} />
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {overview && (
          <>
            <KPICard
              title="Total Revenue"
              value={`KES ${overview.totalRevenue.toLocaleString()}`}
              icon={<DollarSign className="text-green-600" />}
              trend="+12.5%"
              color="bg-green-50"
            />
            <KPICard
              title="Total Orders"
              value={overview.totalOrders.toString()}
              icon={<ShoppingCart className="text-blue-600" />}
              subtext={`${overview.completedOrders} completed`}
              color="bg-blue-50"
            />
            <KPICard
              title="Total Customers"
              value={overview.totalCustomers.toString()}
              icon={<Users className="text-purple-600" />}
              subtext={`${overview.totalProducts} products`}
              color="bg-purple-50"
            />
            <KPICard
              title="Avg Rating"
              value={overview.averageRating.toString()}
              icon={<TrendingUp className="text-orange-600" />}
              subtext={`${overview.totalReviews} reviews`}
              color="bg-orange-50"
            />
          </>
        )}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `KES ${value.toLocaleString()}`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">No revenue data available</p>
          )}
        </div>

        {/* Order Status Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Order Status Distribution</h3>
          {orderData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={orderData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">No order data available</p>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Top 10 Products</h3>
          {topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts} layout="vertical" margin={{ left: 100, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="sales" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">No product data available</p>
          )}
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Payment Methods</h3>
          {paymentMethods.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentMethods}
                  dataKey="count"
                  nameKey="method"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {paymentMethods.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">No payment data available</p>
          )}
        </div>
      </div>

      {/* Customer Metrics */}
      {customerMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="One-Time Customers"
            value={customerMetrics.oneTimeCustomers.toString()}
            percentage={(customerMetrics.oneTimeCustomers / customerMetrics.totalCustomers * 100).toFixed(1) + '%'}
            color="bg-red-50"
          />
          <MetricCard
            title="Repeat Customers"
            value={customerMetrics.repeatCustomers.toString()}
            percentage={customerMetrics.repeatRate.toString() + '%'}
            color="bg-green-50"
          />
          <MetricCard
            title="Avg Orders/Customer"
            value={customerMetrics.averageOrdersPerCustomer.toString()}
            percentage="Per customer"
            color="bg-blue-50"
          />
        </div>
      )}
    </div>
  );
};

interface KPICardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  subtext?: string;
  color: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, icon, trend, subtext, color }) => (
  <div className={`${color} rounded-lg shadow p-6 border-l-4 border-blue-600`}>
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-gray-600 text-sm font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 mt-2">{value}</h3>
        {trend && <p className="text-green-600 text-xs font-semibold mt-1">{trend} from last period</p>}
        {subtext && <p className="text-gray-600 text-xs mt-1">{subtext}</p>}
      </div>
      <div>{icon}</div>
    </div>
  </div>
);

interface MetricCardProps {
  title: string;
  value: string;
  percentage: string;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, percentage, color }) => (
  <div className={`${color} rounded-lg shadow p-4`}>
    <p className="text-gray-600 text-sm font-medium">{title}</p>
    <h3 className="text-2xl font-bold text-gray-900 mt-2">{value}</h3>
    <p className="text-gray-500 text-xs mt-1">{percentage}</p>
  </div>
);

export default AnalyticsDashboard;
