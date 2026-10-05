import React, { useState, useEffect } from 'react';
import { IPHONE_PRODUCTS } from './data/products';
import { ProductModel, CartItem } from './types';
import { GiftModal } from './components/GiftModal';
import { BuyModal } from './components/BuyModal';
import { BagDrawer } from './components/BagDrawer';
import { SpecialistChat } from './components/SpecialistChat';
import { TradeInModal } from './components/TradeInModal';
import { CompareModal } from './components/CompareModal';
import { OrderLookupModal } from './components/OrderLookupModal';
import { SettingsModal, UserSettings, DEFAULT_USER_SETTINGS } from './components/SettingsModal';
import { initDomController, updateBagBadge } from './utils/domController';

export default function App() {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('apple_store_bag');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [userSettings, setUserSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem('apple_store_user_settings');
      return saved ? JSON.parse(saved) : DEFAULT_USER_SETTINGS;
    } catch {
      return DEFAULT_USER_SETTINGS;
    }
  });

  const [activeGiftProduct, setActiveGiftProduct] = useState<ProductModel | null>(null);
  const [activeBuyProduct, setActiveBuyProduct] = useState<ProductModel | null>(null);
  const [isBagOpen, setIsBagOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isTradeInOpen, setIsTradeInOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isOrderLookupOpen, setIsOrderLookupOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [lookupOrderNumber, setLookupOrderNumber] = useState('');

  // Persist user settings to localStorage
  const handleSaveSettings = (newSettings: UserSettings) => {
    setUserSettings(newSettings);
    try {
      localStorage.setItem('apple_store_user_settings', JSON.stringify(newSettings));
    } catch {}
  };

  useEffect(() => {
    try {
      localStorage.setItem('apple_store_bag', JSON.stringify(cartItems));
    } catch {}
    const totalCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);
    updateBagBadge(totalCount);
  }, [cartItems]);

  useEffect(() => {
    const totalCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);
    initDomController({
      onOpenGiftModal: (modelId: string) => {
        const prod = IPHONE_PRODUCTS.find((p) => p.id === modelId) || IPHONE_PRODUCTS[0];
        setActiveGiftProduct(prod);
      },
      onOpenBuyModal: (modelId: string) => {
        const prod = IPHONE_PRODUCTS.find((p) => p.id === modelId) || IPHONE_PRODUCTS[0];
        setActiveGiftProduct(prod);
      },
      onOpenChat: () => setIsChatOpen(true),
      onOpenBag: () => setIsBagOpen(true),
      onOpenCompare: () => setIsCompareOpen(true),
      onOpenTradeIn: () => setIsTradeInOpen(true),
      onOpenSettings: () => setIsSettingsOpen(true),
      bagCount: totalCount
    });
  }, []);

  const handleAddToCart = (item: CartItem) => {
    setCartItems((prev) => {
      const existing = prev.find(
        (i) =>
          i.modelName === item.modelName &&
          i.finish === item.finish &&
          i.storage === item.storage
      );
      if (existing) {
        return prev.map((i) =>
          i.id === existing.id ? { ...i, quantity: i.quantity + item.quantity } : i
        );
      }
      return [...prev, item];
    });
    setIsBagOpen(true);
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const handleRemoveItem = (id: string) => {
    setCartItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <>
      {/* Gift Modal (Primary Experience with Zyre, Void Hub Discord, Real vector Apple Logo) */}
      <GiftModal
        product={activeGiftProduct}
        onClose={() => setActiveGiftProduct(null)}
        userSettings={userSettings}
        onSaveSettings={handleSaveSettings}
      />

      {/* Account, Balance & Profile Settings Modal (Triggered by Search button in nav) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={userSettings}
        onSaveSettings={handleSaveSettings}
      />

      {/* Standard Buy Modal */}
      <BuyModal
        product={activeBuyProduct}
        onClose={() => setActiveBuyProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Apple Bag Drawer */}
      <BagDrawer
        isOpen={isBagOpen}
        onClose={() => setIsBagOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={() => setCartItems([])}
      />

      {/* Apple Specialist Chat */}
      <SpecialistChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onOpenBuyModal={(modelId) => {
          const prod = IPHONE_PRODUCTS.find((p) => p.id === modelId) || IPHONE_PRODUCTS[0];
          setActiveGiftProduct(prod);
        }}
      />

      {/* Trade-in Estimator */}
      <TradeInModal
        isOpen={isTradeInOpen}
        onClose={() => setIsTradeInOpen(false)}
      />

      {/* Compare Models */}
      <CompareModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        onSelectBuy={(modelId: string) => {
          setIsCompareOpen(false);
          const prod = IPHONE_PRODUCTS.find((p) => p.id === modelId) || IPHONE_PRODUCTS[0];
          setActiveGiftProduct(prod);
        }}
      />

      {/* Order Lookup Modal */}
      <OrderLookupModal
        isOpen={isOrderLookupOpen}
        onClose={() => setIsOrderLookupOpen(false)}
        defaultOrderNumber={lookupOrderNumber}
      />
    </>
  );
}
