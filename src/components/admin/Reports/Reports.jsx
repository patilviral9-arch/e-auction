import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

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
    import.meta.env.VITE_API_URL,
    import.meta.env.VITE_API_BASE_URL,
    axios.defaults.baseURL,
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
  return 'Unknown';
};

const formatCurrency = (value) => `$${toNumber(value).toLocaleString()}`;

const formatCurrencyCompact = (value) => {
  const amount = toNumber(value);
  if (Math.abs(amount) >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (Math.abs(amount) >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`;
  return formatCurrency(amount);
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

const isCompletedAuction = (auction) => {
  const status = normalizeStatus(auction?.status);
  if (status === 'Completed') return true;
  if (status === 'Cancelled' || status === 'Scheduled') return false;

  const completionDate = getAuctionCompletionDate(auction);
  return Boolean(completionDate && completionDate.getTime() <= Date.now());
};

const getAuctionId = (auction) => String(auction?._id || auction?.id || auction?.auctionId || '');

const getAuctionIdFromBid = (bid) => {
  const direct = bid?.auction || bid?.auctionId || bid?.listingId;
  if (typeof direct === 'string') return direct;
  if (direct && typeof direct === 'object') {
    return String(direct._id || direct.id || direct.auctionId || '');
  }
  return '';
};

const isPaidResult = (result) => {
  const status = String(result?.paymentStatus || '').trim().toLowerCase();
  return status === 'paid' || status === 'completed';
};

const getResultPaidDate = (result) =>
  parseDate(result?.paidAt) || parseDate(result?.updatedAt) || parseDate(result?.createdAt);

const getResultAuctionId = (result) => {
  const direct = result?.auction || result?.auctionId || result?.listingId;
  if (typeof direct === 'string') return direct;
  if (direct && typeof direct === 'object') {
    return String(direct._id || direct.id || direct.auctionId || '');
  }
  return '';
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

const buildWindowDays = (rangeDays) => {
  const days = [];
  const useWeekdayLabels = rangeDays <= 14;

  for (let i = rangeDays - 1; i >= 0; i -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - i);

    days.push({
      key: toDateKey(date),
      label: date.toLocaleDateString(
        'en-US',
        useWeekdayLabels
          ? { weekday: 'short' }
          : { month: 'short', day: 'numeric' }
      ),
    });
  }
  return days;
};

const csvEscape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const Reports = () => {
  const [rangeDays, setRangeDays] = useState(30);
  const [auctions, setAuctions] = useState([]);
  const [bids, setBids] = useState([]);
  const [auctionResults, setAuctionResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReportsData = async () => {
    setLoading(true);
    setError('');

    try {
      const [auctionsRes, bidsRes, resultsRes] = await Promise.allSettled([
        apiGet('/auction/auctions'),
        apiGet('/bid/bids'),
        apiGet('/auctionres/auctions'),
      ]);

      const auctionData =
        auctionsRes.status === 'fulfilled' ? extractArray(auctionsRes.value.data, ['auctions']) : [];
      const bidData = bidsRes.status === 'fulfilled' ? extractArray(bidsRes.value.data, ['bids']) : [];
      const resultData = resultsRes.status === 'fulfilled'
        ? extractArray(resultsRes.value.data, ['results', 'auctionResults'])
        : [];

      setAuctions(auctionData);
      setBids(bidData);
      setAuctionResults(resultData);

      if (
        auctionsRes.status === 'rejected' &&
        bidsRes.status === 'rejected' &&
        resultsRes.status === 'rejected'
      ) {
        setError('Could not load report data from the API. Check backend URL and server status.');
      } else if (
        auctionData.length === 0 &&
        bidData.length === 0 &&
        resultData.length === 0
      ) {
        setError('No report data found yet. Add auctions and bids to see analytics.');
      }
    } catch (err) {
      console.error('Error loading reports:', err);
      setError('Could not load reports right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, []);

  const report = useMemo(() => {
    const days = buildWindowDays(rangeDays);
    const dayBuckets = {};
    days.forEach((day) => {
      dayBuckets[day.key] = { bids: 0, revenue: 0, completed: 0 };
    });

    const periodStart = new Date();
    periodStart.setHours(0, 0, 0, 0);
    periodStart.setDate(periodStart.getDate() - (rangeDays - 1));

    const statusCounts = { Active: 0, Scheduled: 0, Completed: 0, Cancelled: 0 };
    auctions.forEach((auction) => {
      const rawStatus = normalizeStatus(auction?.status);
      if (rawStatus === 'Cancelled') {
        statusCounts.Cancelled += 1;
        return;
      }
      if (isCompletedAuction(auction)) {
        statusCounts.Completed += 1;
        return;
      }
      if (rawStatus === 'Scheduled') {
        statusCounts.Scheduled += 1;
        return;
      }
      statusCounts.Active += 1;
    });

    const auctionsById = new Map(
      auctions
        .map((auction) => [getAuctionId(auction), auction])
        .filter(([id]) => id)
    );

    const bidCountByAuction = new Map();
    const bidsInRange = [];

    bids.forEach((bid) => {
      const auctionId = getAuctionIdFromBid(bid);
      if (auctionId) {
        bidCountByAuction.set(auctionId, (bidCountByAuction.get(auctionId) || 0) + 1);
      }

      const bidDate = parseDate(bid.createdAt || bid.updatedAt);
      if (!bidDate || bidDate.getTime() < periodStart.getTime()) return;
      bidsInRange.push(bid);

      const dayKey = toDateKey(bidDate);
      if (dayBuckets[dayKey]) {
        dayBuckets[dayKey].bids += 1;
      }
    });

    const completedInRange = [];
    auctions.forEach((auction) => {
      if (!isCompletedAuction(auction)) return;
      const completedAt = getAuctionCompletionDate(auction);
      if (!completedAt || completedAt.getTime() < periodStart.getTime()) return;

      const winningBid = getAuctionWinningBid(auction);
      const dayKey = toDateKey(completedAt);
      if (dayBuckets[dayKey]) {
        dayBuckets[dayKey].completed += 1;
      }

      completedInRange.push({ auction, completedAt, winningBid });
    });

    const winningBidTotal = completedInRange.reduce((sum, item) => sum + item.winningBid, 0);
    const avgWinningBid = completedInRange.length > 0 ? winningBidTotal / completedInRange.length : 0;

    const paidResultsInRange = auctionResults.filter((result) => {
      if (!isPaidResult(result)) return false;
      const paidDate = getResultPaidDate(result);
      if (!paidDate) return false;
      return paidDate.getTime() >= periodStart.getTime();
    });

    const paidSettlementsInRange = paidResultsInRange
      .map((result) => {
        const paidDate = getResultPaidDate(result);
        if (!paidDate) return null;

        const auction = auctionsById.get(getResultAuctionId(result));
        const winningBid = getResultWinningBid(result, auctionsById);

        return {
          result,
          auction,
          paidDate,
          winningBid,
          platformFee: getPlatformFee(winningBid),
        };
      })
      .filter(Boolean);

    if (paidSettlementsInRange.length > 0) {
      paidSettlementsInRange.forEach(({ paidDate, platformFee }) => {
        const dayKey = toDateKey(paidDate);
        if (dayBuckets[dayKey]) {
          dayBuckets[dayKey].revenue += platformFee;
        }
      });
    } else {
      completedInRange.forEach(({ completedAt, winningBid }) => {
        const dayKey = toDateKey(completedAt);
        if (dayBuckets[dayKey]) {
          dayBuckets[dayKey].revenue += getPlatformFee(winningBid);
        }
      });
    }

    const platformRevenueTotal =
      paidSettlementsInRange.length > 0
        ? paidSettlementsInRange.reduce((sum, settlement) => sum + settlement.platformFee, 0)
        : completedInRange.reduce((sum, item) => sum + getPlatformFee(item.winningBid), 0);

    const revenueSourceHelper =
      paidSettlementsInRange.length > 0
        ? `5% on ${paidSettlementsInRange.length} paid auction(s)`
        : `Fallback: 5% on ${completedInRange.length} completed auction(s)`;

    const touchedAuctions = auctions.filter((auction) => {
      const createdAt = parseDate(auction.createdAt || auction.updatedAt);
      const completedAt = getAuctionCompletionDate(auction);
      return (
        (createdAt && createdAt.getTime() >= periodStart.getTime()) ||
        (completedAt && completedAt.getTime() >= periodStart.getTime())
      );
    }).length;

    const completionRate = touchedAuctions > 0 ? (completedInRange.length / touchedAuctions) * 100 : 0;

    const categoryMap = new Map();
    if (paidSettlementsInRange.length > 0) {
      paidSettlementsInRange.forEach(({ result, auction, platformFee }) => {
        const category = auction?.category || result?.category || 'Uncategorized';
        const id = getAuctionId(auction) || getResultAuctionId(result);
        const bidsCount = toNumber(
          auction?.bids ?? auction?.bidCount ?? auction?.totalBids ?? (id ? bidCountByAuction.get(id) : 0)
        );

        const current = categoryMap.get(category) || { revenue: 0, completed: 0, bids: 0 };
        current.revenue += platformFee;
        current.completed += 1;
        current.bids += bidsCount;
        categoryMap.set(category, current);
      });
    } else {
      completedInRange.forEach(({ auction, winningBid }) => {
        const category = auction.category || 'Uncategorized';
        const id = getAuctionId(auction);
        const bidsCount = toNumber(
          auction.bids ?? auction.bidCount ?? auction.totalBids ?? (id ? bidCountByAuction.get(id) : 0)
        );

        const current = categoryMap.get(category) || { revenue: 0, completed: 0, bids: 0 };
        current.revenue += getPlatformFee(winningBid);
        current.completed += 1;
        current.bids += bidsCount;
        categoryMap.set(category, current);
      });
    }

    const topCategories = [...categoryMap.entries()].sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 6);

    const completedRows = completedInRange
      .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime())
      .slice(0, 10)
      .map(({ auction, completedAt, winningBid }) => {
        const id = getAuctionId(auction);
        return {
          id: id || `${auction?.title || 'auction'}-${completedAt.getTime()}`,
          title: auction?.title || auction?.name || auction?.itemName || 'Untitled',
          category: auction?.category || 'Uncategorized',
          status: normalizeStatus(auction?.status) === 'Cancelled' ? 'Cancelled' : 'Completed',
          winningBid,
          platformFee: getPlatformFee(winningBid),
          bids: toNumber(
            auction?.bids ?? auction?.bidCount ?? auction?.totalBids ?? (id ? bidCountByAuction.get(id) : 0)
          ),
          completedAt,
        };
      });

    return {
      statusCounts,
      touchedAuctions,
      bidsInRange: bidsInRange.length,
      completedCount: completedInRange.length,
      platformRevenueTotal,
      paidSettledCount: paidSettlementsInRange.length,
      revenueSourceHelper,
      avgWinningBid,
      completionRate,
      labels: days.map((day) => day.label),
      bidsSeries: days.map((day) => dayBuckets[day.key].bids),
      revenueSeries: days.map((day) => Math.round(dayBuckets[day.key].revenue)),
      completedSeries: days.map((day) => dayBuckets[day.key].completed),
      topCategories,
      completedRows,
    };
  }, [auctions, bids, auctionResults, rangeDays]);

  const exportCsv = () => {
    if (!report.completedRows.length) return;

    const header = ['Auction', 'Category', 'Status', 'Winning Bid', 'Platform Fee (5%)', 'Total Bids', 'Completed At'];

    const rows = report.completedRows.map((row) => [
      row.title,
      row.category,
      row.status,
      toNumber(row.winningBid),
      toNumber(row.platformFee),
      row.bids,
      row.completedAt.toISOString(),
    ]);

    const csv = [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `auction-reports-last-${rangeDays}-days.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-500">
        Loading reports...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
          <p className="text-sm text-gray-500 mt-1">
            Auction analytics based on live auction and bid records.
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={rangeDays}
            onChange={(e) => setRangeDays(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button
            onClick={exportCsv}
            disabled={!report.completedRows.length}
            className="border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export CSV
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center justify-between gap-3">
          <span>{error}</span>
          <button
            onClick={fetchReportsData}
            className="text-amber-900 font-medium hover:underline whitespace-nowrap"
          >
            Retry
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[
          ['Platform Revenue', formatCurrencyCompact(report.platformRevenueTotal), report.revenueSourceHelper],
          ['Paid Settlements', report.paidSettledCount.toLocaleString(), 'Paid auction results in selected range'],
          ['Completed Auctions', report.completedCount.toLocaleString(), `Out of ${report.touchedAuctions} tracked auctions`],
          ['Bids Placed', report.bidsInRange.toLocaleString(), `Range: ${rangeDays} days`],
          ['Average Winning Bid', formatCurrencyCompact(report.avgWinningBid), 'Completed auctions only'],
          ['Completion Rate', `${report.completionRate.toFixed(1)}%`, 'Completed / tracked auctions'],
        ].map(([label, value, helper]) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">{label}</p>
            <p className="text-3xl font-bold text-gray-800">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{helper}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Bids and Platform Revenue (last {rangeDays} days)
          </h3>
          <div className="h-72">
            <Bar
              data={{
                labels: report.labels,
                datasets: [
                  {
                    label: 'Bids',
                    data: report.bidsSeries,
                    backgroundColor: '#4f46e5',
                    borderRadius: 4,
                    yAxisID: 'y',
                  },
                  {
                    label: 'Platform Revenue ($)',
                    data: report.revenueSeries,
                    backgroundColor: '#10b981',
                    borderRadius: 4,
                    yAxisID: 'y1',
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top' } },
                scales: {
                  y: { beginAtZero: true, ticks: { precision: 0 } },
                  y1: {
                    beginAtZero: true,
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    ticks: { callback: (value) => formatCurrencyCompact(value) },
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Auction Status Breakdown</h3>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="h-64 sm:w-1/2">
              <Doughnut
                data={{
                  labels: ['Active', 'Scheduled', 'Completed', 'Cancelled'],
                  datasets: [
                    {
                      data: [
                        report.statusCounts.Active,
                        report.statusCounts.Scheduled,
                        report.statusCounts.Completed,
                        report.statusCounts.Cancelled,
                      ],
                      backgroundColor: ['#4f46e5', '#f59e0b', '#10b981', '#ef4444'],
                      borderWidth: 0,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '70%',
                  plugins: { legend: { display: false } },
                }}
              />
            </div>
            <div className="space-y-2 text-sm">
              {[
                ['#4f46e5', 'Active', report.statusCounts.Active],
                ['#f59e0b', 'Scheduled', report.statusCounts.Scheduled],
                ['#10b981', 'Completed', report.statusCounts.Completed],
                ['#ef4444', 'Cancelled', report.statusCounts.Cancelled],
              ].map(([color, label, value]) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm inline-block" style={{ background: color }}></span>
                  <span className="text-gray-600">{label}</span>
                  <span className="font-semibold text-gray-800">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Completed Auctions Trend (last {rangeDays} days)
          </h3>
          <div className="h-72">
            <Line
              data={{
                labels: report.labels,
                datasets: [
                  {
                    label: 'Completed auctions',
                    data: report.completedSeries,
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.12)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 2.5,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: true } },
                scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
              }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Top Categories by Platform Revenue</h3>
          <div className="h-72">
            {report.topCategories.length ? (
              <Bar
                data={{
                  labels: report.topCategories.map(([label]) => label),
                  datasets: [
                    {
                      label: 'Platform Revenue',
                      data: report.topCategories.map(([, value]) => Math.round(value.revenue)),
                      backgroundColor: '#4f46e5',
                      borderRadius: 4,
                    },
                  ],
                }}
                options={{
                  indexAxis: 'y',
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: {
                      beginAtZero: true,
                      ticks: { callback: (value) => formatCurrencyCompact(value) },
                    },
                  },
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">
                No platform revenue yet.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Completed Auctions Report</h3>
          <span className="text-xs text-gray-500">{report.completedRows.length} rows</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Auction', 'Category', 'Winning Bid', 'Platform Fee (5%)', 'Total Bids', 'Completed At', 'Status'].map((header) => (
                  <th
                    key={header}
                    className="px-4 py-3 text-left text-xs uppercase tracking-wider text-gray-500 font-medium"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {report.completedRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
                    No completed auctions in this period.
                  </td>
                </tr>
              ) : (
                report.completedRows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{row.title}</td>
                    <td className="px-4 py-3 text-gray-600">{row.category}</td>
                    <td className="px-4 py-3 text-gray-700">{formatCurrency(row.winningBid)}</td>
                    <td className="px-4 py-3 text-green-700 font-medium">{formatCurrency(row.platformFee)}</td>
                    <td className="px-4 py-3 text-gray-600">{row.bids}</td>
                    <td className="px-4 py-3 text-gray-600">{row.completedAt.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;

