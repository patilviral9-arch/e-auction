import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const DEFAULT_WEEK_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
let resolvedApiBase = null;

const normalizeBase = (base) => String(base || '').trim().replace(/\/+$/, '');
const uniq = (list) => [...new Set(list.map(normalizeBase).filter(Boolean))];
const withBase = (base, path) => `${base}${path.startsWith('/') ? path : `/${path}`}`;
const isHtmlLike = (response) => {
  const contentType = String(response?.headers?.['content-type'] || '').toLowerCase();
  if (contentType.includes('text/html')) return true;

  if (typeof response?.data === 'string') {
    const sample = response.data.trim().slice(0, 80).toLowerCase();
    if (sample.startsWith('<!doctype html') || sample.startsWith('<html')) return true;
  }
  return false;
};

const getApiBaseCandidates = () =>
  uniq([
    resolvedApiBase,
    import.meta.env.VITE_API_BASE_URL,
    axios.defaults.baseURL,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    typeof window !== 'undefined' ? window.location.origin : null,
  ]);

const apiGet = async (path) => {
  const candidates = getApiBaseCandidates();
  let lastError = null;

  for (const base of candidates) {
    try {
      const response = await axios.get(withBase(base, path), { timeout: 6000 });
      if (isHtmlLike(response)) {
        lastError = new Error(`Received HTML instead of API JSON from ${withBase(base, path)}`);
        continue;
      }
      resolvedApiBase = base;
      return response;
    } catch (error) {
      lastError = error;
      const status = error?.response?.status;
      const shouldContinue = !status || status === 404 || status === 405;
      if (!shouldContinue) throw error;
    }
  }

  throw lastError || new Error(`Failed to load ${path}`);
};

