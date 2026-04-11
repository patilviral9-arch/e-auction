import React, { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import { toINR, formatEnd } from "./auctionConstants";
import AuctionModal from "./AuctionModal";
import { apiDelete, apiGet, apiPut } from "../../../utils/apiClient";

// ── Status badge colours ──────────────────────────────────────────────────────
const statusStyle = {
  Active:    "bg-green-100 text-green-700",
  Scheduled: "bg-blue-100 text-blue-700",
  Ended:     "bg-gray-200 text-gray-700",
  Cancelled: "bg-red-100 text-red-700",
};

// ── Component ─────────────────────────────────────────────────────────────────
const Auctions = () => {
  const [auctions,       setAuctions]       = useState([]);
  const [usersMap,       setUsersMap]       = useState({});
  const [search,         setSearch]         = useState("");
  const [statusFilter,   setStatusFilter]   = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [loading,        setLoading]        = useState(true);
  const [dropdown,       setDropdown]       = useState(null);
  const [modal,          setModal]          = useState(null); // null | { mode:"edit"|"add", auction? }
  const dropdownRef = useRef(null);

  useEffect(() => { fetchAuctions(); }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdown(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const fetchAuctions = async () => {
    try {
      const res  = await apiGet("/auction/auctions");
      const data = res.data?.auctions || res.data?.data || res.data || [];
      const arr  = Array.isArray(data) ? data : [];
      setAuctions(arr);
      await resolveSellerNames(arr);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resolveSellerNames = async (auctionList) => {
    const SELLER_FIELDS = ["seller","sellerId","userId","createdBy","owner","postedBy","user","listedBy","auctioneer"];
    const idSet = new Set();
    auctionList.forEach(a => {
      SELLER_FIELDS.forEach(field => {
        const val = a[field];
        if (typeof val === "string" && val.length > 0) idSet.add(val);
        if (val && typeof val === "object" && val._id) idSet.add(val._id);
      });
    });
    const uniqueIds = [...idSet];
    if (uniqueIds.length === 0) return;

    const results = await Promise.allSettled(
      uniqueIds.map(id => apiGet(`/user/getuser/${id}`))
    );
    const map = {};
    results.forEach((result, i) => {
      const id = uniqueIds[i];
      if (result.status === "fulfilled") {
        const u = result.value.data?.user || result.value.data?.data || result.value.data;
        if (u) {
          map[id] = u.role === "business"
            ? u.businessName || u.firstName || u.email || id
            : `${u.firstName||""} ${u.lastName||""}`.trim() || u.email || id;
        }
      }
    });
    setUsersMap(map);
  };

  const getSellerName = (a) => {
    const SELLER_FIELDS = ["seller","sellerId","userId","createdBy","owner","postedBy","user","listedBy","auctioneer"];
    for (const field of SELLER_FIELDS) {
      const val = a[field];
      if (!val) continue;
      if (typeof val === "object") {
        const name = val.businessName || `${val.firstName||""} ${val.lastName||""}`.trim() || val.email;
        if (name) return name;
        if (val._id && usersMap[val._id]) return usersMap[val._id];
      }
      if (typeof val === "string" && usersMap[val]) return usersMap[val];
    }
    return "—";
  };

  // ── Actions ────────────────────────────────────────────────────────────────
  const updateStatus = async (id, newStatus) => {
    try {
      await apiPut(`/auction/auction/${id}`, { status: newStatus });
      setAuctions(prev => prev.map(a => a._id === id ? { ...a, status: newStatus } : a));
      setDropdown(null);
      Swal.fire({ icon:"success", title:"Updated!", timer:1500, showConfirmButton:false, toast:true, position:"top-end" });
    } catch {
      Swal.fire("Error", "Could not update status.", "error");
    }
  };

  const deleteAuction = async (id) => {
    const result = await Swal.fire({
      title:"Are you sure?", icon:"warning",
      showCancelButton:true, confirmButtonText:"Yes, delete it!",
    });
    if (result.isConfirmed) {
      try {
        await apiDelete(`/auction/auction/${id}`);
        setAuctions(prev => prev.filter(a => a._id !== id));
        Swal.fire("Deleted!", "", "success");
      } catch {
        Swal.fire("Error", "Failed to delete auction.", "error");
      }
    }
  };

  const handleModalSaved = (updated) => {
    if (modal?.mode === "edit") {
      setAuctions(prev => prev.map(a => a._id === updated._id ? updated : a));
    } else {
      fetchAuctions();
    }
  };

  // ── Filtering ──────────────────────────────────────────────────────────────
  const categories       = ["All", ...new Set(auctions.map(a => a.category).filter(Boolean))];
  const existingStatuses = ["All", ...new Set(auctions.map(a => a.status).filter(Boolean))];

  const filtered = auctions.filter(a => {
    const haystack = [a.title, a.item, getSellerName(a), a._id].join(" ").toLowerCase();
    return (
      (!search || haystack.includes(search.toLowerCase())) &&
      (statusFilter   === "All" || a.status   === statusFilter) &&
      (categoryFilter === "All" || a.category === categoryFilter)
    );
  });

  if (loading) return <div className="text-center py-10 text-gray-500">Loading...</div>;

  return (
    <div className="p-4 sm:p-6 w-full">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8">Auction Management</h1>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 mb-6">
        <input
          type="text"
          placeholder="Search auctions..."
          className="w-full min-w-0 sm:min-w-[220px] flex-1 border border-black rounded-lg px-4 py-2.5 outline-none text-sm"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="w-full sm:w-auto sm:min-w-[160px] border border-black rounded-lg px-4 py-2.5 bg-white outline-none text-sm"
        >
          {existingStatuses.map(s => (
            <option key={s} value={s}>{s === "All" ? "All Status" : s}</option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="w-full sm:w-auto sm:min-w-[160px] border border-black rounded-lg px-4 py-2.5 bg-white outline-none text-sm"
        >
          {categories.map(c => (
            <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>
          ))}
        </select>
        <button
          onClick={() => setModal({ mode:"add" })}
          className="w-full sm:w-auto bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 whitespace-nowrap"
        >
          + New Auction
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[20px] border border-black shadow-sm overflow-hidden">
        <div className="overflow-x-auto" style={{ borderRadius:"20px" }}>
          <table className="w-full min-w-[980px] text-sm table-auto">
            <thead className="border-b border-black">
              <tr className="text-left text-gray-500 font-bold uppercase tracking-wider">
                <th className="px-3 py-4">Item</th>
                <th className="px-3 py-4">Seller</th>
                <th className="px-3 py-4">Category</th>
                <th className="px-3 py-4">Start Bid</th>
                <th className="px-3 py-4">Current Bid</th>
                <th className="px-3 py-4 text-center">Bids</th>
                <th className="px-3 py-4">Ends At</th>
                <th className="px-3 py-4 text-center">Status</th>
                <th className="px-3 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-400">No auctions found.</td>
                </tr>
              ) : filtered.map(a => (
                <tr key={a._id} className="hover:bg-gray-50 transition-colors">

                  <td className="px-3 py-4 font-bold text-gray-900 text-sm">{a.title || a.item || "—"}</td>
                  <td className="px-3 py-4 text-gray-500 text-sm">{getSellerName(a)}</td>
                  <td className="px-3 py-4 text-gray-700 capitalize">{a.category || "—"}</td>
                  <td className="px-3 py-4 text-gray-600">{toINR(a.startingBid ?? a.startBid)}</td>
                  <td className="px-3 py-4 font-semibold text-gray-800">{toINR(a.currentBid ?? a.highestBid)}</td>
                  <td className="px-3 py-4 text-center text-gray-600">{a.bids ?? a.bidCount ?? a.totalBids ?? 0}</td>
                  <td className="px-3 py-4 text-gray-500 text-xs leading-5 break-words">
                    {formatEnd(a.endDate || a.endTime || a.endsAt)}
                  </td>
                  <td className="px-3 py-4 text-center">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold inline-block ${statusStyle[a.status] || "bg-gray-100 text-gray-600"}`}>
                      {a.status === "Active" ? "Live" : a.status || "—"}
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex flex-wrap justify-center gap-2" ref={dropdown === a._id ? dropdownRef : null}>

                      {/* Change Status dropdown */}
                      <div className="relative">
                        <button
                          onClick={() => setDropdown(dropdown === a._id ? null : a._id)}
                          className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded text-xs hover:bg-indigo-100 transition-colors whitespace-nowrap"
                        >
                          Change Status
                        </button>
                        {dropdown === a._id && (
                          <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-1 overflow-hidden">
                            {[
                              { value:"Active",    label:"Active (Live)" },
                              { value:"Scheduled", label:"Scheduled" },
                              { value:"Ended",     label:"Ended" },
                              { value:"Cancelled", label:"Cancelled" },
                            ].map(({ value, label }) => (
                              <button
                                key={value}
                                onClick={() => updateStatus(a._id, value)}
                                className="block px-4 py-2 hover:bg-gray-100 w-full text-left text-xs text-gray-700"
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => setModal({ mode:"edit", auction: a })}
                        className="bg-amber-50 text-amber-600 px-3 py-1.5 rounded text-xs hover:bg-amber-100 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteAuction(a._id)}
                        className="bg-red-50 text-red-600 px-3 py-1.5 rounded text-xs hover:bg-red-100 transition-colors"
                      >
                        Delete
                      </button>

                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal — rendered in React tree for real state + uploads */}
      {modal && (
        <AuctionModal
          mode={modal.mode}
          auction={modal.auction}
          onClose={() => setModal(null)}
          onSaved={handleModalSaved}
        />
      )}
    </div>
  );
};

export default Auctions;


