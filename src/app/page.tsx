"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Check,
  X,
  Plus,
  Minus,
  Star,
  Search,
  ChevronRight,
  Lock,
  RotateCcw,
  Truck,
  Shield,
  Zap,
  Bot,
  Send,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Eye,
  Activity,
  Hash,
  User,
  LogOut,
  Sliders,
  Package,
  Receipt,
  Building2,
  Layers,
  Key,
  MessageSquare,
  Wand2,
  TrendingUp,
  Tag,
  Phone,
  MapPin,
  Copy,
  ExternalLink,
  RefreshCw,
  PhoneCall,
  Mail,
  Clock,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface ProductItem {
  id: string;
  name: string;
  description: string;
  price: number; // in paise
  currency: string;
  category: string;
  inventory: number;
  badge?: string;
  specs?: string;
  highlight?: string[];
  rating?: number;
  reviews?: number;
  image?: string;
}

interface MerchantContactInfo {
  representativeName: string;
  designation: string;
  storeBranch: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  fullAddress: string;
  phone: string;
  phoneFormatted: string;
  landline: string;
  email: string;
  workingHours: string;
  negotiationCode: string;
}

const MERCHANT_NAMES = [
  "Vikram Malhotra",
  "Priya Sharma",
  "Rohan Deshmukh",
  "Ananya Venkatesh",
  "Karan Singhania",
  "Suresh Nair",
  "Neha Agarwal",
  "Rajesh Varma",
  "Aditya Sengupta",
  "Meera Chawla",
];

const MERCHANT_DESIGNATIONS = [
  "Senior Commercial Merchant Officer & Price Desk",
  "Enterprise & Commercial Sales Lead",
  "Direct Pricing & Negotiation Specialist",
  "High-Value Order Relationship Manager",
  "Authorized Merchant Operations Lead",
];

const MERCHANT_LOCATIONS = [
  {
    branch: "AURA Electronics Hub - Koramangala",
    building: "Suite 402, 4th Floor, Prestige Trade Center",
    street: "80 Feet Road, 4th Block, Koramangala",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560034",
    landline: "+91 80 4912 8840",
  },
  {
    branch: "AURA Technology Outlets - BKC Flagship",
    building: "Unit 12B, Level 3, One BKC Tower G",
    street: "Bandra Kurla Complex, Bandra East",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400051",
    landline: "+91 22 6120 4490",
  },
  {
    branch: "AURA Silicon Park - Cyber City",
    building: "Tower B, 7th Floor, DLF Cyber City",
    street: "DLF Phase II, Sector 24",
    city: "Gurugram",
    state: "Haryana",
    pincode: "122002",
    landline: "+91 124 489 1200",
  },
  {
    branch: "AURA Hardware Experience Center - HITEC City",
    building: "Plot 14-16, Mindspace Madhapur Campus",
    street: "HITEC City Road, Madhapur",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500081",
    landline: "+91 40 6814 3300",
  },
  {
    branch: "AURA Tech Corridor - Guindy",
    building: "Block C, 3rd Floor, Olympia Tech Park",
    street: "1 SIDCO Industrial Estate, Guindy",
    city: "Chennai",
    state: "Tamil Nadu",
    pincode: "600032",
    landline: "+91 44 4820 9000",
  },
  {
    branch: "AURA Digital Commerce HQ - Indiranagar",
    building: "Plot 892, 100 Feet Road",
    street: "HAL 2nd Stage, Indiranagar",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560038",
    landline: "+91 80 2521 7733",
  },
];

function generateRandomMerchantInfo(): MerchantContactInfo {
  const loc = MERCHANT_LOCATIONS[Math.floor(Math.random() * MERCHANT_LOCATIONS.length)];
  const name = MERCHANT_NAMES[Math.floor(Math.random() * MERCHANT_NAMES.length)];
  const desig = MERCHANT_DESIGNATIONS[Math.floor(Math.random() * MERCHANT_DESIGNATIONS.length)];
  
  const prefixes = ["98450", "99801", "91084", "97412", "88849", "98200", "98110", "99400"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  const phoneFormatted = `+91 ${prefix} ${randomSuffix}`;
  const phoneRaw = `+91${prefix}${randomSuffix}`;
  
  const fullAddress = `${loc.building}, ${loc.street}, ${loc.city}, ${loc.state} - ${loc.pincode}`;
  const code = `NEG-${Math.floor(1000 + Math.random() * 9000)}`;

  return {
    representativeName: name,
    designation: desig,
    storeBranch: loc.branch,
    address: `${loc.building}, ${loc.street}`,
    city: loc.city,
    state: loc.state,
    pincode: loc.pincode,
    fullAddress,
    phone: phoneRaw,
    phoneFormatted,
    landline: loc.landline,
    email: `merchant.${name.toLowerCase().replace(/\\s+/g, ".")}@auraelectronics.demo`,
    workingHours: "Mon – Sat: 9:30 AM – 8:00 PM IST",
    negotiationCode: code,
  };
}

interface CartItem {
  product: ProductItem;
  quantity: number;
  selectedColor?: string;
}

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "CUSTOMER" | "MERCHANT";
}

interface OrderRecord {
  id: string;
  orderId: string;
  paymentId: string;
  amount: number;
  items: CartItem[];
  date: string;
  status: "PAID" | "PROCESSING" | "DELIVERED";
}

/* ─── Product Mock Metadata Mapping ─────────────────────── */
const PRODUCT_VISUAL_MAP: Record<string, { specs: string; highlights: string[]; image: string; rating: number; reviews: number }> = {
  Keyboards: {
    specs: "Hot-Swap Switches · Tri-Mode 2.4G/BT · CNC Aluminum Frame",
    highlights: ["200-hour battery life with 4000mAh cell", "Precision tuned acoustic dampening foam", "Full RGB with South-Facing LEDs", "Multi-OS layout switch (Mac / Windows)"],
    image: "⌨️",
    rating: 4.9,
    reviews: 142,
  },
  Mice: {
    specs: "PAW3395 26K Sensor · Ultralight Chassis · 4K/8K Polling",
    highlights: ["Nordic 52840 flagship MCU", "Optical micro-switches rated for 90M clicks", "Pure PTFE skates for zero-friction glide", "70-hour continuous competitive battery"],
    image: "🖱️",
    rating: 4.8,
    reviews: 98,
  },
  GPUs: {
    specs: "16GB GDDR6X · Ada Lovelace / RDNA 3 · Triple-Fan Vapor Chamber",
    highlights: ["4K Ray Tracing & DLSS 3.5 Frame Generation", "Reinforced CNC aluminum backplate", "Dual BIOS for Silent and OC performance", "AV1 dual hardware video encoders"],
    image: "🎮",
    rating: 4.9,
    reviews: 89,
  },
  CPUs: {
    specs: "Up to 24 Cores / 32 Threads · 6.0 GHz Boost · 3D V-Cache",
    highlights: ["Flagship gaming & multi-threaded rendering", "PCIe 5.0 and DDR5 ultra-fast bus", "High thermal efficiency with integrated IHS", "Unlocked for precision BIOS tuning"],
    image: "⚡",
    rating: 5.0,
    reviews: 154,
  },
  Monitors: {
    specs: "4K UHD / QD-OLED 240Hz · 99% DCI-P3 · USB-C 90W PD",
    highlights: ["Factory calibrated Delta E < 1 color accuracy", "0.03ms ultra-low pixel response for esports", "Ultra-slim 2mm micro-edge bezel design", "Ergonomic height, tilt, and 90° pivot stand"],
    image: "🖥️",
    rating: 4.9,
    reviews: 112,
  },
  Storage: {
    specs: "PCIe Gen4x4 NVMe M.2 · 7,400 MB/s · Graphene Heatsink",
    highlights: ["Ultra-fast 7,400 MB/s sequential read speed", "Custom graphene copper thermal dissipation layer", "1200 TBW write endurance with 5-year warranty", "DirectStorage ready for instant game load times"],
    image: "💾",
    rating: 4.8,
    reviews: 76,
  },
  RAM: {
    specs: "DDR5-6000MHz CL30 · Dual Channel (2x16GB) · AMD EXPO / XMP",
    highlights: ["Low latency CL30-36-36-76 optimized timings", "Anodized matte aluminum heat spreaders", "On-die ECC for maximum overclocking stability", "10-layer custom PCB for clean signal integrity"],
    image: "🖲️",
    rating: 4.9,
    reviews: 63,
  },
  Audio: {
    specs: "Hybrid ANC · 40mm Beryllium Drivers · LDAC Hi-Res Wireless",
    highlights: ["42dB active ambient noise suppression", "Spatial audio with dynamic head-tracking", "Plush memory foam and lambskin ear cushions", "38-hour battery with 15-min fast charge"],
    image: "🎧",
    rating: 4.9,
    reviews: 216,
  },
  Wearables: {
    specs: "Grade 5 Titanium · Sapphire Crystal · 14-Day Battery",
    highlights: ["Always-on 1000-nit AMOLED retina display", "Dual-band multi-GNSS precision location", "ECG, SpO2, and continuous heart monitoring", "100m water resistance with dive certification"],
    image: "⌚",
    rating: 4.9,
    reviews: 110,
  },
  Accessories: {
    specs: "Next-Gen GaN III · Dual USB-C PD 3.0 · Foldable Travel Prongs",
    highlights: ["Simultaneous 45W + 20W dual fast charge", "Compact form factor 40% smaller than OEM chargers", "Dynamic temperature and surge protection", "Universal compatibility with laptops and phones"],
    image: "🔌",
    rating: 4.7,
    reviews: 84,
  },
};

