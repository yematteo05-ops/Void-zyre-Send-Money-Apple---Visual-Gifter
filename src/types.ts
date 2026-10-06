export interface ProductFinish {
  name: string;
  colorHex: string;
  image: string;
  swatchImg?: string;
}

export interface StorageOption {
  size: string;
  price: number;
  monthly: number;
}

export interface ProductModel {
  id: string;
  name: string;
  tagline: string;
  basePrice: number;
  monthlyPrice: number;
  badge?: string;
  description: string;
  finishes: ProductFinish[];
  storages: StorageOption[];
  sizes?: { name: string; screen: string; priceOffset: number }[];
  specs: {
    display: string;
    chip: string;
    camera: string;
    intelligence: string;
    battery: string;
    materials: string;
  };
}

export interface CartItem {
  id: string;
  modelId: string;
  modelName: string;
  sizeName?: string;
  finish: string;
  finishColorHex: string;
  storage: string;
  carrier: string;
  tradeInCredit: number;
  appleCare: boolean;
  price: number;
  monthlyPrice: number;
  image: string;
  quantity: number;
}

export interface ChatMessage {
  id: string;
  sender: 'specialist' | 'user';
  text: string;
  timestamp: string;
  suggestions?: string[];
}

export interface AccessKey {
  id: string;
  key: string;
  duration?: string;
  duration_hours?: number;
  status: 'unactivated' | 'active' | 'expired' | 'revoked';
  tag?: string;
  note?: string;
  max_hwid?: any;
  max_devices?: number;
  devices?: any[];
  timer_mode?: 'continuous' | 'active_usage';
  remaining_seconds?: number;
  activated_at?: string;
  last_used_at?: string;
  used_count?: number;
  discord_username?: string;
  discord_user?: string;
  created_at?: string;
  is_lifetime?: boolean;
}
