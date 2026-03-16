// ── Shared auction data — used by BrowseAuctions, PersonalProfile, BusinessProfile
// All 10 auctions are visible to both personal and business users

export const AUCTIONS = [
  {
    id: 1, title: "iPhone 15 Pro Max – 256GB Natural Titanium",
    category: "Electronics", startBid: 60000, currentBid: 72000,
    totalBids: 28, endsIn: 134, hot: true, live: true,
    seller: "TechVault Pvt Ltd", sellerRating: 4.9,
    img: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&q=80",
    desc: "Brand new sealed box. Original warranty intact. Fastest chip ever in a smartphone.",
    condition: "New", location: "Mumbai",
  },
  {
    id: 2, title: "Asus ROG Zephyrus G14 (2024) – Ryzen 9",
    category: "Electronics", startBid: 300000, currentBid: 345000,
    totalBids: 16, endsIn: 48, hot: false, live: true,
    seller: "GadgetHub", sellerRating: 4.7,
    img: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500&q=80",
    desc: "Top-of-the-line gaming laptop. RTX 4090 Mobile. 32GB RAM. 1TB NVMe.",
    condition: "New", location: "Bengaluru",
  },
  {
    id: 3, title: "Royal Enfield Classic 350 – Chrome Edition",
    category: "Vehicles", startBid: 100000, currentBid: 118000,
    totalBids: 34, endsIn: 210, hot: false, live: false,
    seller: "MotoDeals", sellerRating: 4.6,
    img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=80",
    desc: "2022 model, 8,000 km driven. Single owner. All papers clear.",
    condition: "Used – Excellent", location: "Ahmedabad",
  },
  {
    id: 4, title: "Apple Watch Ultra 2 – Ocean Band",
    category: "Electronics", startBid: 45000, currentBid: 52500,
    totalBids: 61, endsIn: 12, hot: true, live: true,
    seller: "iWorld Store", sellerRating: 4.8,
    img: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&q=80",
    desc: "Sealed box. Titanium case. Precision dual-frequency GPS.",
    condition: "New", location: "Delhi",
  },
  {
    id: 5, title: "Canon EOS R5 – Body Only (Mint)",
    category: "Electronics", startBid: 32000, currentBid: 38000,
    totalBids: 43, endsIn: 24, hot: false, live: true,
    seller: "LensWorld", sellerRating: 4.5,
    img: "https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?w=500&q=80",
    desc: "Barely used. 8K RAW video. 45MP full-frame sensor. Under 500 actuations.",
    condition: "Used – Like New", location: "Chennai",
  },
  {
    id: 6, title: "Vintage Rolex Submariner 1978 – Original Dial",
    category: "Luxury", startBid: 700000, currentBid: 840000,
    totalBids: 89, endsIn: 8, hot: true, live: true,
    seller: "TimelessWatches", sellerRating: 5.0,
    img: "https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=500&q=80",
    desc: "Authenticated by Rolex India. Original papers. Collector's grade condition.",
    condition: "Vintage", location: "Mumbai",
  },
  {
    id: 7, title: "Sony PlayStation 5 – Disc Edition (Bundle)",
    category: "Electronics", startBid: 38000, currentBid: 42000,
    totalBids: 22, endsIn: 96, hot: true, live: false,
    seller: "GameZone", sellerRating: 4.6,
    img: "https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=500&q=80",
    desc: "PS5 + 2 controllers + 3 games bundle. Original seal intact.",
    condition: "New", location: "Hyderabad",
  },
  {
    id: 8, title: "Louis Vuitton Neverfull MM – Damier Ebene",
    category: "Luxury", startBid: 80000, currentBid: 95000,
    totalBids: 11, endsIn: 300, hot: false, live: false,
    seller: "LuxuryVault", sellerRating: 4.9,
    img: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&q=80",
    desc: "100% authentic. Original dustbag, receipt, and box included.",
    condition: "Used – Good", location: "Bengaluru",
  },
  {
    id: 9, title: "DJI Mavic 3 Pro – Fly More Combo",
    category: "Electronics", startBid: 100000, currentBid: 115000,
    totalBids: 27, endsIn: 35, hot: false, live: true,
    seller: "DroneHub", sellerRating: 4.4,
    img: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=500&q=80",
    desc: "Triple camera Hasselblad system. 46 min flight time. ND filter set included.",
    condition: "New", location: "Pune",
  },
  {
    id: 10, title: "Herman Miller Aeron Chair – Size B, Fully Loaded",
    category: "Furniture", startBid: 55000, currentBid: 68000,
    totalBids: 19, endsIn: 55, hot: false, live: true,
    seller: "ErgoOffice", sellerRating: 4.3,
    img: "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=500&q=80",
    desc: "Graphite frame. PostureFit SL. All adjustments. Used 6 months, like new.",
    condition: "Used – Excellent", location: "Delhi",
  },
];

export const CATEGORIES = ["All", "Electronics", "Vehicles", "Luxury", "Furniture", "Collectibles"];

export function formatINR(n) {
  if (n >= 100000) return "₹" + (n / 100000).toFixed(n % 100000 === 0 ? 0 : 1) + "L";
  if (n >= 1000)   return "₹" + (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + "K";
  return "₹" + n;
}

export function formatTime(minutes) {
  if (minutes < 60) return minutes + "m";
  if (minutes < 1440) return Math.floor(minutes / 60) + "h " + (minutes % 60) + "m";
  return Math.floor(minutes / 1440) + "d";
}