const extractArray = (payload, preferredKeys = []) => {
  for (const key of preferredKeys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
};

const toNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const formatCurrency = (value) => `$${toNumber(value).toLocaleString()}`;

const formatCurrencyCompact = (value) => {
  const amount = toNumber(value);
  if (Math.abs(amount) >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (Math.abs(amount) >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`;
  return formatCurrency(amount);
};

const parseDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toDateKey = (value) => {
  const date = parseDate(value);
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeStatus = (status) => {
  const value = String(status || '').trim().toLowerCase();
  if (value === 'active' || value === 'live') return 'Active';
  if (value === 'scheduled' || value === 'upcoming') return 'Scheduled';
  if (value === 'completed' || value === 'ended') return 'Completed';
  if (value === 'cancelled' || value === 'canceled') return 'Cancelled';
  return status || '';
};

const getAuctionId = (auctionRef) => {
  if (!auctionRef) return '';
  if (typeof auctionRef === 'string') return auctionRef;
  return String(auctionRef._id || auctionRef.id || auctionRef.auctionId || '');
};

const PLATFORM_FEE_RATE = 0.05;

const getAuctionWinningBid = (auction) =>
  toNumber(
    auction?.winningBid ??
      auction?.currentBid ??
      auction?.highestBid ??
      auction?.finalBid ??
      auction?.soldPrice ??
      auction?.closingBid ??
      auction?.startingBid ??
      auction?.startBid ??
      0
  );

const getPlatformFee = (winningBid) =>
  Math.round(toNumber(winningBid) * PLATFORM_FEE_RATE);

const isPaidResult = (result) => {
  const status = String(result?.paymentStatus || '').trim().toLowerCase();
  return status === 'paid' || status === 'completed';
};

const getResultPaidDate = (result) =>
  parseDate(result?.paidAt) || parseDate(result?.updatedAt) || parseDate(result?.createdAt);

const getResultAuctionId = (result) => {
  const auctionRef = result?.auction ?? result?.auctionId ?? result?.listingId;
  return getAuctionId(auctionRef);
};

const getResultWinningBid = (result, auctionsById = new Map()) => {
  const directBid = toNumber(
    result?.winningBid ??
      result?.finalBid ??
      result?.soldPrice ??
      result?.amount ??
      result?.totalAmount
  );
  if (directBid > 0) return directBid;

  const auction = auctionsById.get(getResultAuctionId(result));
  return getAuctionWinningBid(auction);
};

const getAuctionCompletionDate = (auction) => {
  const candidates = [
    auction?.completedAt,
    auction?.closedAt,
    auction?.endDate,
    auction?.endTime,
    auction?.endsAt,
    auction?.updatedAt,
    auction?.createdAt,
  ];

  for (const candidate of candidates) {
    const date = parseDate(candidate);
    if (date) return date;
  }
  return null;
};

const getAuctionSortDate = (auction) =>
  parseDate(auction?.updatedAt) ||
  parseDate(auction?.createdAt) ||
  getAuctionCompletionDate(auction) ||
  new Date(0);

const isCompletedAuction = (auction) => {
  const status = normalizeStatus(auction?.status);
  if (status === 'Completed') return true;
  if (status === 'Cancelled' || status === 'Scheduled') return false;
  const completionDate = getAuctionCompletionDate(auction);
  return Boolean(completionDate && completionDate.getTime() <= Date.now());
};

const buildLast7Days = () => {
  const days = [];
  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - i);
    days.push({
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      key: toDateKey(date),
    });
  }
  return days;
};

const formatTimeAgo = (value) => {
  const date = parseDate(value);
  if (!date) return 'just now';

  const diffMs = Math.max(0, Date.now() - date.getTime());
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const Dashboard = () => {
  const [totalUsers, setTotalUsers] = useState('0');
  const [activeAuctions, setActiveAuctions] = useState('0');
  const [totalBids, setTotalBids] = useState('0');
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [weeklyRevenue, setWeeklyRevenue] = useState(0);
  const [auctionStatusCounts, setAuctionStatusCounts] = useState({
    Active: 0,
    Scheduled: 0,
    Completed: 0,
    Cancelled: 0,
  });
  const [recentAuctions, setRecentAuctions] = useState([]);
  const [activity, setActivity] = useState([]);
  const [weeklyChart, setWeeklyChart] = useState({
    labels: DEFAULT_WEEK_LABELS,
    bids: Array(7).fill(0),
    revenue: Array(7).fill(0),
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const [usersRes, auctionsRes, bidsRes, resultsRes] = await Promise.allSettled([
          apiGet('/user/getusers'),
          apiGet('/auction/auctions'),
          apiGet('/bid/bids'),
          apiGet('/auctionres/auctions'),
        ]);

        [usersRes, auctionsRes, bidsRes, resultsRes].forEach((result, index) => {
          if (result.status !== 'rejected') return;
          const label = ['users', 'auctions', 'bids', 'auction-results'][index];
          const failedUrl = result.reason?.config?.url || 'unknown-url';
          const status = result.reason?.response?.status || 'no-status';
          console.warn(`[Dashboard] ${label} API request failed (${status}):`, failedUrl);
        });

        const userData =
          usersRes.status === 'fulfilled'
            ? extractArray(usersRes.value.data, ['users'])
            : [];
        const auctionData =
          auctionsRes.status === 'fulfilled'
            ? extractArray(auctionsRes.value.data, ['auctions'])
            : [];
        const bidData =
          bidsRes.status === 'fulfilled'
            ? extractArray(bidsRes.value.data, ['bids'])
            : [];
        const resultData =
          resultsRes.status === 'fulfilled'
            ? extractArray(resultsRes.value.data, ['results', 'auctionResults'])
            : [];

        setTotalUsers(userData.length.toLocaleString());
        setTotalBids(bidData.length.toLocaleString());

        const activeCount = auctionData.filter(
          (auction) => normalizeStatus(auction.status) === 'Active'
        ).length;
        setActiveAuctions(activeCount.toLocaleString());

        const counts = { Active: 0, Scheduled: 0, Completed: 0, Cancelled: 0 };
        auctionData.forEach((auction) => {
          const status = normalizeStatus(auction.status);
          if (counts[status] !== undefined) counts[status] += 1;
        });
        setAuctionStatusCounts(counts);

        const auctionsById = new Map(
          auctionData
            .map((auction) => [String(auction._id || auction.id || ''), auction])
            .filter(([id]) => id)
        );

        const completedAuctions = auctionData.filter(isCompletedAuction);
        const paidResults = resultData.filter(isPaidResult);

        const totalRevenueValue =
          paidResults.length > 0
            ? paidResults.reduce(
                (sum, result) => sum + getPlatformFee(getResultWinningBid(result, auctionsById)),
                0
              )
            : completedAuctions.reduce(
                (sum, auction) => sum + getPlatformFee(getAuctionWinningBid(auction)),
                0
              );
        setTotalRevenue(totalRevenueValue);

        const days = buildLast7Days();
        const bidBuckets = {};
        const revenueBuckets = {};

        days.forEach((day) => {
          bidBuckets[day.key] = 0;
          revenueBuckets[day.key] = 0;
        });

        bidData.forEach((bid) => {
          const key = toDateKey(bid.createdAt || bid.updatedAt);
          if (key && bidBuckets[key] !== undefined) {
            bidBuckets[key] += 1;
          }
        });

        if (paidResults.length > 0) {
          paidResults.forEach((result) => {
            const paidDate = getResultPaidDate(result);
            const key = toDateKey(paidDate);
            if (key && revenueBuckets[key] !== undefined) {
              revenueBuckets[key] += getPlatformFee(getResultWinningBid(result, auctionsById));
            }
          });
        } else {
          completedAuctions.forEach((auction) => {
            const completionDate = getAuctionCompletionDate(auction);
            const key = toDateKey(completionDate);
            if (key && revenueBuckets[key] !== undefined) {
              revenueBuckets[key] += getPlatformFee(getAuctionWinningBid(auction));
            }
          });
        }

        const weeklyRevenueValue = days.reduce(
          (sum, day) => sum + (revenueBuckets[day.key] || 0),
          0
        );
        setWeeklyRevenue(weeklyRevenueValue);

        setWeeklyChart({
          labels: days.map((day) => day.label),
          bids: days.map((day) => bidBuckets[day.key] || 0),
          revenue: days.map((day) => Math.round(revenueBuckets[day.key] || 0)),
        });

        const recent = [...auctionData]
          .sort(
            (a, b) =>
              getAuctionSortDate(b).getTime() - getAuctionSortDate(a).getTime()
          )
          .slice(0, 5)
          .map((auction) => {
            const status = normalizeStatus(auction.status) || 'Unknown';
            const amount = getAuctionWinningBid(auction);
            const completionDate = getAuctionCompletionDate(auction);
            return {
              item: auction.title || auction.name || auction.itemName || 'Untitled',
              bid: amount > 0 ? formatCurrency(amount) : '-',
              ends: completionDate
                ? completionDate.toLocaleString()
                : status === 'Completed'
                ? 'Ended'
                : '-',
              status,
            };
          });
        setRecentAuctions(recent);

        const bidActivity = bidData
          .map((bid) => {
            const when = parseDate(bid.createdAt || bid.updatedAt);
            if (!when) return null;

            const auctionId = getAuctionId(bid.auction);
            const auction = auctionsById.get(auctionId);
            const title =
              bid.auctionTitle ||
              auction?.title ||
              auction?.name ||
              auction?.itemName ||
              'an auction';
            const amount = toNumber(bid.bidAmount ?? bid.amount ?? bid.currentBid);

            return {
              text: `New bid on ${title} - ${formatCurrency(amount)}`,
              time: formatTimeAgo(when),
              color: '#4f46e5',
              sortTime: when.getTime(),
            };
          })
          .filter(Boolean);

        const feeActivity =
          paidResults.length > 0
            ? paidResults
                .map((result) => {
                  const when = getResultPaidDate(result);
                  if (!when) return null;

                  const auction = auctionsById.get(getResultAuctionId(result));
                  const title =
                    result?.auctionTitle ||
                    auction?.title ||
                    auction?.name ||
                    auction?.itemName ||
                    'an auction';

                  return {
                    text: `Platform fee earned from "${title}" - ${formatCurrency(
                      getPlatformFee(getResultWinningBid(result, auctionsById))
                    )}`,
                    time: formatTimeAgo(when),
                    color: '#10b981',
                    sortTime: when.getTime(),
                  };
                })
                .filter(Boolean)
            : completedAuctions
                .map((auction) => {
                  const when = getAuctionCompletionDate(auction);
                  if (!when) return null;

                  const title =
                    auction.title || auction.name || auction.itemName || 'Untitled auction';

                  return {
                    text: `Platform fee earned from "${title}" - ${formatCurrency(
                      getPlatformFee(getAuctionWinningBid(auction))
                    )}`,
                    time: formatTimeAgo(when),
                    color: '#10b981',
                    sortTime: when.getTime(),
                  };
                })
                .filter(Boolean);

        const userActivity = userData
          .map((user) => {
            const when = parseDate(user.createdAt || user.updatedAt);
            if (!when) return null;

            const name =
              user.username ||
              user.userName ||
              user.businessName ||
              [user.firstName, user.lastName].filter(Boolean).join(' ') ||
              user.email;

            if (!name) return null;

            return {
              text: `User ${name} registered`,
              time: formatTimeAgo(when),
              color: '#059669',
              sortTime: when.getTime(),
            };
          })
          .filter(Boolean);

        const latestActivity = [...bidActivity, ...feeActivity, ...userActivity]
          .sort((a, b) => b.sortTime - a.sortTime)
          .slice(0, 5)
          .map(({ sortTime, ...event }) => event);

        setActivity(latestActivity);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  const revenueChangeText =
    weeklyRevenue > 0
      ? `+${formatCurrencyCompact(weeklyRevenue)} last 7 days`
      : 'No platform revenue in last 7 days';

  const metrics = [
    { label: 'Total Users', value: loading ? '...' : totalUsers, change: 'Live data', up: true },
    {
      label: 'Active Auctions',
      value: loading ? '...' : activeAuctions,
      change: 'Live data',
      up: true,
    },
    { label: 'Total Bids', value: loading ? '...' : totalBids, change: 'Live data', up: true },
    {
      label: 'Platform Revenue',
      value: loading ? '...' : formatCurrencyCompact(totalRevenue),
      change: loading ? 'Loading...' : revenueChangeText,
      up: weeklyRevenue > 0,
    },
  ];

  const statusColors = {
    Active: 'bg-blue-100 text-blue-700',
    Completed: 'bg-gray-100 text-gray-600',
    Scheduled: 'bg-yellow-100 text-yellow-700',
    Cancelled: 'bg-red-100 text-red-600',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      {/* Metrics Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 transition-all hover:shadow-md"
          >
            <p className="text-sm text-gray-500 mb-1">{metric.label}</p>
            <p className="text-3xl font-bold text-gray-800">{metric.value}</p>
            <p className={`text-xs mt-1 ${metric.up ? 'text-green-600' : 'text-gray-500'}`}>
              {metric.change}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Bids & Platform Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Bids & Platform Revenue - Last 7 Days</h3>
          <Bar
            data={{
              labels: weeklyChart.labels,
              datasets: [
                {
                  label: 'Bids',
                  data: weeklyChart.bids,
                  backgroundColor: '#4f46e5',
                  borderRadius: 4,
                },
                {
                  label: 'Platform Revenue ($)',
                  data: weeklyChart.revenue,
                  backgroundColor: '#10b981',
                  borderRadius: 4,
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: { legend: { position: 'top', labels: { font: { size: 11 } } } },
              scales: { y: { beginAtZero: true } },
            }}
          />
        </div>

        {/* Status Breakdown Chart */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Auction Status Breakdown</h3>
          <div className="flex items-center justify-around">
            <div style={{ width: 180, height: 180 }}>
              <Doughnut
                data={{
                  labels: ['Active', 'Scheduled', 'Completed', 'Cancelled'],
                  datasets: [
                    {
                      data: [
                        auctionStatusCounts.Active,
                        auctionStatusCounts.Scheduled,
                        auctionStatusCounts.Completed,
                        auctionStatusCounts.Cancelled,
                      ],
                      backgroundColor: ['#4f46e5', '#f59e0b', '#10b981', '#ef4444'],
                      borderWidth: 0,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  cutout: '65%',
                  plugins: { legend: { display: false } },
                }}
              />
            </div>
            <div className="text-sm space-y-2">
              {[
                ['#4f46e5', 'Active', auctionStatusCounts.Active],
                ['#f59e0b', 'Scheduled', auctionStatusCounts.Scheduled],
                ['#10b981', 'Completed', auctionStatusCounts.Completed],
                ['#ef4444', 'Cancelled', auctionStatusCounts.Cancelled],
              ].map(([color, label, value]) => (
                <div key={label} className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-sm inline-block"
                    style={{ background: color }}
                  ></span>
                  <span className="text-gray-600">{label}</span>
                  <span className="font-semibold text-gray-800">{loading ? '...' : value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Recent Auctions Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex justify-between items-center px-5 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Recent Auctions</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Item', 'Bid', 'Ends', 'Status'].map((header) => (
                  <th
                    key={header}
                    className="px-4 py-2 text-left text-xs text-gray-500 font-medium"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-4 py-6 text-center text-sm text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : recentAuctions.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 py-6 text-center text-sm text-gray-400">
                    No auctions found
                  </td>
                </tr>
              ) : (
                recentAuctions.map((auction, index) => (
                  <tr key={index} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-800">{auction.item}</td>
                    <td className="px-4 py-2 text-gray-600">{auction.bid}</td>
                    <td className="px-4 py-2 text-gray-600">{auction.ends}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          statusColors[auction.status] || ''
                        }`}
                      >
                        {auction.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Recent Activity</h3>
          </div>
          {loading ? (
            <div className="px-5 py-6 text-sm text-gray-400">Loading...</div>
          ) : activity.length === 0 ? (
            <div className="px-5 py-6 text-sm text-gray-400">No recent activity</div>
          ) : (
            activity.map((event, index) => (
              <div key={index} className="flex gap-3 px-5 py-3 border-b border-gray-50 last:border-0">
                <span
                  className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0"
                  style={{ background: event.color }}
                ></span>
                <div>
                  <p className="text-sm text-gray-700">{event.text}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{event.time}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
