import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create User (Merchant Owner)
  const user = await prisma.user.upsert({
    where: { email: 'merchant@agentpay.demo' },
    update: {},
    create: {
      email: 'merchant@agentpay.demo',
      name: 'AURA Electronics Merchant',
      role: 'MERCHANT',
    },
  })

  // Clear existing to avoid duplicates on re-seed
  await prisma.auditEvent.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.policy.deleteMany()
  await prisma.product.deleteMany()
  await prisma.merchant.deleteMany({
    where: { userId: user.id }
  })

  // Create Merchant
  const merchant = await prisma.merchant.create({
    data: {
      name: 'AURA Electronics Store',
      userId: user.id,
    }
  })

  // Create Policy (₹5,000 Autonomous Limit, ₹2,00,000 Max Cap)
  await prisma.policy.create({
    data: {
      merchantId: merchant.id,
      autonomousLimit: 500000, // ₹5,000 in paise
      approvalThreshold: 500000, // ₹5,000 in paise
      maxAmount: 20000000, // ₹2,00,000 in paise
      maxQuantity: 10,
    }
  })

  // Expanded Consumer Electronics, GPUs, CPUs, Monitors & Hardware Catalog
  const products = [
    // ─── Keyboards ─────────────────────────────────────────
    {
      name: 'AURA Tactile Wireless Mechanical Keyboard',
      description: 'Hot-swappable custom Gateron Brown switches, tri-mode wireless (2.4G/BT5.0/USB-C), CNC aluminum top frame, acoustic foam, and 4000mAh battery for 200 hours.',
      price: 449900, // ₹4,499
      inventory: 25,
      category: 'Keyboards',
    },
    {
      name: 'AURA Apex 75% Magnetic Rapid Trigger Keyboard',
      description: 'Hall effect magnetic switches with 0.1mm adjustable rapid-trigger actuation, CNC anodized aluminum case, and 8,000Hz polling rate for esports.',
      price: 799900, // ₹7,999
      inventory: 15,
      category: 'Keyboards',
    },

    // ─── Mice ──────────────────────────────────────────────
    {
      name: 'AURA Precision Ergonomic Wireless Mouse',
      description: 'Ultra-lightweight 49g ergonomic chassis with PixArt PAW3395 26,000 DPI optical sensor, optical micro-switches, and 4K wireless polling rate.',
      price: 199900, // ₹1,999
      inventory: 30,
      category: 'Mice',
    },
    {
      name: 'AURA Carbon Ultralight 38g 8K Wireless Mouse',
      description: 'Real carbon fiber composite unibody shell, PixArt PAW3950 optical sensor, 8000Hz hyper-polling dongle included, and pure PTFE skate feet.',
      price: 389900, // ₹3,899
      inventory: 20,
      category: 'Mice',
    },

    // ─── GPUs (Graphics Cards) ─────────────────────────────
    {
      name: 'AURA GeForce RTX 5090 32GB OC Flagship GPU',
      description: 'Next-gen NVIDIA Blackwell architecture, 32GB ultra-fast GDDR7 512-bit memory, 28,160 CUDA cores, DLSS 4 AI neural frame generation, and quad-slot vapor chamber liquid metal cooling.',
      price: 8999900, // ₹89,999
      inventory: 5,
      category: 'GPUs',
    },
    {
      name: 'AURA GeForce RTX 5080 16GB OC Edition GPU',
      description: 'NVIDIA Blackwell architecture, 16GB GDDR7 256-bit memory, 10,752 CUDA cores, full path ray tracing 4.0, DLSS 4 AI acceleration, and reinforced CNC titanium shroud.',
      price: 5499900, // ₹54,999
      inventory: 8,
      category: 'GPUs',
    },
    {
      name: 'AURA GeForce RTX 5070 Ti 16GB OC Gaming GPU',
      description: 'NVIDIA Blackwell architecture, 16GB GDDR7 memory, 8,960 CUDA cores, ultra-efficient 250W TGP, triple axial stealth fans, and dual BIOS.',
      price: 3799900, // ₹37,999
      inventory: 12,
      category: 'GPUs',
    },
    {
      name: 'AURA GeForce RTX 4080 Super 16GB OC Edition',
      description: 'NVIDIA Ada Lovelace architecture, 16GB GDDR6X, triple-fan vapor chamber cooling, full ray tracing, DLSS 3.5 AI frame generation, and reinforced aluminum backplate.',
      price: 4499900, // ₹44,999
      inventory: 6,
      category: 'GPUs',
    },
    {
      name: 'AURA Radeon RX 7800 XT 16GB High-Performance GPU',
      description: 'AMD RDNA 3 architecture, 16GB GDDR6 memory, dual-axial high-flow fans, AMD HYPR-RX, FSR 3 frame generation, and 1440p ultra settings master.',
      price: 2199900, // ₹21,999
      inventory: 10,
      category: 'GPUs',
    },

    // ─── CPUs (Processors) ─────────────────────────────────
    {
      name: 'AURA Core i9-14900K 24-Core Desktop CPU',
      description: '24 cores (8 Performance + 16 Efficient), 32 threads, up to 6.0 GHz Turbo boost, unlocked for extreme overclocking, PCIe 5.0 and DDR5 support.',
      price: 1849900, // ₹18,499
      inventory: 12,
      category: 'CPUs',
    },
    {
      name: 'AURA Ryzen 7 7800X3D 8-Core Gaming Processor',
      description: 'AMD 3D V-Cache technology with 96MB L3 cache, 8 cores / 16 threads, 5.0 GHz max boost, ultra-efficient 120W TDP, the definitive competitive gaming CPU.',
      price: 1599900, // ₹15,999
      inventory: 14,
      category: 'CPUs',
    },

    // ─── Monitors ──────────────────────────────────────────
    {
      name: 'AURA Horizon 27" 4K UHD Creator Monitor',
      description: '27-inch 4K IPS panel, 99% DCI-P3 color gamut, factory calibrated delta E < 1, USB-C 90W power delivery hub, and ultra-thin bezel aluminum stand.',
      price: 2499900, // ₹24,999
      inventory: 8,
      category: 'Monitors',
    },
    {
      name: 'AURA Vision Ultra 34" Curved QD-OLED 240Hz Monitor',
      description: '3440x1440 UWQHD Quantum Dot OLED panel, 240Hz refresh rate, 0.03ms instant response time, VESA DisplayHDR TrueBlack 400, and 1800R immersive curve.',
      price: 3899900, // ₹38,999
      inventory: 5,
      category: 'Monitors',
    },
    {
      name: 'AURA Canvas 24" 1080p 180Hz Fast-IPS Esports Display',
      description: '1920x1080 Full HD Fast-IPS panel, 180Hz refresh, 1ms GtG response, 100% sRGB color, AMD FreeSync Premium, and ergonomic height/tilt stand.',
      price: 429900, // ₹4,299
      inventory: 22,
      category: 'Monitors',
    },

    // ─── Storage & RAM ─────────────────────────────────────
    {
      name: 'AURA Velocity 2TB PCIe Gen4 NVMe M.2 SSD',
      description: 'Sequential read speeds up to 7,400 MB/s, custom graphene heatsink, 3D TLC NAND, 1200 TBW endurance rating, PS5 & PC compatible.',
      price: 399900, // ₹3,999
      inventory: 35,
      category: 'Storage',
    },
    {
      name: 'AURA Dominator 32GB (2x16GB) DDR5-6000 CL30 RAM',
      description: 'High-speed DDR5-6000MHz memory kit, ultra-tight CL30-36-36-76 timings, AMD EXPO & Intel XMP 3.0 profiles, matte black anodized aluminum spreader.',
      price: 299900, // ₹2,999
      inventory: 28,
      category: 'RAM',
    },

    // ─── Audio ─────────────────────────────────────────────
    {
      name: 'AURA Studio Pro Wireless Headphones',
      description: 'Flagship hybrid Active Noise Cancellation (ANC), 40mm custom beryllium dynamic drivers, lossless LDAC codec, and 38-hour playback with fast charge.',
      price: 1249900, // ₹12,499
      inventory: 15,
      category: 'Audio',
    },
    {
      name: 'AURA AirBuds Ultra Spatial TWS',
      description: 'True wireless in-ear earbuds with head-tracking spatial audio, adaptive noise cancellation, quad-mic beamforming for crystal clear calls, and 32h total battery.',
      price: 349900, // ₹3,499
      inventory: 40,
      category: 'Audio',
    },

    // ─── Wearables & Accessories ───────────────────────────
    {
      name: 'AURA Timepiece Titanium Smartwatch',
      description: 'Aerospace-grade titanium body with sapphire crystal display, AMOLED 1000-nit always-on screen, dual-frequency GPS, ECG monitor, and 14-day battery life.',
      price: 899900, // ₹8,999
      inventory: 18,
      category: 'Wearables',
    },
    {
      name: 'AURA Minimal Merino Wool Desk Mat',
      description: 'Premium high-density 100% natural merino wool felt desk pad with anti-slip natural eco-rubber base. Protects your desk while optimizing mouse gliding.',
      price: 129900, // ₹1,299
      inventory: 50,
      category: 'Accessories',
    },
    {
      name: 'AURA Compact 65W GaN Dual Fast Charger',
      description: 'Next-gen Gallium Nitride (GaN III) compact wall adapter with dual USB-C Power Delivery 3.0 ports and foldable travel prongs. Fast-charges laptop and phone simultaneously.',
      price: 189900, // ₹1,899
      inventory: 45,
      category: 'Accessories',
    }
  ]

  for (const p of products) {
    await prisma.product.create({
      data: {
        merchantId: merchant.id,
        ...p,
      }
    })
  }

  console.log(`Database successfully seeded with ${products.length} AURA hardware & electronics products.`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
