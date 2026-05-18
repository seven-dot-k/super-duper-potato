export interface FaqItem {
  question: string;
  answer: string;
}

export interface ManualSection {
  title: string;
  content: string;
}

export interface ProductDetail {
  sku: string;
  faqs: FaqItem[];
  manual: ManualSection[];
  specifications: Record<string, string>;
}

const productDetails: ProductDetail[] = [
  {
    sku: "ELEC-001",
    faqs: [
      {
        question: "How long does the battery last?",
        answer: "The Wireless Headphones Pro offer up to 30 hours of playback with ANC on, and up to 40 hours with ANC off.",
      },
      {
        question: "Are they compatible with multiple devices?",
        answer: "Yes, they support Bluetooth 5.3 multipoint and can connect to two devices simultaneously.",
      },
      {
        question: "Can I use them for phone calls?",
        answer: "Absolutely. Built-in beamforming microphones provide clear voice pickup with wind noise reduction.",
      },
      {
        question: "Are replacement ear cushions available?",
        answer: "Yes, memory foam ear cushion replacements are available in our accessories section.",
      },
    ],
    manual: [
      {
        title: "Getting Started",
        content: "Charge your headphones fully before first use (approximately 2 hours via USB-C). Press and hold the power button for 3 seconds to turn on. Open Bluetooth settings on your device and select 'WHP-Pro' to pair.",
      },
      {
        title: "Active Noise Cancellation",
        content: "Toggle ANC modes by pressing the ANC button on the left ear cup. Three modes are available: Full ANC, Transparency, and Off. In Transparency mode, ambient sounds are passed through so you can hear your surroundings.",
      },
      {
        title: "Controls",
        content: "Use the touch panel on the right ear cup: swipe up/down for volume, swipe forward/back to skip tracks, and double-tap to play/pause. Triple-tap to activate your voice assistant.",
      },
      {
        title: "Care & Maintenance",
        content: "Wipe the ear cushions with a soft, dry cloth after use. Store in the included hard case when not in use. Avoid exposure to extreme heat or moisture.",
      },
    ],
    specifications: {
      "Driver Size": "40mm",
      "Frequency Response": "20Hz - 40kHz",
      "Impedance": "32 Ohm",
      "Bluetooth Version": "5.3",
      "Battery Life": "30 hours (ANC on)",
      "Charging Time": "2 hours",
      "Weight": "250g",
      "Connector": "USB-C",
    },
  },
  {
    sku: "ELEC-002",
    faqs: [
      {
        question: "Does it support 4K 60Hz output?",
        answer: "Yes, the HDMI port supports 4K@60Hz output when connected to a compatible display.",
      },
      {
        question: "Can I charge my laptop through the hub?",
        answer: "Yes, it supports 100W USB-C Power Delivery passthrough charging.",
      },
      {
        question: "Is it compatible with iPad and tablets?",
        answer: "It works with any device that has a USB-C port, including iPads, tablets, and smartphones.",
      },
      {
        question: "Do I need to install drivers?",
        answer: "No drivers needed. It is plug-and-play on macOS, Windows, Linux, Chrome OS, and iPadOS.",
      },
    ],
    manual: [
      {
        title: "Getting Started",
        content: "Connect the USB-C cable to your laptop or tablet. All ports are immediately available — no drivers or software required.",
      },
      {
        title: "Port Layout",
        content: "Left side: 1x HDMI 2.0, 1x USB-C PD (100W). Right side: 2x USB-A 3.0, 1x SD card reader, 1x microSD card reader, 1x USB-C data port.",
      },
      {
        title: "Display Output",
        content: "Connect an HDMI cable from the hub to your monitor. Supports resolutions up to 4K@60Hz. For dual-display setups, use the HDMI port plus USB-C DisplayPort Alt Mode.",
      },
      {
        title: "Troubleshooting",
        content: "If a connected device is not recognized, disconnect and reconnect the hub. Ensure your host device supports USB-C data transfer (not charge-only ports). For display issues, try a different HDMI cable.",
      },
    ],
    specifications: {
      "Ports": "7 (HDMI, 2x USB-A, 2x USB-C, SD, microSD)",
      "HDMI Resolution": "4K@60Hz",
      "USB-A Speed": "USB 3.0 (5Gbps)",
      "PD Charging": "100W passthrough",
      "SD Card Speed": "UHS-I (104MB/s)",
      "Cable Length": "15cm",
      "Weight": "65g",
      "Material": "Aluminum alloy",
    },
  },
  {
    sku: "ELEC-003",
    faqs: [
      {
        question: "Is the watch waterproof?",
        answer: "It has a 5ATM water resistance rating (50 meters), suitable for swimming and showering but not diving.",
      },
      {
        question: "What phone do I need?",
        answer: "Compatible with iPhone (iOS 16+) and Android (10+). Download the Series X companion app to set up.",
      },
      {
        question: "Can I reply to messages from the watch?",
        answer: "Yes, you can reply with preset responses, voice dictation, or a tiny on-screen keyboard.",
      },
      {
        question: "How accurate is the heart rate sensor?",
        answer: "The optical sensor provides clinical-grade accuracy (±2 BPM) validated against medical ECG devices.",
      },
    ],
    manual: [
      {
        title: "Getting Started",
        content: "Charge the watch to at least 50% using the magnetic charging puck. Press and hold the side button for 3 seconds to power on. Follow the on-screen instructions to pair with your phone via the companion app.",
      },
      {
        title: "Health Monitoring",
        content: "Heart rate is monitored continuously. For SpO2 readings, open the Blood Oxygen app and rest your wrist on a flat surface for 15 seconds. Sleep tracking activates automatically when you wear the watch to bed.",
      },
      {
        title: "GPS & Workouts",
        content: "Start a workout from the Exercise app. Built-in GPS tracks outdoor runs, cycling, and hikes without needing your phone. Data syncs to the companion app after the workout ends.",
      },
      {
        title: "Battery Tips",
        content: "Typical use yields 5 days of battery. To extend battery life: reduce screen brightness, disable always-on display, and limit background heart rate checks to every 10 minutes instead of continuous.",
      },
    ],
    specifications: {
      "Display": "1.4\" AMOLED, 454x454",
      "Processor": "Dual-core 1.8GHz",
      "Storage": "32GB",
      "Sensors": "Heart rate, SpO2, accelerometer, gyroscope, barometer, compass",
      "GPS": "Dual-band (L1 + L5)",
      "Water Resistance": "5ATM (50m)",
      "Battery Life": "5 days typical",
      "Weight": "42g (without band)",
    },
  },
];

export function getProductDetail(sku: string): ProductDetail | undefined {
  return productDetails.find((d) => d.sku === sku);
}

export async function fetchProductDetail(sku: string): Promise<ProductDetail | undefined> {
  await new Promise((resolve) => setTimeout(resolve, 150));
  return getProductDetail(sku);
}
