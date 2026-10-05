import { ProductModel } from '../types';

export const IPHONE_PRODUCTS: ProductModel[] = [
  {
    id: 'iphone-duo',
    name: 'iPhone Duo',
    tagline: 'Dual displays. Limitless horizon.',
    basePrice: 1999,
    monthlyPrice: 83.29,
    badge: 'Pre-order 10.16',
    description: 'The revolutionary foldable iPhone with dual expansive Ultra Retina displays, dual hinge titanium engineering, and next-gen silicon.',
    sizes: [
      { name: 'iPhone Duo', screen: '7.8-inch inner / 6.4-inch outer display', priceOffset: 0 }
    ],
    finishes: [
      {
        name: 'Star White',
        colorHex: '#e5e7eb',
        image: '/images/iphone-card-40-duo-starwhite-transparent.png',
        swatchImg: '/images/iphone-duo-starwhite_SW_COLOR.png'
      },
      {
        name: 'Space Black',
        colorHex: '#1f2937',
        image: '/images/iphone-card-40-duo-spaceblack-transparent.png',
        swatchImg: '/images/iphone-duo-spaceblack_SW_COLOR.png'
      }
    ],
    storages: [
      { size: '256GB', price: 1999, monthly: 83.29 },
      { size: '512GB', price: 2199, monthly: 91.62 },
      { size: '1TB', price: 2399, monthly: 99.95 }
    ],
    specs: {
      display: '7.8" Foldable Ultra Retina XDR inner display + 6.4" external display',
      chip: 'A20 Pro Dual Max with unified memory architecture',
      camera: 'Quad 48MP Pro computational camera system with periscope zoom',
      intelligence: 'Dual-screen simultaneous Apple Intelligence & multitasking',
      battery: 'Up to 34 hours video playback',
      materials: 'Liquidmetal titanium alloy hinge with armor ceramic glass'
    }
  },
  {
    id: 'iphone-18-pro',
    name: 'iPhone 18 Pro',
    tagline: 'The ultimate iPhone.',
    basePrice: 1099,
    monthlyPrice: 45.79,
    badge: 'New',
    description: 'Forged in titanium with industry-leading A20 Pro chip, innovative Camera Control, and advanced Apple Intelligence.',
    sizes: [
      { name: 'iPhone 18 Pro', screen: '6.3-inch display', priceOffset: 0 },
      { name: 'iPhone 18 Pro Max', screen: '6.9-inch display', priceOffset: 100 }
    ],
    finishes: [
      {
        name: 'Burgundy',
        colorHex: '#4b2a33',
        image: '/images/iphone-card-40-18pro-burgundy-transparent.png',
        swatchImg: '/images/iphone-18-pro-finish-select-burgundy-202609_SW_COLOR.png'
      },
      {
        name: 'Glacier',
        colorHex: '#c7d3db',
        image: '/images/iphone-card-40-18pro-glacier-transparent.png',
        swatchImg: '/images/iphone-18-pro-finish-select-glacier-202609_SW_COLOR.png'
      },
      {
        name: 'Silver',
        colorHex: '#e2e4e1',
        image: '/images/iphone-card-40-18pro-silver-transparent.png',
        swatchImg: '/images/iphone-18-pro-finish-select-silver-202609_SW_COLOR.png'
      },
      {
        name: 'Black',
        colorHex: '#2d2e30',
        image: '/images/iphone-card-40-18pro-black-transparent.png',
        swatchImg: '/images/iphone-18-pro-finish-select-black-202609_SW_COLOR.png'
      }
    ],
    storages: [
      { size: '128GB', price: 1099, monthly: 45.79 },
      { size: '256GB', price: 1199, monthly: 49.95 },
      { size: '512GB', price: 1399, monthly: 58.29 },
      { size: '1TB', price: 1599, monthly: 66.62 }
    ],
    specs: {
      display: '6.3" or 6.9" Super Retina XDR with ProMotion (120Hz) & Always-On',
      chip: 'A20 Pro chip with 6-core GPU and dedicated Neural Accelerators',
      camera: 'Pro camera system: 48MP Fusion, 48MP Ultra Wide, 48MP 5x Telephoto',
      intelligence: 'Built for Apple Intelligence with generative Siri & Private Cloud Compute',
      battery: 'Up to 33 hours video playback',
      materials: 'Titanium design with Ceramic Shield front and textured matte glass back'
    }
  },
  {
    id: 'iphone-air',
    name: 'iPhone Air',
    tagline: 'Impossibly thin. Incredibly powerful.',
    basePrice: 899,
    monthlyPrice: 37.45,
    badge: 'New',
    description: 'An astonishing ultrathin design packed with pro-level capability, stunning lightweight ergonomics, and full Apple Intelligence.',
    sizes: [
      { name: 'iPhone Air', screen: '6.5-inch display', priceOffset: 0 }
    ],
    finishes: [
      {
        name: 'Sky Blue',
        colorHex: '#9bb7d4',
        image: '/images/iphone-card-40-17air-skyblue-transparent.png',
        swatchImg: '/images/iphone-air-finish-select-skyblue-202509_SW_COLOR.png'
      },
      {
        name: 'Cloud White',
        colorHex: '#f2f3f5',
        image: '/images/iphone-card-40-17air-cloudwhite-transparent.png',
        swatchImg: '/images/iphone-air-finish-select-cloudwhite-202509_SW_COLOR.png'
      },
      {
        name: 'Space Black',
        colorHex: '#252628',
        image: '/images/iphone-card-40-17air-spaceblack-transparent.png',
        swatchImg: '/images/iphone-air-finish-select-spaceblack-202509_SW_COLOR.png'
      },
      {
        name: 'Light Gold',
        colorHex: '#dfd2bc',
        image: '/images/iphone-card-40-17air-lightgold-transparent.png',
        swatchImg: '/images/iphone-air-finish-select-lightgold-202509_SW_COLOR.png'
      }
    ],
    storages: [
      { size: '128GB', price: 899, monthly: 37.45 },
      { size: '256GB', price: 999, monthly: 41.62 },
      { size: '512GB', price: 1199, monthly: 49.95 }
    ],
    specs: {
      display: '6.5" Super Retina XDR OLED with 120Hz ProMotion',
      chip: 'A19 Pro chip with breakthrough power efficiency',
      camera: 'Dual 48MP Fusion & Ultra Wide camera system with spatial capture',
      intelligence: 'Full Apple Intelligence support with fast on-device inference',
      battery: 'Up to 27 hours video playback',
      materials: 'Featherlight aerospace titanium frame and ultra-thin profile'
    }
  },
  {
    id: 'iphone-17',
    name: 'iPhone 17',
    tagline: 'Total powerhouse.',
    basePrice: 799,
    monthlyPrice: 33.29,
    badge: 'Popular',
    description: 'Vibrant colorways, 48MP dual-camera system, Camera Control button, and built-in Apple Intelligence.',
    sizes: [
      { name: 'iPhone 17', screen: '6.1-inch display', priceOffset: 0 },
      { name: 'iPhone 17 Plus', screen: '6.7-inch display', priceOffset: 100 }
    ],
    finishes: [
      {
        name: 'Lavender',
        colorHex: '#c2b3d6',
        image: '/images/iphone-card-40-17-lavender-transparent.png',
        swatchImg: '/images/iphone-17-finish-select-lavender-202509_SW_COLOR.png'
      },
      {
        name: 'Mist Blue',
        colorHex: '#9cb5c9',
        image: '/images/iphone-card-40-17-mistblue-transparent.png',
        swatchImg: '/images/iphone-17-finish-select-mistblue-202509_SW_COLOR.png'
      },
      {
        name: 'White',
        colorHex: '#f5f5f7',
        image: '/images/iphone-card-40-17-white-transparent.png',
        swatchImg: '/images/iphone-17-finish-select-white-202509_SW_COLOR.png'
      },
      {
        name: 'Sage',
        colorHex: '#a7b8a8',
        image: '/images/iphone-card-40-17-sage-transparent.png',
        swatchImg: '/images/iphone-17-finish-select-sage-202509_SW_COLOR.png'
      },
      {
        name: 'Black',
        colorHex: '#2a2b2d',
        image: '/images/iphone-card-40-17-black-transparent.png',
        swatchImg: '/images/iphone-17-finish-select-black-202509_SW_COLOR.png'
      }
    ],
    storages: [
      { size: '128GB', price: 799, monthly: 33.29 },
      { size: '256GB', price: 899, monthly: 37.45 },
      { size: '512GB', price: 1099, monthly: 45.79 }
    ],
    specs: {
      display: '6.1" or 6.7" Super Retina XDR OLED display',
      chip: 'A19 chip with 5-core GPU',
      camera: 'Advanced dual-camera system: 48MP Fusion & 12MP Ultra Wide with 2x optical quality telephoto',
      intelligence: 'Built for Apple Intelligence',
      battery: 'Up to 26 hours video playback',
      materials: 'Aerospace-grade aluminum enclosure with color-infused back glass'
    }
  },
  {
    id: 'iphone-17e',
    name: 'iPhone 17e',
    tagline: 'Incredible value. Full essentials.',
    basePrice: 599,
    monthlyPrice: 24.95,
    badge: 'Great Value',
    description: 'Compact, ultra-capable with fast A18 processor, Action button, USB-C, and all-day battery life.',
    sizes: [
      { name: 'iPhone 17e', screen: '6.1-inch display', priceOffset: 0 }
    ],
    finishes: [
      {
        name: 'Soft Pink',
        colorHex: '#f0c7cc',
        image: '/images/iphone-card-40-17e-softpink-transparent.png',
        swatchImg: '/images/iphone-17e-finish-select-softpink-202603_SW_COLOR.png'
      },
      {
        name: 'White',
        colorHex: '#f6f7f9',
        image: '/images/iphone-card-40-17e-white-transparent.png',
        swatchImg: '/images/iphone-17e-finish-select-white-202603_SW_COLOR.png'
      },
      {
        name: 'Black',
        colorHex: '#222325',
        image: '/images/iphone-card-40-17e-black-transparent.png',
        swatchImg: '/images/iphone-17e-finish-select-black-202603_SW_COLOR.png'
      }
    ],
    storages: [
      { size: '128GB', price: 599, monthly: 24.95 },
      { size: '256GB', price: 699, monthly: 29.12 }
    ],
    specs: {
      display: '6.1" Super Retina XDR display with HDR',
      chip: 'A18 chip with 16-core Neural Engine',
      camera: '48MP main camera with optical image stabilization & night mode',
      intelligence: 'Apple Intelligence support',
      battery: 'Up to 22 hours video playback',
      materials: 'Durable aluminum frame with ceramic shield protection'
    }
  },
  {
    id: 'iphone-16',
    name: 'iPhone 16',
    tagline: 'Hello, Apple Intelligence.',
    basePrice: 699,
    monthlyPrice: 29.12,
    description: 'Featuring Camera Control, 48MP Fusion camera, and A18 chip designed from the ground up for Apple Intelligence.',
    sizes: [
      { name: 'iPhone 16', screen: '6.1-inch display', priceOffset: 0 },
      { name: 'iPhone 16 Plus', screen: '6.7-inch display', priceOffset: 100 }
    ],
    finishes: [
      {
        name: 'Ultramarine',
        colorHex: '#3a5dae',
        image: '/images/iphone-card-40-16plus-202509-transparent.png',
        swatchImg: '/images/iphone-16-ultramarine-select-202409_SW_COLOR.png'
      },
      {
        name: 'Teal',
        colorHex: '#6da09d',
        image: '/images/iphone-card-40-16plus-202509-transparent.png',
        swatchImg: '/images/iphone-16-teal-select-202409_SW_COLOR.png'
      },
      {
        name: 'Pink',
        colorHex: '#d89ba7',
        image: '/images/iphone-card-40-16plus-202509-transparent.png',
        swatchImg: '/images/iphone-16-pink-select-202409_SW_COLOR.png'
      },
      {
        name: 'White',
        colorHex: '#f5f6f8',
        image: '/images/iphone-card-40-16plus-202509-transparent.png',
        swatchImg: '/images/iphone-16-white-select-202409_SW_COLOR.png'
      },
      {
        name: 'Black',
        colorHex: '#252628',
        image: '/images/iphone-card-40-16plus-202509-transparent.png',
        swatchImg: '/images/iphone-16-black-select-202409_SW_COLOR.png'
      }
    ],
    storages: [
      { size: '128GB', price: 699, monthly: 29.12 },
      { size: '256GB', price: 799, monthly: 33.29 },
      { size: '512GB', price: 999, monthly: 41.62 }
    ],
    specs: {
      display: '6.1" or 6.7" Super Retina XDR display',
      chip: 'A18 chip with 5-core GPU',
      camera: 'Advanced dual camera: 48MP Fusion & 12MP Ultra Wide with macro',
      intelligence: 'Apple Intelligence ready',
      battery: 'Up to 27 hours video playback',
      materials: 'Aluminum with color-infused glass back'
    }
  }
];

export const TRADE_IN_DEVICES = [
  { model: 'iPhone 15 Pro Max', credit: 650 },
  { model: 'iPhone 15 Pro', credit: 520 },
  { model: 'iPhone 15 Plus', credit: 420 },
  { model: 'iPhone 15', credit: 380 },
  { model: 'iPhone 14 Pro Max', credit: 450 },
  { model: 'iPhone 14 Pro', credit: 380 },
  { model: 'iPhone 14 Plus', credit: 300 },
  { model: 'iPhone 14', credit: 270 },
  { model: 'iPhone 13 Pro Max', credit: 330 },
  { model: 'iPhone 13 Pro', credit: 280 },
  { model: 'iPhone 13', credit: 220 },
  { model: 'iPhone 12 Pro Max', credit: 220 },
  { model: 'iPhone 12', credit: 160 },
  { model: 'iPhone 11', credit: 120 }
];
