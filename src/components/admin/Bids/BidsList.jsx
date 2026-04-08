import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const BidsList = () => {
  const [bids, setBids] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBids();
  }, []);

  const fetchBids = async () => {
    try {
      const res = await axios.get("http://localhost:3000/bid/bids");
      const data = res.data?.bids || res.data?.data || res.data || [];
      setBids(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const deleteBid = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        // Backend now automatically recalculates auction's currentBid + totalBids
        await axios.delete(`http://localhost:3000/bid/bid/${id}`);
        setBids((prev) => prev.filter((b) => b._id !== id));
        Swal.fire("Deleted!", "", "success");
      } catch (err) {
        Swal.fire("Error", "Failed to delete bid.", "error");
      }
    }
  };

  const viewBidDetails = (bid) => {
    Swal.fire({
      title: `<div style="font-weight: 800; font-size: 26px; color: #1e293b; padding-top: 10px;">Bid Details</div>`,
      width: "550px",
      padding: "2.5em",
      background: "#ffffff",
      html: `
        <div style="text-align: left; display: grid; gap: 18px; padding: 0 10px;">
          <div>
            <label style="display: block; font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 1px;">Auction Title</label>
            <div style="font-size: 18px; font-weight: 600; color: #1e293b;">${bid.auctionTitle || "—"}</div>
          </div>
          <div>
            <label style="display: block; font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 1px;">Auction ID</label>
            <div style="font-size: 14px; color: #475569; font-family: monospace;">${bid.auction?._id || bid.auction || "—"}</div>
          </div>
          <div>
            <label style="display: block; font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 1px;">Bidder Name</label>
            <div style="font-size: 18px; font-weight: 600; color: #1e293b;">${bid.userName || "—"}</div>
          </div>
          <div>
            <label style="display: block; font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 1px;">Bidder ID</label>
            <div style="font-size: 14px; color: #475569; font-family: monospace;">${bid.bidder?._id || bid.bidder || "—"}</div>
          </div>
          <div>
            <label style="display: block; font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 1px;">Bid Amount</label>
            <div style="font-size: 22px; font-weight: 800; color: #4f46e5;">₹${Number(bid.bidAmount).toLocaleString()}</div>
          </div>
          <div>
            <label style="display: block; font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 1px;">Placed At</label>
            <div style="font-size: 15px; color: #475569;">${bid.createdAt ? new Date(bid.createdAt).toLocaleString() : "—"}</div>
          </div>
        </div>
      `,
      confirmButtonText: "Close",
      confirmButtonColor: "#4f46e5",
    });
  };

  const filteredBids = bids.filter((b) => {
    const name = (b.userName || "").toLowerCase();
    const title = (b.auctionTitle || "").toLowerCase();
    const query = search.toLowerCase();
    return name.includes(query) || title.includes(query);
  });

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Bid Management</h1>

      <div className="flex items-center gap-4 mb-8">
        <input
          type="text"
          placeholder="Search by bidder or auction..."
          className="flex-1 border border-black rounded-lg px-4 py-2.5 outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-[20px] border border-black overflow-visible shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-black">
            <tr className="text-left text-gray-500 font-bold uppercase tracking-wider">
              <th className="px-8 py-5">Bidder</th>
              <th className="px-8 py-5">Auction Title</th>
              <th className="px-8 py-5 text-center">Bid Amount</th>
              <th className="px-8 py-5">Placed At</th>
              <th className="px-8 py-5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10">
            {filteredBids.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-8 py-10 text-center text-gray-400">
                  No bids found.
                </td>
              </tr>
            ) : (
              filteredBids.map((b) => (
                <tr key={b._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-8 py-5 font-bold text-gray-900 text-base">
                    {b.userName || "—"}
                  </td>
                  <td className="px-8 py-5 text-gray-500 text-base">
                    {b.auctionTitle || "—"}
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className="px-4 py-1.5 rounded-full text-xs font-bold inline-block bg-indigo-100 text-indigo-700">
                      ₹{Number(b.bidAmount).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-gray-500 text-sm">
                    {b.createdAt
                      ? new Date(b.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => viewBidDetails(b)}
                        className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded text-xs hover:bg-indigo-100 transition-colors"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => deleteBid(b._id)}
                        className="bg-red-50 text-red-600 px-3 py-1.5 rounded text-xs hover:bg-red-100 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BidsList;
