import React, { useEffect, useMemo, useState } from "react";
import { apiGet } from "../../../utils/apiClient";
const BROWSE_CATEGORIES = [
  "Electronics",
  "Vehicles",
  "Mobiles",
  "Luxury",
  "Furniture",
  "Collectibles",
  "Real Estate",
  "Industrial",
  "Art",
  "Sports",
  "Books",
];

const BROWSE_CATEGORY_ALIASES = {
  Electronics: ["electronics", "electronic", "gadget", "gadgets"],
  Vehicles: ["vehicle", "vehicles", "car", "cars", "bike", "bikes", "automobile", "automobiles"],
  Mobiles: ["mobile", "mobiles", "phone", "phones", "smartphone", "smartphones"],
  Luxury: ["luxury", "luxuries"],
  Furniture: ["furniture", "furnitures"],
  Collectibles: ["collectible", "collectibles", "antique", "antiques"],
  "Real Estate": ["real estate", "realestate", "property", "properties"],
  Industrial: ["industrial", "industry", "machinery", "machine"],
  Art: ["art", "arts", "painting", "paintings", "sculpture", "sculptures"],
  Sports: ["sport", "sports"],
  Books: ["book", "books"],
};

const normalizeCategoryText = (value = "") =>
  String(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const resolveBrowseCategory = (value = "") => {
  const normalized = normalizeCategoryText(value);
  if (!normalized) return "";
  for (const [label, aliases] of Object.entries(BROWSE_CATEGORY_ALIASES)) {
    if (aliases.some((alias) => normalizeCategoryText(alias) === normalized)) return label;
  }
  return "";
};

const toTitleCase = (value = "") =>
  String(value)
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const parseDurationToMs = (auction) => {
  if (auction?.endTime) return new Date(auction.endTime).getTime();
  const base = auction?.startDate || auction?.createdAt;
  const mins =
    auction?.durationMinutes ??
    (() => {
      const duration = auction?.duration || "";
      if (/1 hour/i.test(duration)) return 60;
      if (/6 hour/i.test(duration)) return 360;
      if (/12 hour/i.test(duration)) return 720;
      if (/3 day/i.test(duration)) return 4320;
      if (/7 day/i.test(duration)) return 10080;
      return 1440;
    })();
  if (base) return new Date(base).getTime() + mins * 60 * 1000;
  return Date.now() + mins * 60 * 1000;
};

const resolveAuctionStatus = (auction) => {
  const rawStatus = String(auction?.status || "Active").trim();
  const endTime = parseDurationToMs(auction);
  if (rawStatus.toLowerCase() === "active" && Number.isFinite(endTime) && endTime < Date.now()) {
    return "Completed";
  }
  return rawStatus;
};

const getCategoryLabel = (rawCategory = "") => {
  const mapped = resolveBrowseCategory(rawCategory);
  if (mapped) return mapped;
  const normalized = normalizeCategoryText(rawCategory);
  if (!normalized) return "Uncategorized";
  return toTitleCase(normalized);
};

const createStatRow = (category) => ({
  category,
  total: 0,
  active: 0,
  scheduled: 0,
  completed: 0,
  cancelled: 0,
});

const Categories = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [search, setSearch] = useState("");

  const fetchAuctions = async () => {
    setLoading(true);
    setFetchError("");
    try {
      const res = await apiGet("/auction/auctions");
      const data = res.data;
      const list = Array.isArray(data) ? data : data.auctions ?? data.data ?? [];
      setAuctions(Array.isArray(list) ? list : []);
    } catch (err) {
      setFetchError(err.message || "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuctions();
  }, []);

  const categoryRows = useMemo(() => {
    const map = new Map();
    BROWSE_CATEGORIES.forEach((name) => map.set(name, createStatRow(name)));

    auctions.forEach((auction) => {
      const category = getCategoryLabel(auction?.category);
      if (!map.has(category)) map.set(category, createStatRow(category));

      const row = map.get(category);
      row.total += 1;

      const status = resolveAuctionStatus(auction).toLowerCase();
      if (status === "active") row.active += 1;
      else if (status === "scheduled") row.scheduled += 1;
      else if (status === "cancelled" || status === "canceled") row.cancelled += 1;
      else row.completed += 1;
    });

    return [...map.values()].sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return a.category.localeCompare(b.category);
    });
  }, [auctions]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return categoryRows;
    return categoryRows.filter((row) => row.category.toLowerCase().includes(query));
  }, [categoryRows, search]);

  const totals = useMemo(() => {
    return categoryRows.reduce(
      (acc, row) => ({
        categories: acc.categories + 1,
        auctions: acc.auctions + row.total,
        active: acc.active + row.active,
      }),
      { categories: 0, auctions: 0, active: 0 }
    );
  }, [categoryRows]);

  return (
    <div className="p-6 w-full">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Category Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Categories are computed from Browse Auctions data.
          </p>
        </div>
        <button
          onClick={fetchAuctions}
          disabled={loading}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-xs uppercase font-semibold tracking-wide text-gray-500">Categories</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{totals.categories}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-xs uppercase font-semibold tracking-wide text-gray-500">Total Auctions</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{totals.auctions}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-xs uppercase font-semibold tracking-wide text-gray-500">Live Auctions</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{totals.active}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search category..."
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-gray-600 font-semibold">
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-center">Total</th>
                <th className="px-4 py-3 text-center">Live</th>
                <th className="px-4 py-3 text-center">Scheduled</th>
                <th className="px-4 py-3 text-center">Completed</th>
                <th className="px-4 py-3 text-center">Cancelled</th>
                <th className="px-4 py-3">Live Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    Loading categories...
                  </td>
                </tr>
              ) : fetchError ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-red-500">
                    {fetchError}
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    No categories found.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const liveShare = row.total ? Math.round((row.active / row.total) * 100) : 0;
                  return (
                    <tr key={row.category} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-gray-800">{row.category}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{row.total}</td>
                      <td className="px-4 py-3 text-center text-green-600 font-semibold">{row.active}</td>
                      <td className="px-4 py-3 text-center text-blue-600 font-semibold">{row.scheduled}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{row.completed}</td>
                      <td className="px-4 py-3 text-center text-red-500 font-semibold">{row.cancelled}</td>
                      <td className="px-4 py-3">
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-sky-400"
                            style={{ width: `${liveShare}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{liveShare}% live</p>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Categories;