export default function AuraStorefront() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAiAgentOpen, setIsAiAgentOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);

  // Home Copilot Input & Toast Notification
  const [homeCopilotQuery, setHomeCopilotQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Authentication State — Default null (Logged out)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"CUSTOMER" | "MERCHANT">("CUSTOMER");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");

  // View state: 'storefront' | 'customer_orders' | 'merchant_dashboard'
  const [currentView, setCurrentView] = useState<"storefront" | "customer_orders" | "merchant_dashboard">("storefront");

  // Orders History
  const [orderHistory, setOrderHistory] = useState<OrderRecord[]>([
    {
      id: "ord-8819",
      orderId: "order_TVCIvzGMYKRV6a",
      paymentId: "pay_TVCI_99182",
      amount: 449900,
      items: [
        {
          product: {
            id: "p1",
            name: "AURA Tactile Wireless Mechanical Keyboard",
            description: "",
            price: 449900,
            currency: "INR",
            category: "Keyboards",
            inventory: 20,
            image: "⌨️",
          },
          quantity: 1,
        },
      ],
      date: "28 Aug 2026",
      status: "PAID",
    },
  ]);

  // Checkout & AgentPay States
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "checkout" | "success">("cart");
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [policyDecision, setPolicyDecision] = useState<{
    decision: string;
    reasons: string[];
    transactionId?: string;
    state?: string;
  } | null>(null);
  const [completedOrder, setCompletedOrder] = useState<any>(null);

  // Customer Shipping Information
  const [customer, setCustomer] = useState({
    name: "Alex Rivera",
    email: "alex.rivera@example.com",
    phone: "+91 98765 43210",
    address: "Suite 402, High-Tech Tower, Bengaluru, KA 560001",
  });

  // AI Assistant Chat State with Multi-Product Context & Companion Upsells
  const [aiMessages, setAiMessages] = useState<{
    role: "user" | "agent";
    content: string;
    products?: ProductItem[];
    recommendedProduct?: ProductItem;
    companionProducts?: { product: ProductItem; reason: string; badge: string }[];
    addedToCart?: { count: number; itemNames: string[] };
  }[]>([
    {
      role: "agent",
      content: "Hello! I'm your AURA Autonomous Shopping Copilot. Tell me what gear or PC hardware you're searching for, and I'll match components, remember your preferences, and resolve multi-item follow-ups.",
    },
  ]);
  const [aiContextState, setAiContextState] = useState<any>(null);
  const [aiInput, setAiInput] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);

  // Merchant Policy Desk Live Data
  const [merchantTransaction, setMerchantTransaction] = useState<any>(null);

  const formatPrice = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Negotiation Modal States & Handlers
  const [isNegotiationModalOpen, setIsNegotiationModalOpen] = useState(false);
  const [negotiationMerchant, setNegotiationMerchant] = useState<MerchantContactInfo | null>(null);
  const [negotiationItemOrCart, setNegotiationItemOrCart] = useState<{
    name: string;
    amount: number;
    quantity?: number;
  } | null>(null);
  const [negotiationOfferAmount, setNegotiationOfferAmount] = useState("");
  const [negotiationNote, setNegotiationNote] = useState("");
  const [negotiationSubmitted, setNegotiationSubmitted] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleOpenNegotiation = (itemOrCart?: { name: string; amount: number; quantity?: number }) => {
    const info = generateRandomMerchantInfo();
    setNegotiationMerchant(info);
    const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
    const totalQty = cart.reduce((acc, item) => acc + item.quantity, 0);
    setNegotiationItemOrCart(
      itemOrCart || {
        name: `Cart Order (${cart.length} items)`,
        amount: subtotal,
        quantity: totalQty,
      }
    );
    setNegotiationOfferAmount("");
    setNegotiationNote("");
    setNegotiationSubmitted(false);
    setIsNegotiationModalOpen(true);
  };

  const handleRegenerateMerchant = () => {
    setNegotiationMerchant(generateRandomMerchantInfo());
    showToast("Generated new merchant representative & branch location!");
  };

  const handleCopyText = (text: string, fieldName: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedField(fieldName);
    showToast(`Copied ${fieldName} to clipboard!`);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleSubmitNegotiationOffer = (e: React.FormEvent) => {
    e.preventDefault();
    setNegotiationSubmitted(true);
    showToast("Negotiation proposal submitted directly to Merchant Desk!");
  };

  // Fetch catalog from API
  useEffect(() => {
    fetch("/api/agent/catalog")
      .then((r) => r.json())
      .then((d) => {
        const enriched = (d.products || []).map((p: any) => {
          const meta = PRODUCT_VISUAL_MAP[p.category] || PRODUCT_VISUAL_MAP["Accessories"];
          return {
            ...p,
            specs: meta.specs,
            highlight: meta.highlights,
            image: meta.image,
            rating: meta.rating,
            reviews: meta.reviews,
            badge: p.name.includes("RTX") ? "Flagship GPU" : p.name.includes("7800X3D") ? "Best Gaming CPU" : p.name.includes("OLED") ? "240Hz OLED" : undefined,
          };
        });
        setProducts(enriched);
      })
      .catch((e) => console.error("Error fetching catalog", e));
  }, []);

  // Polling for live transaction updates (Merchant Dashboard & Customer Checkout sync)
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const pollTransactionStatus = async () => {
      try {
        if (currentUser?.role === "MERCHANT" && currentView === "merchant_dashboard") {
          // Merchant: fetch the latest active/pending transaction across the store
          const res = await fetch("/api/transactions?merchant=true");
          if (res.ok) {
            const data = await res.json();
            if (data.transaction) {
              setMerchantTransaction(data.transaction);
            } else {
              setMerchantTransaction(null);
            }
          }
        } else if (currentUser?.role === "CUSTOMER" && policyDecision?.transactionId) {
          // Customer: poll the specific transaction they are waiting on
          const res = await fetch(`/api/transactions/${policyDecision.transactionId}`);
          if (res.ok) {
            const updatedTx = await res.json();
            
            // Only update if state changed to avoid unnecessary re-renders
            if (updatedTx.state !== policyDecision.state) {
              setPolicyDecision(prev => prev ? { 
                ...prev, 
                state: updatedTx.state,
                decision: updatedTx.state === "APPROVED" ? "APPROVED" 
                        : updatedTx.state === "BLOCKED" || updatedTx.state === "REJECTED" ? "BLOCK" 
                        : prev.decision
              } : null);
            }
          }
        }
      } catch (e) {
        console.error("Polling error", e);
      }
    };

    if (currentUser) {
      interval = setInterval(pollTransactionStatus, 3000); // Poll every 3 seconds
    }

    return () => clearInterval(interval);
  }, [currentUser, currentView, policyDecision?.transactionId, policyDecision?.state]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category)));
    return ["All", ...cats];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = selectedCategory === "All" || p.category === selectedCategory;
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart Calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  }, [cart]);

  const cartItemCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  // ─── Smart Contextual Upselling Recommendation Engine for Cart ──────────
  const smartCartUpsells = useMemo(() => {
    if (cart.length === 0 || products.length === 0) return [];
    const inCartCategories = new Set(cart.map((i) => i.product.category));
    const inCartProductIds = new Set(cart.map((i) => i.product.id));

    const upsells: { product: ProductItem; reason: string; badge: string }[] = [];

    // 1. GPU in cart -> Upsell matching CPU or 240Hz Monitor
    if (inCartCategories.has("GPUs")) {
      if (!inCartCategories.has("CPUs")) {
        const cpu = products.find((p) => p.name.includes("7800X3D") || p.name.includes("14900K"));
        if (cpu && !inCartProductIds.has(cpu.id)) {
          upsells.push({
            product: cpu,
            reason: "Pair with a high-IPC 3D V-Cache processor to eliminate 4K/1440p GPU frame bottlenecking.",
            badge: "🔥 Zero Bottleneck Match",
          });
        }
      }
      if (!inCartCategories.has("Monitors")) {
        const monitor = products.find((p) => p.name.includes("OLED") || p.name.includes("4K"));
        if (monitor && !inCartProductIds.has(monitor.id)) {
          upsells.push({
            product: monitor,
            reason: "Experience your GPU's true 240Hz visual fidelity on a Quantum Dot OLED display.",
            badge: "🖥️ 240Hz Ultra Display",
          });
        }
      }
    }

    // 2. CPU in cart -> Upsell DDR5 RAM & Gen4 NVMe SSD
    if (inCartCategories.has("CPUs")) {
      if (!inCartCategories.has("RAM")) {
        const ram = products.find((p) => p.category === "RAM" || p.name.includes("DDR5"));
        if (ram && !inCartProductIds.has(ram.id)) {
          upsells.push({
            product: ram,
            reason: "Ultra-low latency CL30 timings engineered for seamless AMD EXPO & Intel XMP 3.0 profiles.",
            badge: "⚡ Low Latency Memory",
          });
        }
      }
      if (!inCartCategories.has("Storage")) {
        const ssd = products.find((p) => p.category === "Storage" || p.name.includes("SSD"));
        if (ssd && !inCartProductIds.has(ssd.id)) {
          upsells.push({
            product: ssd,
            reason: "7,400 MB/s Gen4 throughput ensures instant OS booting and zero game loading pauses.",
            badge: "💾 DirectStorage Ready",
          });
        }
      }
    }

    // 3. Keyboard in cart -> Upsell Mouse & Desk Mat
    if (inCartCategories.has("Keyboards")) {
      if (!inCartCategories.has("Mice")) {
        const mouse = products.find((p) => p.category === "Mice");
        if (mouse && !inCartProductIds.has(mouse.id)) {
          upsells.push({
            product: mouse,
            reason: "Ultra-lightweight 49g chassis with 26K optical sensor completes your desk ergonomic flow.",
            badge: "🖱️ Precision Workstation Pair",
          });
        }
      }
      if (!cart.some((i) => i.product.name.includes("Desk Mat"))) {
        const mat = products.find((p) => p.name.includes("Desk Mat"));
        if (mat && !inCartProductIds.has(mat.id)) {
          upsells.push({
            product: mat,
            reason: "100% natural merino wool felt dampens typing acoustics while enhancing mouse tracking.",
            badge: "✨ Desk Harmony Pad",
          });
        }
      }
    }

    // 4. Audio in cart -> Upsell 65W GaN Fast Charger
    if (inCartCategories.has("Audio")) {
      if (!cart.some((i) => i.product.name.includes("Charger"))) {
        const charger = products.find((p) => p.name.includes("Charger"));
        if (charger && !inCartProductIds.has(charger.id)) {
          upsells.push({
            product: charger,
            reason: "Fast-charges ANC wireless headphones, laptops, and phones simultaneously.",
            badge: "🔌 Fast GaN Power Kit",
          });
        }
      }
    }

    // Fallback: Fill up to 2 items with general popular additions
    if (upsells.length < 2) {
      const candidates = products.filter(
        (p) => !inCartProductIds.has(p.id) && (p.category === "Accessories" || p.category === "RAM" || p.category === "Mice")
      );
      for (const p of candidates) {
        if (upsells.length >= 2) break;
        if (!upsells.some((u) => u.product.id === p.id)) {
          upsells.push({
            product: p,
            reason: "Frequently paired by customers to optimize equipment setups.",
            badge: "⭐ Popular Companion",
          });
        }
      }
    }

    return upsells.slice(0, 3);
  }, [cart, products]);

  // Add to cart with non-blocking default
  const addToCart = (product: ProductItem, quantity = 1, openDrawer = false) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { product, quantity }];
    });

    showToast(`✓ Added "${product.name}" to cart (${formatPrice(product.price * quantity)})`);

    if (openDrawer) {
      setIsCartOpen(true);
    }
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // ─── Login Handlers ──────────────────────────────────────────────────────
  const handleLogin = (role: "CUSTOMER" | "MERCHANT") => {
    if (role === "CUSTOMER") {
      const newCust: AuthUser = {
        id: "cust-1",
        name: "Alex Rivera",
        email: authEmail || "alex.rivera@example.com",
        role: "CUSTOMER",
      };
      setCurrentUser(newCust);
      setCustomer((prev) => ({ ...prev, name: newCust.name, email: newCust.email }));
      setCurrentView("storefront");
    } else {
      setCurrentUser({
        id: "merch-1",
        name: "AURA Merchant Operations",
        email: authEmail || "merchant@auratech.com",
        role: "MERCHANT",
      });
      setCurrentView("merchant_dashboard");
    }
    setIsAuthModalOpen(false);
    setAuthEmail("");
    setAuthPassword("");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCart([]);
    setIsCartOpen(false);
    setCheckoutStep("cart");
    setCurrentView("storefront");
    setIsAiAgentOpen(false);
    setSearchQuery("");
  };

  const openAiAgentWithAuthCheck = () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsAiAgentOpen(true);
  };

  // ─── Quick Copilot Invocations ──────────────────────────────────────────
  const handleTriggerCopilotPrompt = (promptText: string) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsAiAgentOpen(true);
    executeAiPrompt(promptText);
  };

  // ─── AgentPay Checkout Handler ──────────────────────────────────────────
  const handleInitiateAgentPayCheckout = async () => {
    if (cart.length === 0) return;

    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    setIsProcessingCheckout(true);
    setPolicyDecision(null);

    try {
      const primaryItem = cart[0];
      const txRes = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: primaryItem.product.id,
          quantity: primaryItem.quantity,
          cart_items: cart.map((c) => ({
            product_id: c.product.id,
            quantity: c.quantity,
          })),
        }),
      });
      const txData = await txRes.json();

      if (!txData.transaction) {
        alert("Failed to initialize transaction snapshot: " + (txData.error || "Unknown error"));
        setIsProcessingCheckout(false);
        return;
      }

      const txId = txData.transaction.id;
      setMerchantTransaction(txData.transaction);

      // Evaluate Policy
      const policyRes = await fetch("/api/policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transaction_id: txId }),
      });
      const policyData = await policyRes.json();
      setPolicyDecision({ ...policyData, transactionId: txId, state: policyData.decision });

      const updatedTxRes = await fetch(`/api/transactions/${txId}`);
      if (updatedTxRes.ok) setMerchantTransaction(await updatedTxRes.json());

      if (policyData.decision === "ALLOW") {
        await launchRazorpayCheckout(txId);
      }
    } catch (err) {
      console.error("Checkout initiation error", err);
      alert("Checkout failed. Please try again.");
    }
    setIsProcessingCheckout(false);
  };

  // ─── Merchant Decision Handlers ──────────────────────────────────────────
  const handleMerchantApprove = async (txId: string) => {
    setIsProcessingCheckout(true);
    try {
      const res = await fetch(`/api/transactions/${txId}/approve`, {
        method: "POST",
        headers: { "x-demo-role": "MERCHANT" },
      });
      const data = await res.json();

      if (data.success) {
        const updatedTxRes = await fetch(`/api/transactions/${txId}`);
        if (updatedTxRes.ok) {
          const updatedTx = await updatedTxRes.json();
          setMerchantTransaction(updatedTx);
          setPolicyDecision((prev) => (prev ? { ...prev, decision: "APPROVED", state: "APPROVED" } : null));
        }
      } else {
        alert("Approval failed: " + data.error);
      }
    } catch (e) {
      console.error("Merchant approval error", e);
    }
    setIsProcessingCheckout(false);
  };

  const handleMerchantReject = async (txId: string) => {
    setIsProcessingCheckout(true);
    try {
      const res = await fetch(`/api/transactions/${txId}/reject`, {
        method: "POST",
        headers: { "x-demo-role": "MERCHANT" },
      });
      const data = await res.json();

      if (data.success) {
        const updatedTxRes = await fetch(`/api/transactions/${txId}`);
        if (updatedTxRes.ok) {
          const updatedTx = await updatedTxRes.json();
          setMerchantTransaction(updatedTx);
          setPolicyDecision((prev) => (prev ? { ...prev, decision: "BLOCKED", state: "REJECTED" } : null));
        }
      } else {
        alert("Rejection failed: " + data.error);
      }
    } catch (e) {
      console.error("Merchant rejection error", e);
    }
    setIsProcessingCheckout(false);
  };

  const launchRazorpayCheckout = async (txId: string) => {
    try {
      const checkoutRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transaction_id: txId }),
      });
      const checkoutData = await checkoutRes.json();

      if (checkoutData.error) {
        alert("Checkout creation rejected by policy: " + checkoutData.error);
        return;
      }

      const options = {
        key: checkoutData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_YourKey",
        amount: checkoutData.amount,
        currency: "INR",
        name: "AURA Electronics Store",
        description: "Autonomous AgentPay Gated Order",
        order_id: checkoutData.orderId,
        handler: async (response: any) => {
          try {
            await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                transaction_id: txId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const newOrder: OrderRecord = {
              id: `ord-${Math.floor(1000 + Math.random() * 9000)}`,
              orderId: checkoutData.orderId,
              paymentId: response.razorpay_payment_id,
              amount: checkoutData.amount,
              items: [...cart],
              date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
              status: "PAID",
            };

            setOrderHistory((prev) => [newOrder, ...prev]);
            setCompletedOrder(newOrder);
            setCart([]);
            setCheckoutStep("success");
          } catch (e) {
            console.error("Signature verification error", e);
          }
        },
        prefill: {
          name: customer.name,
          email: customer.email,
          contact: customer.phone,
        },
        theme: { color: "#111827" },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (resp: any) => {
        alert("Payment failed: " + (resp.error?.description || "Card declined on test rails"));
      });
      rzp.open();
    } catch (e) {
      console.error("Razorpay launcher error", e);
    }
  };

  // ─── AI Assistant Chat Execution with Conversational Entity Resolution ───────────
  const executeAiPrompt = async (promptText: string) => {
    if (!promptText.trim() || isAiTyping) return;
    setAiMessages((prev) => [...prev, { role: "user", content: promptText }]);
    setAiInput("");
    setIsAiTyping(true);

    try {
      // Build conversation history payload
      const historyPayload = aiMessages.map((m) => ({
        role: m.role,
        content: m.content,
        recommendedProductIds: m.products ? m.products.map((p) => p.id) : m.recommendedProduct ? [m.recommendedProduct.id] : [],
      }));

      const cartPayload = cart.map((c) => ({
        productId: c.product.id,
        name: c.product.name,
        category: c.product.category,
        price: c.product.price,
        quantity: c.quantity,
      }));

      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptText,
          catalog: products,
          conversationHistory: historyPayload,
          contextState: aiContextState,
          cartItems: cartPayload,
        }),
      });
      const data = await res.json();

      // Surface API errors instead of silently falling through
      if (!res.ok) {
        console.error("Agent API error", data);
        setAiMessages((prev) => [
          ...prev,
          { role: "agent", content: data.error || "Something went wrong. Please try again." },
        ]);
        setIsAiTyping(false);
        return;
      }

      // Persist updated context state
      if (data.updatedContext) {
        setAiContextState(data.updatedContext);
      }

      // Resolve products list from response
      let resolvedProductsList: ProductItem[] = [];
      if (Array.isArray(data.products) && data.products.length > 0) {
        resolvedProductsList = data.products.map((p: any) => {
          const found = products.find((prod) => prod.id === p.id);
          return found || p;
        });
      } else if (data.product_id) {
        const found = products.find((p) => p.id === data.product_id);
        if (found) resolvedProductsList = [found];
      }

      const isCartAction = data.action === "ADD_TO_CART" || data.action === "REMOVE_FROM_CART";
      let addedSummary: { count: number; itemNames: string[] } | undefined = undefined;

      // Execute Cart Actions if requested
      if (data.action === "ADD_TO_CART" && Array.isArray(data.items) && data.items.length > 0) {
        let addedCount = 0;
        data.items.forEach((item: any) => {
          const productToAdd = products.find((p) => p.id === item.product_id);
          if (productToAdd) {
            addToCart(productToAdd, item.quantity || 1, false);
            addedCount++;
          }
        });

        if (addedCount > 0) {
          const itemNames = data.items.map((i: any) => i.name || products.find((p) => p.id === i.product_id)?.name).filter(Boolean);
          showToast(`✓ Added ${addedCount} item(s) to cart: ${itemNames.join(", ")}`);
          addedSummary = { count: addedCount, itemNames };
        }
      } else if (data.action === "REMOVE_FROM_CART" && Array.isArray(data.items) && data.items.length > 0) {
        data.items.forEach((item: any) => {
          removeFromCart(item.product_id);
        });
        showToast(`✓ Removed item(s) from cart`);
      }

      // Resolve companion upsell products from response
      let resolvedCompanionList: { product: ProductItem; reason: string; badge: string }[] = [];
      if (Array.isArray(data.companionProducts) && data.companionProducts.length > 0) {
        resolvedCompanionList = data.companionProducts
          .map((item: any) => {
            const rawProd = item.product || item;
            const fullProd = products.find((prod) => prod.id === rawProd.id) || rawProd;
            return {
              product: fullProd,
              reason: item.reason || "Recommended companion pairing",
              badge: item.badge || (fullProd.category ? `${fullProd.category} Pairing` : "Pairing"),
            };
          })
          .filter((c: any) => c.product && c.product.id);
      }

      setAiMessages((prev) => [
        ...prev,
        {
          role: "agent",
          content: data.reason || data.clarificationPrompt || "I've processed your request with full conversational context.",
          products: !isCartAction && resolvedProductsList.length > 0 ? resolvedProductsList : undefined,
          recommendedProduct: !isCartAction && resolvedProductsList.length === 1 ? resolvedProductsList[0] : undefined,
          companionProducts: !isCartAction && resolvedCompanionList.length > 0 ? resolvedCompanionList : undefined,
          addedToCart: addedSummary,
        },
      ]);
    } catch (e) {
      console.error("AI Copilot request error", e);
      setAiMessages((prev) => [
        ...prev,
        { role: "agent", content: "I encountered a processing error. Please try again." },
      ]);
    }
    setIsAiTyping(false);
  };

  const handleAiSendMessage = () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    executeAiPrompt(aiInput);
  };

  return (
    <div className="min-h-screen bg-white text-[#111827] flex flex-col selection:bg-[#FF3B30] selection:text-white relative">
      {/* ─── Toast Notification Pill ─────────── */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#111827] text-white px-5 py-2.5 rounded-full shadow-2xl border border-white/20 text-xs font-bold flex items-center gap-2 animate-[slide-down_0.2s_ease-out]">
          <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─── Minimal Sticky Navigation Bar ─────────── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => setCurrentView(currentUser?.role === "MERCHANT" ? "merchant_dashboard" : "storefront")}
              className="text-2xl font-black tracking-tighter text-[#111827] flex items-center cursor-pointer"
            >
              AURA<span className="text-[#FF3B30] text-3xl leading-none">.</span>
            </button>

            {/* Nav Links */}
            {currentUser?.role !== "MERCHANT" && currentView !== "merchant_dashboard" && (
              <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-[#4B5563]">
                {categories.slice(0, 7).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setCurrentView("storefront");
                      setSelectedCategory(cat);
                    }}
                    className={cn(
                      "transition-colors hover:text-[#111827] cursor-pointer",
                      selectedCategory === cat && currentView === "storefront"
                        ? "text-[#111827] border-b-2 border-[#111827] pb-0.5"
                        : ""
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </nav>
            )}
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            {/* Search Input — ONLY SHOWN WHEN USER IS LOGGED IN AS CUSTOMER */}
            {currentUser && currentUser.role === "CUSTOMER" && currentView === "storefront" && (
              <div className="hidden lg:flex items-center gap-2 rounded-full bg-[#F8F9FA] border border-[#E5E7EB] px-3.5 py-1.5 focus-within:border-[#111827] transition-all w-48 animate-[fade-in_0.2s_ease-out]">
                <Search className="h-3.5 w-3.5 text-[#9CA3AF]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search hardware..."
                  className="w-full bg-transparent text-xs text-[#111827] placeholder:text-[#9CA3AF] outline-none"
                />
              </div>
            )}

            {/* AI Assistant Button in Header */}
            {currentUser && currentUser.role === "CUSTOMER" && (
              <button
                onClick={openAiAgentWithAuthCheck}
                className="flex items-center gap-1.5 rounded-full bg-[#F8F9FA] hover:bg-[#F1F3F5] border border-[#E5E7EB] px-3.5 py-1.5 text-xs font-bold text-[#111827] transition-all cursor-pointer shadow-xs active:scale-95 animate-[fade-in_0.2s_ease-out]"
              >
                <Sparkles className="h-3.5 w-3.5 text-[#FF3B30]" />
                <span className="hidden sm:inline">AI Copilot</span>
              </button>
            )}

            {/* Shopping Cart Button */}
            {currentUser && currentUser.role === "CUSTOMER" && (
              <button
                onClick={() => {
                  setCheckoutStep("cart");
                  setIsCartOpen(true);
                }}
                className="relative flex items-center justify-center h-9 w-9 rounded-full bg-[#111827] text-white hover:bg-[#27272A] transition-all cursor-pointer active:scale-95 shadow-xs animate-[fade-in_0.2s_ease-out]"
                aria-label="View shopping cart"
              >
                <ShoppingBag className="h-4 w-4" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#FF3B30] text-white text-[9px] font-black flex items-center justify-center border border-white">
                    {cartItemCount}
                  </span>
                )}
              </button>
            )}

            {/* User Profile / Login Button */}
            {currentUser ? (
              <div className="flex items-center gap-2 pl-2 border-l border-[#E5E7EB]">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs",
                      currentUser.role === "MERCHANT" ? "bg-[#FF3B30]" : "bg-[#111827]"
                    )}
                  >
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="hidden sm:block text-left text-xs">
                    <span className="font-bold text-[#111827] block leading-tight">{currentUser.name}</span>
                    <span
                      className={cn(
                        "text-[10px] font-semibold",
                        currentUser.role === "MERCHANT" ? "text-[#FF3B30]" : "text-[#6B7280]"
                      )}
                    >
                      {currentUser.role === "MERCHANT" ? "Merchant Admin" : "Customer"}
                    </span>
                  </div>
                </div>

                {/* Role-Specific View Switcher */}
                {currentUser.role === "CUSTOMER" ? (
                  <button
                    onClick={() => setCurrentView(currentView === "storefront" ? "customer_orders" : "storefront")}
                    className="rounded-full bg-[#F8F9FA] hover:bg-[#E5E7EB] px-3 py-1.5 text-xs font-bold text-[#111827] transition-all cursor-pointer border border-[#E5E7EB]"
                  >
                    {currentView === "storefront" ? "My Orders" : "Shop"}
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentView(currentView === "merchant_dashboard" ? "storefront" : "merchant_dashboard")}
                    className="rounded-full bg-[#F8F9FA] hover:bg-[#E5E7EB] px-3 py-1.5 text-xs font-bold text-[#111827] transition-all cursor-pointer border border-[#E5E7EB]"
                  >
                    {currentView === "merchant_dashboard" ? "Storefront View" : "Policy Console"}
                  </button>
                )}

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-full text-[#9CA3AF] hover:text-[#FF3B30] hover:bg-[#FFF1F0] transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="rounded-full bg-[#111827] text-white hover:bg-[#27272A] px-4 py-2 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ─── MAIN VIEW ROUTING ──────────────────────── */}
      {currentView === "storefront" && (
        <>
          {/* Hero Section */}
          <section className="bg-[#FAFAFA] border-b border-[#E5E7EB] py-16 sm:py-20 px-4 sm:px-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-white border border-[#E5E7EB] px-3 py-1 text-xs font-semibold text-[#111827] shadow-xs">
                  <span className="h-2 w-2 rounded-full bg-[#FF3B30]" />
                  2026 Hardware Collection · Gated by AgentPay
                </div>

                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tighter text-[#111827] leading-[1.05]">
                  High-Performance <br />
                  <span className="text-[#FF3B30]">PC hardware & gear.</span>
                </h1>

                <p className="text-base text-[#4B5563] max-w-xl font-normal leading-relaxed">
                  GeForce RTX 4080 Super GPUs, Ryzen 7800X3D processors, 240Hz QD-OLED displays, and bespoke mechanical peripherals. Verified by cryptographic Razorpay settlement.
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <a
                    href="#catalog"
                    className="rounded-full bg-[#111827] hover:bg-[#27272A] text-white px-7 py-3.5 text-xs font-bold transition-all shadow-sm flex items-center gap-2 active:scale-95"
                  >
                    Shop Collection
                    <ArrowRight className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => handleTriggerCopilotPrompt("Configure a complete 4K gaming build with RTX 4080 Super and Ryzen 7800X3D")}
                    className="rounded-full bg-white hover:bg-[#F3F4F6] text-[#111827] border border-[#D1D5DB] px-6 py-3.5 text-xs font-bold transition-all flex items-center gap-2 active:scale-95 shadow-xs"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-[#FF3B30]" />
                    Build Setup with AI
                  </button>
                </div>
              </div>

              {/* Hero Showcase Card */}
              <div className="lg:col-span-5">
                <div className="relative bg-white rounded-3xl border border-[#E5E7EB] p-8 shadow-lg space-y-6">
                  <div className="absolute top-6 right-6 bg-[#FF3B30] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
                    Flagship GPU
                  </div>

                  <div className="h-44 bg-[#F8F9FA] rounded-2xl border border-[#E5E7EB] flex items-center justify-center text-7xl select-none">
                    🎮
                  </div>

                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">AURA HARDWARE</span>
                    <h3 className="text-xl font-bold text-[#111827] mt-1">GeForce RTX 4080 Super 16GB OC</h3>
                    <p className="text-xs text-[#4B5563] mt-1 line-clamp-2">
                      Ada Lovelace architecture, 16GB GDDR6X, triple-fan vapor chamber cooling, DLSS 3.5 frame gen.
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB]">
                    <div>
                      <span className="text-xs text-[#6B7280] block">Retail</span>
                      <span className="text-2xl font-black text-[#111827]">₹44,999</span>
                    </div>

                    <button
                      onClick={() => {
                        const gpu = products.find((p) => p.name.includes("4080"));
                        if (gpu) addToCart(gpu, 1, false);
                      }}
                      className="rounded-full bg-[#111827] hover:bg-[#FF3B30] text-white px-5 py-2.5 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ─── PROMINENT AI AUTONOMOUS COPILOT COMMAND BAR ─── */}
          <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-10 pb-4">
            <div className="bg-[#FAFAFA] rounded-3xl border-2 border-[#111827]/10 hover:border-[#111827]/30 transition-all p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-[#111827] text-white flex items-center justify-center shadow-xs">
                    <Sparkles className="h-4 w-4 text-[#FF3B30]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#111827] tracking-tight">
                      AURA Autonomous Shopping Copilot & Builder
                    </h3>
                    <p className="text-xs text-[#6B7280]">
                      Powered by AgentPay intelligence. Ask for components, peripherals, and intelligent cross-hardware bundle pairings.
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-white border border-[#E5E7EB] px-3 py-1 rounded-full text-[#111827] w-fit shadow-xs">
                  <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
                  Live AI Engine Ready
                </span>
              </div>

              {/* Input Command Bar */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="flex-1 relative rounded-2xl bg-white border border-[#D1D5DB] focus-within:border-[#111827] focus-within:ring-2 focus-within:ring-[#111827]/5 transition-all shadow-xs flex items-center px-4 py-2">
                  <Wand2 className="h-4 w-4 text-[#FF3B30] mr-2 shrink-0" />
                  <input
                    type="text"
                    value={homeCopilotQuery}
                    onChange={(e) => setHomeCopilotQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && homeCopilotQuery.trim()) {
                        handleTriggerCopilotPrompt(homeCopilotQuery);
                        setHomeCopilotQuery("");
                      }
                    }}
                    placeholder="e.g. 'Build a 4K gaming PC with RTX 4080 and Ryzen 7800X3D' or 'Recommend a high-refresh OLED monitor'..."
                    className="w-full bg-transparent text-xs text-[#111827] placeholder:text-[#9CA3AF] outline-none"
                  />
                </div>

                <button
                  onClick={() => {
                    if (homeCopilotQuery.trim()) {
                      handleTriggerCopilotPrompt(homeCopilotQuery);
                      setHomeCopilotQuery("");
                    } else {
                      handleTriggerCopilotPrompt("Show me the best PC gaming hardware and curved OLED monitors");
                    }
                  }}
                  className="rounded-2xl bg-[#111827] hover:bg-[#FF3B30] text-white px-6 py-3 text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 whitespace-nowrap"
                >
                  <Sparkles className="h-4 w-4" />
                  Ask AI Copilot
                </button>
              </div>

              {/* Fast Prompt Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] font-bold text-[#6B7280]">Popular Inquiries:</span>
                {[
                  "GeForce RTX 4080 Super GPU",
                  "Ryzen 7 7800X3D gaming CPU",
                  "Curved QD-OLED 240Hz monitor",
                  "2TB PCIe Gen4 SSD & DDR5 RAM",
                  "Tactile mechanical keyboard",
                ].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => handleTriggerCopilotPrompt(chip)}
                    className="rounded-full bg-white hover:bg-[#111827] hover:text-white border border-[#E5E7EB] px-3 py-1 text-[11px] font-semibold text-[#4B5563] transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    ⚡ {chip}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Product Grid Section */}
          <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-8 py-10 flex-1">
            {/* Category Filter Tabs */}
            <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[#E5E7EB] pb-4 mb-8">
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                      selectedCategory === cat
                        ? "bg-[#111827] text-white shadow-xs"
                        : "bg-[#F8F9FA] hover:bg-[#E5E7EB] text-[#4B5563]"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="text-xs font-semibold text-[#6B7280]">
                {filteredProducts.length} items available
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="group bg-white rounded-2xl border border-[#E5E7EB] p-5 hover-lift flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="relative h-44 bg-[#F8F9FA] rounded-xl border border-[#E5E7EB] flex items-center justify-center text-5xl select-none group-hover:scale-[1.02] transition-transform">
                      {product.badge && (
                        <span className="absolute top-3 left-3 bg-[#111827] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                          {product.badge}
                        </span>
                      )}
                      <span>{product.image || "📦"}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                          {product.category}
                        </span>
                        <div className="flex items-center gap-1 text-[#F59E0B] font-bold text-[11px]">
                          <Star className="h-3 w-3 fill-current" />
                          <span>{product.rating || 4.9}</span>
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-[#111827] line-clamp-1 group-hover:text-[#FF3B30] transition-colors">
                        {product.name}
                      </h4>

                      <p className="text-[11px] text-[#6B7280] line-clamp-2 leading-relaxed">
                        {product.specs || product.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-[#E5E7EB] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#9CA3AF] block font-medium">Price</span>
                      <span className="text-base font-black text-[#111827]">{formatPrice(product.price)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedProduct(product)}
                        className="rounded-full bg-[#F8F9FA] hover:bg-[#E5E7EB] p-2 text-[#111827] transition-all cursor-pointer"
                        title="View Specifications"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => addToCart(product, 1, false)}
                        className="rounded-full bg-[#111827] hover:bg-[#FF3B30] text-white px-3.5 py-2 text-xs font-bold transition-all active:scale-95 shadow-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* ─── FLOATING PERSISTENT AI COPILOT DOCK (BOTTOM-RIGHT) ─── */}
      {currentUser?.role !== "MERCHANT" && (
        <div className="fixed bottom-6 right-6 z-40 animate-[slide-up_0.3s_ease-out]">
          <button
            onClick={() => handleTriggerCopilotPrompt("Help me configure my ideal PC and desk equipment setup")}
            className="group flex items-center gap-3 bg-[#111827] hover:bg-[#000000] text-white p-2 sm:px-4 sm:py-3 rounded-full shadow-2xl border-2 border-white transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            <div className="relative flex items-center justify-center h-8 w-8 rounded-full bg-[#FF3B30] text-white shadow-xs">
              <Sparkles className="h-4 w-4 animate-pulse" />
            </div>
            <div className="hidden sm:block text-left">
              <span className="text-xs font-black block leading-none">Shop with AURA AI</span>
              <span className="text-[10px] text-[#9CA3AF] leading-none">Gear matching & smart bundle pairing</span>
            </div>
            <ChevronRight className="hidden sm:block h-4 w-4 text-[#9CA3AF] group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      )}

      {/* ─── CUSTOMER ORDERS DASHBOARD ─────────────── */}
      {currentView === "customer_orders" && (
        <section className="max-w-4xl mx-auto px-4 sm:px-8 py-12 flex-1 w-full space-y-6">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
            <div>
              <h2 className="text-2xl font-bold text-[#111827]">My Orders</h2>
              <p className="text-xs text-[#6B7280] mt-1">Track your purchases and view cryptographic payment receipts.</p>
            </div>
            <button
              onClick={() => setCurrentView("storefront")}
              className="rounded-full bg-[#111827] text-white px-4 py-2 text-xs font-bold shadow-xs hover:bg-[#27272A] cursor-pointer"
            >
              Continue Shopping
            </button>
          </div>

          <div className="space-y-4">
            {orderHistory.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3 text-xs">
                  <div>
                    <span className="text-[#6B7280]">Order Placed: </span>
                    <span className="font-bold text-[#111827]">{order.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#ECFDF5] border border-[#10B981]/30 text-[#10B981] px-2.5 py-0.5 text-[10px] font-bold">
                      {order.status}
                    </span>
                    <span className="font-mono text-[#6B7280]">ID: {order.orderId}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{item.product.image || "📦"}</span>
                        <div>
                          <span className="font-bold text-[#111827] block">{item.product.name}</span>
                          <span className="text-[#6B7280]">Qty: {item.quantity}</span>
                        </div>
                      </div>
                      <span className="font-black text-[#111827]">{formatPrice(item.product.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-[#10B981] font-semibold">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Payment verified on Razorpay rails ({order.paymentId})</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[#6B7280] block text-[10px]">Total Paid</span>
                    <span className="text-base font-black text-[#111827]">{formatPrice(order.amount)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── MERCHANT POLICY DASHBOARD VIEW ────────── */}
      {currentView === "merchant_dashboard" && (
        <section className="max-w-7xl mx-auto px-4 sm:px-8 py-10 flex-1 w-full space-y-8">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-6">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="h-6 w-6 text-[#FF3B30]" />
                <h2 className="text-2xl font-bold text-[#111827]">Merchant Policy & Settlement Console</h2>
              </div>
              <p className="text-xs text-[#6B7280] mt-1">
                Deterministic AgentPay policy gates, spend threshold telemetry, and cryptographic SHA-256 audit logs.
              </p>
            </div>

            <button
              onClick={() => setCurrentView("storefront")}
              className="rounded-full bg-[#111827] text-white px-5 py-2 text-xs font-bold shadow-xs hover:bg-[#27272A] transition-all cursor-pointer"
            >
              View Storefront
            </button>
          </div>

          {/* Threshold Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#10B981]">Autonomous Spend Cap</span>
              <h3 className="text-3xl font-black text-[#111827]">₹5,000.00</h3>
              <p className="text-xs text-[#6B7280]">
                Transactions at or below ₹5,000 are auto-approved without human merchant intervention.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#F59E0B]">Approval Threshold</span>
              <h3 className="text-3xl font-black text-[#111827]">₹5,001 — ₹2,00,000</h3>
              <p className="text-xs text-[#6B7280]">
                Transactions exceeding ₹5,000 are gated and held for explicit merchant authorization.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#FF3B30]">Max Hard Limit</span>
              <h3 className="text-3xl font-black text-[#111827]">₹2,00,000.00</h3>
              <p className="text-xs text-[#6B7280]">
                Transactions above ₹2,00,000 are permanently blocked by the deterministic policy engine.
              </p>
            </div>
          </div>

          {/* Real-time transaction inspection */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-[#6B7280]" />
                <h4 className="text-sm font-bold text-[#111827]">Active Transaction Decision & Snapshot</h4>
              </div>

              {merchantTransaction && (
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-bold border",
                    merchantTransaction.state === "APPROVAL_REQUIRED"
                      ? "bg-[#FEF3C7] border-[#F59E0B]/40 text-[#B45309]"
                      : merchantTransaction.state === "APPROVED" || merchantTransaction.state === "PAID"
                      ? "bg-[#ECFDF5] border-[#10B981]/40 text-[#10B981]"
                      : "bg-[#FEF2F2] border-[#EF4444]/40 text-[#EF4444]"
                  )}
                >
                  {merchantTransaction.state}
                </span>
              )}
            </div>

            {merchantTransaction ? (
              <div className="space-y-6">
                {/* Pending Decision Banner with Approve / Reject Controls */}
                {merchantTransaction.state === "APPROVAL_REQUIRED" && (
                  <div className="bg-[#FFFBEB] border border-[#F59E0B] rounded-2xl p-5 space-y-4 animate-[fade-in_0.2s_ease-out]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-bold text-[#B45309]">
                        <ShieldAlert className="h-5 w-5 text-[#F59E0B]" />
                        <span>Action Required: Spend Threshold Exceeded</span>
                      </div>
                      <span className="text-[10px] font-black bg-[#B45309] text-white px-2.5 py-1 rounded-md uppercase tracking-wider">
                        Pending Merchant Decision
                      </span>
                    </div>

                    <p className="text-xs text-[#78350F] leading-relaxed">
                      Customer requested purchase of <strong>{merchantTransaction.productName}</strong> for{" "}
                      <strong>{formatPrice(merchantTransaction.totalAmount)}</strong>. This exceeds the autonomous limit of ₹5,000. Authorize to allow payment checkout or reject to cancel.
                    </p>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={() => handleMerchantApprove(merchantTransaction.id)}
                        disabled={isProcessingCheckout}
                        className="flex-1 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white py-3 text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Approve Transaction
                      </button>
                      <button
                        onClick={() => handleMerchantReject(merchantTransaction.id)}
                        disabled={isProcessingCheckout}
                        className="flex-1 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white py-3 text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                      >
                        <X className="h-4 w-4" />
                        Reject Transaction
                      </button>
                    </div>
                  </div>
                )}

                {merchantTransaction.state === "APPROVED" && (
                  <div className="bg-[#ECFDF5] border border-[#10B981] rounded-2xl p-4 flex items-center justify-between text-xs text-[#065F46] font-semibold">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
                      <span>Transaction Authorized by Merchant. Customer can now complete Razorpay payment.</span>
                    </div>
                  </div>
                )}

                {merchantTransaction.state === "REJECTED" && (
                  <div className="bg-[#FEF2F2] border border-[#EF4444] rounded-2xl p-4 flex items-center justify-between text-xs text-[#991B1B] font-semibold">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-[#EF4444]" />
                      <span>Transaction Rejected by Merchant. Checkout has been terminated.</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="bg-[#F9FAFB] p-3 rounded-xl border border-[#E5E7EB]">
                    <span className="text-[#6B7280] block text-[10px] uppercase">Transaction ID</span>
                    <span className="font-mono font-bold text-[#111827]">{merchantTransaction.id}</span>
                  </div>
                  <div className="bg-[#F9FAFB] p-3 rounded-xl border border-[#E5E7EB]">
                    <span className="text-[#6B7280] block text-[10px] uppercase">Authoritative Total</span>
                    <span className="font-bold text-[#111827]">{formatPrice(merchantTransaction.totalAmount)}</span>
                  </div>
                  <div className="bg-[#F9FAFB] p-3 rounded-xl border border-[#E5E7EB]">
                    <span className="text-[#6B7280] block text-[10px] uppercase">Product</span>
                    <span className="font-bold text-[#111827]">{merchantTransaction.productName}</span>
                  </div>
                  <div className="bg-[#F9FAFB] p-3 rounded-xl border border-[#E5E7EB]">
                    <span className="text-[#6B7280] block text-[10px] uppercase">Razorpay Order</span>
                    <span className="font-mono text-[#111827]">{merchantTransaction.razorpayOrderId || "Pending"}</span>
                  </div>
                </div>

                {/* Audit trail */}
                <div className="pt-2">
                  <span className="text-xs font-bold text-[#111827] block mb-2">Hash-Chained Audit Trail</span>
                  <div className="space-y-2">
                    {merchantTransaction.auditEvents?.map((evt: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-xs bg-[#F8F9FA] p-3 rounded-xl border border-[#E5E7EB] font-mono">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-[#111827]">{evt.eventType}</span>
                          <span className="text-[#6B7280]">{evt.actor}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[#9CA3AF] text-[11px]">
                          <Lock className="h-3 w-3" />
                          <span>Hash: {evt.hash.substring(0, 16)}...</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-[#6B7280]">
                No active transaction snapshot has been initiated yet.
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─── AUTHENTICATION / LOGIN MODAL ───────────── */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-[fade-in_0.2s_ease-out]">
          <div className="bg-white rounded-3xl border border-[#E5E7EB] max-w-md w-full p-8 shadow-2xl space-y-6 relative">
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-6 right-6 h-8 w-8 rounded-full bg-[#F8F9FA] hover:bg-[#E5E7EB] flex items-center justify-center text-[#111827] transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center space-y-1">
              <span className="text-2xl font-black tracking-tighter text-[#111827]">
                AURA<span className="text-[#FF3B30]">.</span>
              </span>
              <p className="text-xs text-[#6B7280]">Sign in to add items, shop with AI Copilot, and checkout</p>
            </div>

            {/* Role Tabs */}
            <div className="grid grid-cols-2 gap-1 bg-[#F8F9FA] p-1 rounded-xl border border-[#E5E7EB]">
              <button
                onClick={() => setAuthTab("CUSTOMER")}
                className={cn(
                  "py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5",
                  authTab === "CUSTOMER" ? "bg-white text-[#111827] shadow-xs" : "text-[#6B7280] hover:text-[#111827]"
                )}
              >
                <User className="h-3.5 w-3.5" />
                Customer
              </button>
              <button
                onClick={() => setAuthTab("MERCHANT")}
                className={cn(
                  "py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5",
                  authTab === "MERCHANT" ? "bg-white text-[#FF3B30] shadow-xs" : "text-[#6B7280] hover:text-[#111827]"
                )}
              >
                <Building2 className="h-3.5 w-3.5" />
                Merchant
              </button>
            </div>

            {/* Form */}
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[#4B5563] block mb-1">Email Address</label>
                <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder={authTab === "CUSTOMER" ? "alex@example.com" : "merchant@auratech.com"}
                  className="w-full rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] px-3.5 py-2.5 text-xs outline-none focus:border-[#111827]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#4B5563] block mb-1">Password</label>
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] px-3.5 py-2.5 text-xs outline-none focus:border-[#111827]"
                />
              </div>

              <button
                onClick={() => handleLogin(authTab)}
                className="w-full rounded-full bg-[#111827] hover:bg-[#FF3B30] text-white py-3 text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer mt-2"
              >
                Sign In as {authTab === "CUSTOMER" ? "Customer" : "Merchant Admin"}
              </button>
            </div>

            {/* Quick Demo Login Shortcuts */}
            <div className="pt-3 border-t border-[#E5E7EB] text-center space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] block">
                Quick Demo Sign In
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleLogin("CUSTOMER")}
                  className="rounded-xl bg-[#F8F9FA] hover:bg-[#E5E7EB] border border-[#E5E7EB] py-2 text-[11px] font-bold text-[#111827] transition-all cursor-pointer"
                >
                  👤 Alex (Customer)
                </button>
                <button
                  onClick={() => handleLogin("MERCHANT")}
                  className="rounded-xl bg-[#FFF1F0] hover:bg-[#FFE5E3] border border-[#FF3B30]/30 py-2 text-[11px] font-bold text-[#FF3B30] transition-all cursor-pointer"
                >
                  🏢 Merchant Admin
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Product Detail Modal ────────────────────── */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-[fade-in_0.2s_ease-out]">
          <div className="bg-white rounded-3xl border border-[#E5E7EB] max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-6 right-6 h-8 w-8 rounded-full bg-[#F8F9FA] hover:bg-[#E5E7EB] flex items-center justify-center text-[#111827] transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6">
              <div className="sm:col-span-5 h-56 bg-[#F8F9FA] rounded-2xl border border-[#E5E7EB] flex items-center justify-center text-8xl select-none">
                {selectedProduct.image || "📦"}
              </div>

              <div className="sm:col-span-7 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                  {selectedProduct.category} · In Stock ({selectedProduct.inventory})
                </span>
                <h3 className="text-xl font-bold text-[#111827]">{selectedProduct.name}</h3>
                <p className="text-xs text-[#4B5563] leading-relaxed">{selectedProduct.description}</p>

                <div className="pt-2">
                  <span className="text-2xl font-black text-[#111827]">
                    {formatPrice(selectedProduct.price)}
                  </span>
                </div>
              </div>
            </div>

            {selectedProduct.highlight && (
              <div className="bg-[#F8F9FA] rounded-2xl p-4 border border-[#E5E7EB] space-y-2">
                <span className="text-xs font-bold text-[#111827] block">Why you'll love it</span>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#4B5563]">
                  {selectedProduct.highlight.map((h, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-[#10B981] shrink-0" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-[#E5E7EB]">
              <button
                onClick={() => {
                  handleOpenNegotiation({
                    name: selectedProduct.name,
                    amount: selectedProduct.price,
                    quantity: 1,
                  });
                }}
                className="rounded-full bg-[#F8F9FA] hover:bg-[#E5E7EB] border border-[#D1D5DB] text-[#111827] px-5 py-3.5 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95"
              >
                <MessageSquare className="h-4 w-4 text-[#FF3B30]" />
                Negotiate
              </button>
              <button
                onClick={() => {
                  addToCart(selectedProduct, 1, false);
                  setSelectedProduct(null);
                }}
                className="flex-1 rounded-full bg-[#111827] hover:bg-[#FF3B30] text-white py-3.5 text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Add to Cart ({formatPrice(selectedProduct.price)})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Slide-Over Shopping Cart & Checkout Drawer with Contextual Upselling ── */}
      {isCartOpen && currentUser && currentUser.role === "CUSTOMER" && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-xs transition-opacity" onClick={() => setIsCartOpen(false)} />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white border-l border-[#E5E7EB] shadow-2xl flex flex-col">
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#E5E7EB]">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-[#111827]" />
                  <h3 className="text-base font-bold text-[#111827]">
                    {checkoutStep === "cart" ? "Your Cart" : checkoutStep === "checkout" ? "AgentPay Checkout" : "Order Confirmation"}
                  </h3>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="rounded-full p-2 text-[#6B7280] hover:bg-[#F3F4F6] cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {checkoutStep === "cart" && (
                  <>
                    {cart.length === 0 ? (
                      <div className="py-20 text-center space-y-3">
                        <ShoppingBag className="h-10 w-10 text-[#D1D5DB] mx-auto" />
                        <p className="text-sm font-semibold text-[#111827]">Your cart is empty</p>
                        <p className="text-xs text-[#6B7280]">Browse the collection or ask the AI Copilot to configure gear.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Cart Items List */}
                        <div className="space-y-3">
                          {cart.map((item) => (
                            <div
                              key={item.product.id}
                              className="flex items-center justify-between p-3.5 bg-[#F8F9FA] rounded-2xl border border-[#E5E7EB]"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center text-2xl shrink-0">
                                  {item.product.image || "📦"}
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-[#111827] line-clamp-1">{item.product.name}</h4>
                                  <span className="text-xs font-black text-[#111827]">{formatPrice(item.product.price)}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="flex items-center border border-[#D1D5DB] rounded-lg bg-white">
                                  <button
                                    onClick={() => updateCartQuantity(item.product.id, -1)}
                                    className="p-1 text-[#6B7280] hover:text-[#111827]"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>
                                  <span className="px-2 text-xs font-bold text-[#111827]">{item.quantity}</span>
                                  <button
                                    onClick={() => updateCartQuantity(item.product.id, 1)}
                                    className="p-1 text-[#6B7280] hover:text-[#111827]"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                </div>

                                <button
                                  onClick={() => removeFromCart(item.product.id)}
                                  className="p-1 text-[#9CA3AF] hover:text-[#FF3B30] transition-colors"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* ─── DYNAMIC CONTEXTUAL UPSELLING & BUNDLE RECOMMENDATIONS ─── */}
                        {smartCartUpsells.length > 0 && (
                          <div className="space-y-3 pt-2 border-t border-[#E5E7EB]">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-[#111827]">
                                <Sparkles className="h-4 w-4 text-[#FF3B30]" />
                                <span>Recommended Complementary Gear</span>
                              </div>
                              <span className="text-[10px] font-bold text-[#10B981] bg-[#ECFDF5] border border-[#10B981]/20 px-2 py-0.5 rounded-full">
                                Smart Match
                              </span>
                            </div>

                            <div className="space-y-2.5">
                              {smartCartUpsells.map((upsell) => (
                                <div
                                  key={upsell.product.id}
                                  className="bg-white rounded-2xl border border-[#E5E7EB] hover:border-[#111827]/40 p-3.5 shadow-xs space-y-2 transition-all"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-2.5">
                                      <div className="h-10 w-10 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-center text-xl shrink-0">
                                        {upsell.product.image || "📦"}
                                      </div>
                                      <div>
                                        <span className="text-[9px] font-black uppercase tracking-wider text-[#FF3B30] block">
                                          {upsell.badge}
                                        </span>
                                        <h5 className="text-xs font-bold text-[#111827] line-clamp-1">
                                          {upsell.product.name}
                                        </h5>
                                        <span className="text-xs font-black text-[#111827]">
                                          {formatPrice(upsell.product.price)}
                                        </span>
                                      </div>
                                    </div>

                                    <button
                                      onClick={() => addToCart(upsell.product, 1, false)}
                                      className="rounded-full bg-[#111827] hover:bg-[#FF3B30] text-white px-3 py-1.5 text-[11px] font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer active:scale-95 shrink-0"
                                    >
                                      <Plus className="h-3 w-3" />
                                      Add
                                    </button>
                                  </div>

                                  <p className="text-[10px] text-[#6B7280] leading-tight">
                                    {upsell.reason}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {checkoutStep === "checkout" && (
                  <div className="space-y-6">
                    {!currentUser ? (
                      <div className="bg-[#F8F9FA] rounded-2xl border border-[#E5E7EB] p-6 text-center space-y-4">
                        <Lock className="h-8 w-8 text-[#FF3B30] mx-auto" />
                        <div>
                          <h4 className="text-sm font-bold text-[#111827]">Account Sign-In Required</h4>
                          <p className="text-xs text-[#6B7280] mt-1">
                            Please sign in with your customer account to evaluate checkout policies and proceed to payment.
                          </p>
                        </div>
                        <button
                          onClick={() => setIsAuthModalOpen(true)}
                          className="w-full rounded-full bg-[#111827] hover:bg-[#FF3B30] text-white py-3 text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          Sign In to Continue
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <span className="text-xs font-bold text-[#111827] uppercase tracking-wider block">
                            Shipping Information
                          </span>
                          <input
                            type="text"
                            value={customer.name}
                            onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                            placeholder="Full Name"
                            className="w-full rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] px-3.5 py-2.5 text-xs outline-none focus:border-[#111827]"
                          />
                          <input
                            type="email"
                            value={customer.email}
                            onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                            placeholder="Email"
                            className="w-full rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] px-3.5 py-2.5 text-xs outline-none focus:border-[#111827]"
                          />
                          <input
                            type="text"
                            value={customer.phone}
                            onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                            placeholder="Phone"
                            className="w-full rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] px-3.5 py-2.5 text-xs outline-none focus:border-[#111827]"
                          />
                          <textarea
                            value={customer.address}
                            onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                            placeholder="Delivery Address"
                            rows={2}
                            className="w-full rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] px-3.5 py-2.5 text-xs outline-none focus:border-[#111827]"
                          />
                        </div>

                        {/* Customer-side holding notice */}
                        {policyDecision && policyDecision.decision === "APPROVAL_REQUIRED" && (
                          <div className="bg-[#FEF3C7] border border-[#F59E0B]/50 rounded-2xl p-4 space-y-2.5 animate-[fade-in_0.2s_ease-out]">
                            <div className="flex items-center gap-2 text-xs font-bold text-[#B45309]">
                              <ShieldAlert className="h-4 w-4 text-[#F59E0B]" />
                              <span>Merchant Approval Required (&gt; ₹5,000)</span>
                            </div>
                            <p className="text-[11px] text-[#78350F] leading-relaxed">
                              Your order total of {formatPrice(cartSubtotal)} exceeds the store's autonomous spending cap of ₹5,000. In accordance with AgentPay deterministic safety rules, this transaction has been securely held for merchant review.
                            </p>
                            <div className="flex items-center gap-2 pt-1 text-[11px] text-[#92400E] font-medium border-t border-[#F59E0B]/20">
                              <span className="h-2 w-2 rounded-full bg-[#F59E0B] animate-pulse" />
                              <span>Status: Awaiting authorization in Merchant Console</span>
                            </div>
                          </div>
                        )}

                        {policyDecision && policyDecision.state === "APPROVED" && (
                          <div className="bg-[#ECFDF5] border border-[#10B981] rounded-2xl p-4 space-y-2 animate-[fade-in_0.2s_ease-out]">
                            <div className="flex items-center gap-2 text-xs font-bold text-[#065F46]">
                              <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
                              <span>Transaction Approved by Merchant</span>
                            </div>
                            <p className="text-[11px] text-[#047857]">
                              The store merchant has authorized this order. You can now complete the payment via Razorpay.
                            </p>
                          </div>
                        )}

                        {policyDecision && (policyDecision.decision === "BLOCK" || policyDecision.state === "BLOCKED") && (
                          <div className="bg-[#FEF2F2] border border-[#EF4444] rounded-2xl p-4 space-y-3 animate-[fade-in_0.2s_ease-out]">
                            <div className="flex items-center gap-2 text-xs font-bold text-[#991B1B]">
                              <AlertCircle className="h-4 w-4 text-[#EF4444]" />
                              <span>Transaction Permanently Blocked (&gt; ₹2,00,000)</span>
                            </div>
                            <p className="text-[11px] text-[#991B1B] leading-relaxed">
                              Your order total of {formatPrice(cartSubtotal)} exceeds the store's maximum permitted transaction limit of ₹2,00,000. This transaction has been permanently blocked by the deterministic policy engine and cannot proceed automatically.
                            </p>
                            <div className="flex items-center gap-2 pt-1 text-[11px] text-[#991B1B] font-medium border-t border-[#EF4444]/20">
                              <span className="h-2 w-2 rounded-full bg-[#EF4444]" />
                              <span>Status: Blocked — negotiate with merchant or reduce cart total below ₹2,00,000</span>
                            </div>
                            <button
                              onClick={() => handleOpenNegotiation()}
                              className="w-full rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white py-2.5 px-4 text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                            >
                              <MessageSquare className="h-4 w-4" />
                              Negotiate with Merchant
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {checkoutStep === "success" && completedOrder && (
                  <div className="py-8 text-center space-y-6 animate-[fade-in_0.3s_ease-out]">
                    <div className="h-16 w-16 bg-[#ECFDF5] border border-[#10B981] rounded-full flex items-center justify-center text-[#10B981] mx-auto">
                      <Check className="h-8 w-8 stroke-[3]" />
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-[#111827]">Payment Successful</h3>
                      <p className="text-xs text-[#6B7280] mt-1">Your order has been confirmed on Razorpay test rails.</p>
                    </div>

                    <div className="bg-[#F8F9FA] rounded-2xl border border-[#E5E7EB] p-4 text-xs font-mono text-left space-y-2">
                      <div className="flex justify-between">
                        <span className="text-[#6B7280]">Razorpay Order:</span>
                        <span className="font-bold text-[#111827]">{completedOrder.orderId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6B7280]">Payment ID:</span>
                        <span className="font-bold text-[#10B981]">{completedOrder.paymentId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6B7280]">Settled Amount:</span>
                        <span className="font-bold text-[#111827]">{formatPrice(completedOrder.amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6B7280]">Est. Delivery:</span>
                        <span className="text-[#111827]">2 Business Days</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setCurrentView("customer_orders");
                          setIsCartOpen(false);
                        }}
                        className="flex-1 rounded-full bg-[#F8F9FA] hover:bg-[#E5E7EB] border border-[#D1D5DB] py-3 text-xs font-bold text-[#111827] cursor-pointer"
                      >
                        View Order Details
                      </button>
                      <button
                        onClick={() => {
                          setCheckoutStep("cart");
                          setIsCartOpen(false);
                        }}
                        className="flex-1 rounded-full bg-[#111827] hover:bg-[#27272A] text-white py-3 text-xs font-bold cursor-pointer"
                      >
                        Continue Shopping
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {checkoutStep !== "success" && cart.length > 0 && (
                <div className="p-6 border-t border-[#E5E7EB] bg-[#F8F9FA] space-y-4">
                  <div className="space-y-1.5 text-xs text-[#6B7280]">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-bold text-[#111827]">{formatPrice(cartSubtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Carbon-Neutral Delivery</span>
                      <span className="font-bold text-[#10B981]">FREE</span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-[#111827] pt-2 border-t border-[#E5E7EB]">
                      <span>Total Amount</span>
                      <span>{formatPrice(cartSubtotal)}</span>
                    </div>
                  </div>

                  {checkoutStep === "cart" ? (
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          if (!currentUser) {
                            setIsAuthModalOpen(true);
                            return;
                          }
                          setCheckoutStep("checkout");
                        }}
                        className="w-full rounded-full bg-[#111827] hover:bg-[#FF3B30] text-white py-3.5 text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {currentUser ? "Proceed to Checkout" : "Sign In to Checkout"}
                        <ArrowRight className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleOpenNegotiation()}
                        className="w-full rounded-full bg-[#F8F9FA] hover:bg-[#E5E7EB] border border-[#D1D5DB] text-[#111827] py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-[#FF3B30]" />
                        Negotiate Cart Price
                      </button>
                    </div>
                  ) : policyDecision?.decision === "BLOCK" || policyDecision?.state === "BLOCKED" ? (
                    <div className="space-y-2">
                      <button
                        onClick={() => handleOpenNegotiation()}
                        className="w-full rounded-full bg-[#EF4444] hover:bg-[#DC2626] text-white py-3.5 text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Negotiate with Merchant
                      </button>
                      <p className="text-[11px] text-center text-[#6B7280]">
                        Order exceeds ₹2,00,000 policy limit. Contact merchant directly.
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        if (!currentUser) {
                          setIsAuthModalOpen(true);
                          return;
                        }
                        if (policyDecision?.decision === "APPROVAL_REQUIRED" && policyDecision?.state !== "APPROVED") {
                          alert("This transaction requires authorization in the Merchant Console before payment can be executed.");
                          return;
                        }
                        if (policyDecision?.state === "APPROVED" && policyDecision?.transactionId) {
                          launchRazorpayCheckout(policyDecision.transactionId);
                          return;
                        }
                        handleInitiateAgentPayCheckout();
                      }}
                      disabled={isProcessingCheckout || (policyDecision?.decision === "APPROVAL_REQUIRED" && policyDecision?.state !== "APPROVED")}
                      className="w-full rounded-full bg-[#111827] hover:bg-[#FF3B30] text-white py-3.5 text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {isProcessingCheckout
                        ? "Evaluating Policy Limits..."
                        : policyDecision?.decision === "APPROVAL_REQUIRED" && policyDecision?.state !== "APPROVED"
                        ? "Awaiting Merchant Approval..."
                        : policyDecision?.state === "APPROVED"
                        ? "Complete Payment (Approved)"
                        : "Pay with AgentPay & Razorpay"}
                      <CreditCard className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── SUPERCHARGED AI ASSISTANT DRAWER WITH COMPANION UPSELLS ─── */}
      {isAiAgentOpen && currentUser && currentUser.role === "CUSTOMER" && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-xs transition-opacity" onClick={() => setIsAiAgentOpen(false)} />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-lg bg-white border-l border-[#E5E7EB] shadow-2xl flex flex-col">
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#E5E7EB] bg-[#FAFAFA]">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-2xl bg-[#111827] text-white flex items-center justify-center shadow-xs">
                    <Sparkles className="h-4 w-4 text-[#FF3B30]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#111827]">AURA AI Shopping Copilot</h3>
                    <div className="text-[10px] text-[#10B981] font-semibold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse" />
                      Session: {currentUser.name}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {cartItemCount > 0 && (
                    <button
                      onClick={() => {
                        setIsAiAgentOpen(false);
                        setCheckoutStep("cart");
                        setIsCartOpen(true);
                      }}
                      className="rounded-full bg-white border border-[#D1D5DB] px-3 py-1 text-xs font-bold text-[#111827] hover:bg-[#F3F4F6] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <ShoppingBag className="h-3.5 w-3.5 text-[#FF3B30]" />
                      <span>{cartItemCount} in Cart</span>
                    </button>
                  )}
                  <button
                    onClick={() => setIsAiAgentOpen(false)}
                    className="rounded-full p-2 text-[#6B7280] hover:bg-[#F3F4F6] cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Chat Stream */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {aiMessages.map((m, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex gap-3 text-xs leading-relaxed",
                      m.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {m.role === "agent" && (
                      <div className="h-7 w-7 rounded-full bg-[#111827] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                        AI
                      </div>
                    )}
                    <div className="space-y-3 max-w-[88%]">
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-3 shadow-xs",
                          m.role === "user"
                            ? "bg-[#111827] text-white rounded-br-xs"
                            : "bg-[#F8F9FA] border border-[#E5E7EB] text-[#111827] rounded-bl-xs"
                        )}
                      >
                        {m.content}
                      </div>

                      {/* Cart Action Success Banner */}
                      {m.addedToCart && (
                        <div className="bg-[#ECFDF5] border border-[#10B981]/30 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-xs animate-[fade-in_0.2s_ease-out]">
                          <div className="flex items-center gap-2 text-xs font-bold text-[#065F46]">
                            <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0" />
                            <span>{m.addedToCart.count} item(s) in Cart</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => {
                                setIsAiAgentOpen(false);
                                setIsCartOpen(true);
                                setCheckoutStep("cart");
                              }}
                              className="rounded-xl bg-[#111827] hover:bg-[#374151] text-white px-3 py-1.5 text-[11px] font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                            >
                              View Cart
                            </button>
                            <button
                              onClick={() => {
                                setIsAiAgentOpen(false);
                                setIsCartOpen(true);
                                setCheckoutStep("checkout");
                              }}
                              className="rounded-xl bg-[#10B981] hover:bg-[#059669] text-white px-3 py-1.5 text-[11px] font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                            >
                              Checkout
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Embedded Product Recommendation Card(s) */}
                      {((m.products && m.products.length > 0) || m.recommendedProduct) && (
                        <div className="space-y-2.5 animate-[scale-in_0.2s_ease-out]">
                          {(m.products && m.products.length > 0 ? m.products : [m.recommendedProduct!]).map((prod) => (
                            <div key={prod.id} className="bg-white rounded-2xl border-2 border-[#111827]/15 p-3.5 space-y-2.5 shadow-sm">
                              <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-center text-2xl shrink-0">
                                  {prod.image || "📦"}
                                </div>
                                <div className="space-y-0.5 flex-1 min-w-0">
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#6B7280] block">
                                    {prod.category} · In Stock
                                  </span>
                                  <h4 className="text-xs font-bold text-[#111827] truncate">
                                    {prod.name}
                                  </h4>
                                  <div className="flex items-center justify-between pt-0.5">
                                    <span className="text-sm font-black text-[#111827]">
                                      {formatPrice(prod.price)}
                                    </span>
                                    <div className="flex items-center gap-1 text-[#F59E0B] font-bold text-[10px]">
                                      <Star className="h-3 w-3 fill-current" />
                                      <span>{prod.rating || 4.9}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex gap-2 pt-0.5">
                                <button
                                  onClick={() => addToCart(prod, 1, false)}
                                  className="flex-1 rounded-xl bg-[#111827] hover:bg-[#FF3B30] text-white py-2 text-[11px] font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                  {cart.some((c) => c.product.id === prod.id)
                                    ? `+ Add More (In Cart: ${cart.find((c) => c.product.id === prod.id)?.quantity})`
                                    : "Add to Cart"}
                                </button>

                                <button
                                  onClick={() => {
                                    addToCart(prod, 1, true);
                                    setIsAiAgentOpen(false);
                                  }}
                                  className="rounded-xl bg-[#F8F9FA] hover:bg-[#E5E7EB] border border-[#D1D5DB] px-3 py-2 text-[11px] font-bold text-[#111827] transition-all cursor-pointer"
                                >
                                  Checkout
                                </button>
                              </div>
                            </div>
                          ))}

                          {/* Multi-item Quick Add All Button */}
                          {m.products && m.products.length > 1 && (
                            <button
                              onClick={() => {
                                m.products!.forEach((p) => addToCart(p, 1, false));
                                showToast(`✓ Added all ${m.products!.length} items to cart`);
                              }}
                              className="w-full rounded-xl bg-[#FF3B30] hover:bg-[#E0342B] text-white py-2.5 text-xs font-black transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                            >
                              <Plus className="h-4 w-4" />
                              Add All {m.products.length} Items to Cart
                            </button>
                          )}
                        </div>
                      )}

                      {/* ─── IN-CHAT COMPANION UPSELLS & BUNDLE PAIRING ─── */}
                      {m.companionProducts && m.companionProducts.length > 0 && (
                        <div className="bg-[#FFF4EC] border border-[#FF6B00]/30 rounded-2xl p-3.5 space-y-2.5 animate-[fade-in_0.2s_ease-out]">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-[#FF6B00]">
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Recommended Companion Pairings</span>
                          </div>

                          <div className="space-y-2">
                            {m.companionProducts
                              .filter((companion) => companion && companion.product)
                              .map((companion, idx) => (
                                <div
                                  key={companion.product.id || idx}
                                  className="bg-white rounded-xl border border-[#FF6B00]/20 p-2.5 flex items-center justify-between gap-3 shadow-xs"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div className="h-9 w-9 rounded-lg bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-center text-lg shrink-0">
                                      {companion.product.image || "📦"}
                                    </div>
                                    <div>
                                      <span className="text-[8px] font-black uppercase text-[#FF6B00] block">
                                        {companion.badge || "Pairing"}
                                      </span>
                                      <h5 className="text-[11px] font-bold text-[#111827] line-clamp-1">
                                        {companion.product.name}
                                      </h5>
                                      <span className="text-[11px] font-black text-[#111827]">
                                        {formatPrice(companion.product.price || 0)}
                                      </span>
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => addToCart(companion.product, 1, false)}
                                    className="rounded-lg bg-[#FF6B00] hover:bg-[#E05E00] text-white px-2.5 py-1 text-[10px] font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer active:scale-95 shrink-0"
                                  >
                                    <Plus className="h-3 w-3" />
                                    Add
                                  </button>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isAiTyping && (
                  <div className="flex items-center gap-2 text-xs text-[#6B7280] bg-[#F8F9FA] p-3 rounded-2xl border border-[#E5E7EB] w-fit animate-pulse">
                    <Sparkles className="h-3.5 w-3.5 text-[#FF3B30]" />
                    <span>AI Copilot is analyzing equipment catalog...</span>
                  </div>
                )}
              </div>

              {/* Chat Input & Multi-Item Suggestion Chips */}
              <div className="p-4 border-t border-[#E5E7EB] bg-[#F8F9FA] space-y-2.5">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAiSendMessage()}
                    placeholder="Ask for more gear to add to your cart..."
                    className="flex-1 rounded-full bg-white border border-[#D1D5DB] px-4 py-2.5 text-xs outline-none focus:border-[#111827] shadow-xs"
                  />
                  <button
                    onClick={handleAiSendMessage}
                    disabled={isAiTyping || !aiInput.trim()}
                    className="rounded-full bg-[#111827] text-white p-2.5 hover:bg-[#FF3B30] transition-colors disabled:opacity-30 cursor-pointer shadow-xs active:scale-95"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {[
                    "RTX 4080 Super gaming build",
                    "Ryzen 7 7800X3D CPU",
                    "Curved QD-OLED 240Hz monitor",
                    "2TB Gen4 SSD",
                  ].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => executeAiPrompt(chip)}
                      className="text-[10px] bg-white border border-[#E5E7EB] rounded-full px-2.5 py-1 text-[#4B5563] hover:text-[#111827] hover:border-[#111827] transition-colors cursor-pointer"
                    >
                      ⚡ {chip}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ─── MERCHANT NEGOTIATION MODAL (RANDOMIZED CONTACT DETAILS) ─── */}
      {isNegotiationModalOpen && negotiationMerchant && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-[fade-in_0.2s_ease-out]">
          <div className="bg-white rounded-3xl border border-[#E5E7EB] max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#E5E7EB] pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-[#FFF1F0] border border-[#FF3B30]/30 flex items-center justify-center text-[#FF3B30]">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <h3 className="text-xl font-bold text-[#111827]">Direct Merchant Negotiation Desk</h3>
                </div>
                <p className="text-xs text-[#6B7280]">
                  Direct channel with authorized merchant representatives for high-value orders and volume pricing.
                </p>
              </div>

              <button
                onClick={() => setIsNegotiationModalOpen(false)}
                className="h-8 w-8 rounded-full bg-[#F8F9FA] hover:bg-[#E5E7EB] flex items-center justify-center text-[#111827] transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Target Order / Product Context */}
            {negotiationItemOrCart && (
              <div className="bg-[#F8F9FA] rounded-2xl border border-[#E5E7EB] p-4 flex items-center justify-between flex-wrap gap-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Negotiating For</span>
                  <h4 className="text-sm font-bold text-[#111827]">{negotiationItemOrCart.name}</h4>
                  <p className="text-[11px] text-[#6B7280]">
                    {negotiationItemOrCart.quantity ? `Quantity: ${negotiationItemOrCart.quantity} unit(s)` : "Single Order"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Listed Value</span>
                  <div className="text-lg font-black text-[#111827]">
                    {formatPrice(negotiationItemOrCart.amount)}
                  </div>
                </div>
              </div>
            )}

            {/* Merchant Details Card (Randomized & Verifiable) */}
            <div className="bg-gradient-to-br from-white to-[#F8F9FA] rounded-2xl border-2 border-[#111827]/10 p-5 space-y-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
                  <span className="text-xs font-bold text-[#111827]">{negotiationMerchant.storeBranch}</span>
                </div>
                <button
                  onClick={handleRegenerateMerchant}
                  className="rounded-full bg-white hover:bg-[#F3F4F6] border border-[#D1D5DB] px-3 py-1 text-[11px] font-semibold text-[#4B5563] flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                  title="Load another randomized registered merchant location"
                >
                  <RefreshCw className="h-3 w-3 text-[#6B7280]" />
                  <span>Randomize Outlet</span>
                </button>
              </div>

              {/* POC Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Merchant Representative</span>
                  <div className="text-sm font-bold text-[#111827] flex items-center gap-1.5">
                    <User className="h-4 w-4 text-[#FF3B30]" />
                    {negotiationMerchant.representativeName}
                  </div>
                  <p className="text-[11px] text-[#6B7280]">{negotiationMerchant.designation}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Desk Ref & Hours</span>
                  <div className="text-xs font-mono font-bold text-[#111827] flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-[#10B981]" />
                    {negotiationMerchant.negotiationCode}
                  </div>
                  <p className="text-[11px] text-[#6B7280] flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {negotiationMerchant.workingHours}
                  </p>
                </div>
              </div>

              {/* Direct Phone & Address Highlights */}
              <div className="space-y-3 pt-2">
                {/* Phone Number */}
                <div className="bg-white rounded-xl border border-[#E5E7EB] p-3 flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-[#ECFDF5] text-[#10B981] flex items-center justify-center shrink-0">
                      <PhoneCall className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block">
                        Direct Merchant Phone
                      </span>
                      <a
                        href={`tel:${negotiationMerchant.phone}`}
                        className="text-sm font-bold text-[#111827] hover:text-[#FF3B30] transition-colors"
                      >
                        {negotiationMerchant.phoneFormatted}
                      </a>
                      <span className="text-[10px] text-[#6B7280] block">Landline: {negotiationMerchant.landline}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <a
                      href={`https://wa.me/${negotiationMerchant.phone.replace(/[^0-9]/g, "")}?text=Hi%20${encodeURIComponent(negotiationMerchant.representativeName)},%20I%20am%20inquiring%20about%20a%20high-value%20order%20(${negotiationMerchant.negotiationCode})`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-[#25D366] hover:bg-[#1EBE5D] text-white px-3 py-1.5 text-[11px] font-bold flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                    >
                      WhatsApp
                    </a>
                    <button
                      onClick={() => handleCopyText(negotiationMerchant.phoneFormatted, "Phone Number")}
                      className="rounded-lg bg-[#F8F9FA] hover:bg-[#E5E7EB] border border-[#D1D5DB] p-2 text-[#4B5563] transition-all cursor-pointer"
                      title="Copy Phone Number"
                    >
                      {copiedField === "Phone Number" ? (
                        <Check className="h-3.5 w-3.5 text-[#10B981]" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Address */}
                <div className="bg-white rounded-xl border border-[#E5E7EB] p-3 flex items-start justify-between gap-3 shadow-xs">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl bg-[#FFF1F0] text-[#FF3B30] flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block">
                        Merchant Registered Address
                      </span>
                      <p className="text-xs font-semibold text-[#111827] leading-relaxed">
                        {negotiationMerchant.fullAddress}
                      </p>
                      <span className="text-[10px] text-[#6B7280] block mt-0.5">
                        City: {negotiationMerchant.city} · State: {negotiationMerchant.state} · PIN: {negotiationMerchant.pincode}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopyText(negotiationMerchant.fullAddress, "Address")}
                    className="rounded-lg bg-[#F8F9FA] hover:bg-[#E5E7EB] border border-[#D1D5DB] p-2 text-[#4B5563] transition-all cursor-pointer shrink-0"
                    title="Copy Address"
                  >
                    {copiedField === "Address" ? (
                      <Check className="h-3.5 w-3.5 text-[#10B981]" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive Counter-Offer Form or Confirmation */}
            {negotiationSubmitted ? (
              <div className="bg-[#ECFDF5] border border-[#10B981] rounded-2xl p-5 space-y-3 animate-[fade-in_0.3s_ease-out]">
                <div className="flex items-center gap-2 text-sm font-bold text-[#065F46]">
                  <CheckCircle2 className="h-5 w-5 text-[#10B981]" />
                  <span>Negotiation Proposal Dispatched!</span>
                </div>
                <p className="text-xs text-[#047857] leading-relaxed">
                  Your proposal has been logged under Reference ID <strong className="font-mono">{negotiationMerchant.negotiationCode}</strong>. Merchant representative <strong>{negotiationMerchant.representativeName}</strong> at the {negotiationMerchant.city} branch will contact you at <strong>{customer.phone}</strong> or <strong>{customer.email}</strong>.
                </p>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setNegotiationSubmitted(false)}
                    className="rounded-xl bg-white border border-[#10B981]/40 text-[#065F46] hover:bg-[#ECFDF5] px-4 py-2 text-xs font-bold transition-all cursor-pointer"
                  >
                    Send Another Proposal
                  </button>
                  <button
                    onClick={() => setIsNegotiationModalOpen(false)}
                    className="rounded-xl bg-[#10B981] hover:bg-[#059669] text-white px-4 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitNegotiationOffer} className="space-y-4 pt-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#111827]">
                    Send Direct Price Counter-Offer
                  </h4>
                  <span className="text-[10px] text-[#6B7280]">Instant Merchant Escalation</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-[#4B5563] block mb-1">
                      Proposed Price (₹)
                    </label>
                    <input
                      type="number"
                      value={negotiationOfferAmount}
                      onChange={(e) => setNegotiationOfferAmount(e.target.value)}
                      placeholder="e.g. 185000"
                      className="w-full rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] px-3.5 py-2.5 text-xs outline-none focus:border-[#111827]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#4B5563] block mb-1">
                      Customer Contact Phone
                    </label>
                    <input
                      type="text"
                      value={customer.phone}
                      onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                      className="w-full rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] px-3.5 py-2.5 text-xs outline-none focus:border-[#111827]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#4B5563] block mb-1">
                    Custom Message or Requirements (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={negotiationNote}
                    onChange={(e) => setNegotiationNote(e.target.value)}
                    placeholder="e.g. Requesting bundled shipping discount, corporate GST invoice, or bulk delivery timeline..."
                    className="w-full rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] px-3.5 py-2.5 text-xs outline-none focus:border-[#111827]"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsNegotiationModalOpen(false)}
                    className="rounded-full bg-[#F8F9FA] hover:bg-[#E5E7EB] border border-[#D1D5DB] text-[#111827] px-5 py-3 text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-full bg-[#111827] hover:bg-[#FF3B30] text-white py-3 text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                  >
                    <Send className="h-4 w-4" />
                    Submit Negotiation Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
