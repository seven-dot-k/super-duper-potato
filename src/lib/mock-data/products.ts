import type { Product } from "@/lib/schemas/catalog";

const products: Product[] = [
  {
    name: "Wireless Headphones Pro",
    sku: "ELEC-001",
    category: "electronics",
    imageUrl: "/mock-products/elec-001.svg",
    content: {
      shortDescription: "Premium wireless headphones with noise cancellation.",
      longDescription:
        "Our wireless headphones feature active noise cancellation, 30-hour battery life, and premium drivers for exceptional audio quality. Comfortable over-ear design with memory foam cushions.",
    },
    seoContent: {
      metaTitle: "Wireless Headphones Pro | Electronics",
      metaDescription: "Buy Wireless Headphones Pro online.",
    },
  },
  {
    name: "USB-C Hub 7-in-1",
    sku: "ELEC-002",
    category: "electronics",
    imageUrl: "/mock-products/elec-002.svg",
    content: {
      shortDescription: "Compact USB-C hub with 7 ports.",
      longDescription:
        "Expand your connectivity with this 7-in-1 USB-C hub featuring HDMI 4K, USB 3.0, SD card reader, and power delivery passthrough. Works with all USB-C laptops.",
    },
    seoContent: {
      metaTitle: "USB-C Hub 7-in-1 | Electronics",
      metaDescription: "Shop USB-C Hub 7-in-1 online.",
    },
  },
  {
    name: "Smart Watch Series X",
    sku: "ELEC-003",
    category: "electronics",
    imageUrl: "/mock-products/elec-003.svg",
    content: {
      shortDescription: "Advanced smartwatch with health monitoring.",
      longDescription:
        "Track your fitness and health with the Smart Watch Series X. Features heart rate monitoring, GPS, sleep tracking, and 5-day battery life. Water resistant to 50m.",
    },
    seoContent: {
      metaTitle: "Smart Watch Series X | Electronics",
      metaDescription: "Buy Smart Watch Series X online.",
    },
  },
  {
    name: "Portable Bluetooth Speaker",
    sku: "ELEC-004",
    category: "electronics",
    imageUrl: "/mock-products/elec-004.svg",
    content: {
      shortDescription: "Waterproof Bluetooth speaker with 360 sound.",
      longDescription:
        "Take your music anywhere with this rugged portable speaker. IPX7 waterproof rating, 12 hours of playback, and immersive 360-degree sound. Pairs with up to 2 devices.",
    },
    seoContent: {
      metaTitle: "Portable Bluetooth Speaker | Electronics",
      metaDescription: "Shop portable Bluetooth speakers.",
    },
  },
  {
    name: "4K Webcam Ultra",
    sku: "ELEC-005",
    category: "electronics",
    imageUrl: "/mock-products/elec-005.svg",
    content: {
      shortDescription: "Professional 4K webcam for streaming.",
      longDescription:
        "Upgrade your video calls with 4K resolution, auto-focus, and built-in ring light. Compatible with all major video conferencing platforms.",
    },
    seoContent: {
      metaTitle: "4K Webcam Ultra | Electronics",
      metaDescription: "Buy 4K Webcam Ultra online.",
    },
  },
  {
    name: "Mechanical Keyboard RGB",
    sku: "ELEC-006",
    category: "electronics",
    imageUrl: "/mock-products/elec-006.svg",
    content: {
      shortDescription: "Mechanical keyboard with RGB backlighting.",
      longDescription:
        "Premium mechanical keyboard with Cherry MX switches, per-key RGB lighting, and aluminum frame. N-key rollover and macro support for gaming and productivity.",
    },
    seoContent: {
      metaTitle: "Mechanical Keyboard RGB | Electronics",
      metaDescription: "Shop Mechanical Keyboard RGB.",
    },
  },
  {
    name: "Trail Running Shoes",
    sku: "SPRT-001",
    category: "sports",
    imageUrl: "/mock-products/sprt-001.svg",
    content: {
      shortDescription: "Lightweight trail running shoes.",
      longDescription:
        "Designed for off-road adventures. Features aggressive tread pattern, rock plate protection, and breathable mesh upper. Suitable for all trail conditions.",
    },
    seoContent: {
      metaTitle: "Trail Running Shoes | Sports",
      metaDescription: "Buy trail running shoes online.",
    },
  },
  {
    name: "Yoga Mat Premium",
    sku: "SPRT-002",
    category: "sports",
    imageUrl: "/mock-products/sprt-002.svg",
    content: {
      shortDescription: "Non-slip premium yoga mat.",
      longDescription:
        "6mm thick yoga mat with non-slip surface and alignment markings. Made from eco-friendly TPE material. Includes carrying strap.",
    },
    seoContent: {
      metaTitle: "Yoga Mat Premium | Sports",
      metaDescription: "Shop premium yoga mats.",
    },
  },
  {
    name: "Resistance Band Set",
    sku: "SPRT-003",
    category: "sports",
    imageUrl: "/mock-products/sprt-003.svg",
    content: {
      shortDescription: "5-piece resistance band set.",
      longDescription:
        "Complete home workout set with 5 resistance levels. Includes door anchor, handles, and ankle straps. Latex-free and durable.",
    },
    seoContent: {
      metaTitle: "Resistance Band Set | Sports",
      metaDescription: "Buy resistance band sets online.",
    },
  },
  {
    name: "Insulated Water Bottle",
    sku: "SPRT-004",
    category: "sports",
    imageUrl: "/mock-products/sprt-004.svg",
    content: {
      shortDescription: "Double-wall insulated water bottle.",
      longDescription:
        "Keeps drinks cold for 24 hours or hot for 12 hours. 32oz capacity, BPA-free stainless steel. Leak-proof lid with carrying loop.",
    },
    seoContent: {
      metaTitle: "Insulated Water Bottle | Sports",
      metaDescription: "Shop insulated water bottles.",
    },
  },
  {
    name: "Organic Cotton T-Shirt",
    sku: "APRL-001",
    category: "apparel",
    imageUrl: "/mock-products/aprl-001.svg",
    content: {
      shortDescription: "Soft organic cotton basic tee.",
      longDescription:
        "Classic fit t-shirt made from 100% GOTS-certified organic cotton. Pre-shrunk, breathable, and available in 12 colors.",
    },
    seoContent: {
      metaTitle: "Organic Cotton T-Shirt | Apparel",
      metaDescription: "Buy organic cotton t-shirts.",
    },
  },
  {
    name: "Denim Jacket Classic",
    sku: "APRL-002",
    category: "apparel",
    imageUrl: "/mock-products/aprl-002.svg",
    content: {
      shortDescription: "Classic denim jacket for all seasons.",
      longDescription:
        "Timeless denim jacket with button front, chest pockets, and adjustable waist tabs. Medium wash with light distressing.",
    },
    seoContent: {
      metaTitle: "Denim Jacket Classic | Apparel",
      metaDescription: "Shop classic denim jackets.",
    },
  },
  {
    name: "Merino Wool Socks",
    sku: "APRL-003",
    category: "apparel",
    imageUrl: "/mock-products/aprl-003.svg",
    content: {
      shortDescription: "Temperature-regulating merino wool socks.",
      longDescription:
        "Naturally antimicrobial merino wool socks with cushioned sole and reinforced heel. Keeps feet warm in winter and cool in summer.",
    },
    seoContent: {
      metaTitle: "Merino Wool Socks | Apparel",
      metaDescription: "Buy merino wool socks online.",
    },
  },
  {
    name: "Stainless Steel Cookware Set",
    sku: "HOME-001",
    category: "home",
    imageUrl: "/mock-products/home-001.svg",
    content: {
      shortDescription: "10-piece stainless steel cookware set.",
      longDescription:
        "Professional-grade tri-ply stainless steel cookware. Includes 2 fry pans, 2 sauce pans, stock pot, and lids. Oven safe to 500°F, dishwasher safe.",
    },
    seoContent: {
      metaTitle: "Stainless Steel Cookware Set | Home",
      metaDescription: "Shop stainless steel cookware sets.",
    },
  },
  {
    name: "Aromatherapy Diffuser",
    sku: "HOME-002",
    category: "home",
    imageUrl: "/mock-products/home-002.svg",
    content: {
      shortDescription: "Ultrasonic aromatherapy essential oil diffuser.",
      longDescription:
        "Whisper-quiet ultrasonic diffuser with 300ml capacity and 7 LED color options. Auto shut-off timer with 4 mist settings.",
    },
    seoContent: {
      metaTitle: "Aromatherapy Diffuser | Home",
      metaDescription: "Buy aromatherapy diffusers online.",
    },
  },
  {
    name: "Bamboo Cutting Board Set",
    sku: "HOME-003",
    category: "home",
    imageUrl: "/mock-products/home-003.svg",
    content: {
      shortDescription: "Eco-friendly bamboo cutting board set.",
      longDescription:
        "Set of 3 bamboo cutting boards in small, medium, and large sizes. Naturally antimicrobial, knife-friendly, and easy to clean.",
    },
    seoContent: {
      metaTitle: "Bamboo Cutting Board Set | Home",
      metaDescription: "Shop bamboo cutting board sets.",
    },
  },
];

export function getProducts(categoryId?: string): Product[] {
  if (categoryId) {
    return products.filter(
      (p) => p.category.toLowerCase() === categoryId.toLowerCase()
    );
  }
  return [...products];
}

export function getProductBySku(sku: string): Product | undefined {
  return products.find((p) => p.sku === sku);
}

export async function fetchProduct(sku: string): Promise<Product | undefined> {
  await new Promise((resolve) => setTimeout(resolve, 200)); // Simulate network delay
  return getProductBySku(sku);
}

export async function fetchProductSegmentPrice(sku: string, userSegment?: string): Promise<number> {
  const basePrice = 49.99; // Base price for all products

  // Simulate different pricing for user segments
  switch (userSegment) {
    case "premium":
      return basePrice * 1.2; // 20% increase for premium users
    case "student":
      return basePrice * 0.8; // 20% discount for students
    default:
      return basePrice;
  }
}
