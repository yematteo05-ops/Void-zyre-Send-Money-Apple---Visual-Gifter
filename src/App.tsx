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
import { KeyLockModal } from './components/KeyLockModal';
import { AdminVoidPanel } from './components/AdminVoidPanel';
import { DevSwitcherWindow } from './components/DevSwitcherWindow';
import { initDomController, updateBagBadge } from './utils/domController';

export default function App() {
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname + window.location.search);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem('site_key_validated'));
    } catch {
      return false;
    }
  });

  const [adminRevocationNotice, setAdminRevocationNotice] = useState<string | null>(null);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname + window.location.search);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Check if admin panel is requested
  const isAdminRoute = currentPath.includes('/adminvoid') || window.location.pathname.includes('/adminvoid');
  const isAccessRoute = currentPath.includes('/access') || window.location.pathname.includes('/access') || !isUnlocked;

  // Hide Apple Store DOM (#page) completely when locked or on admin/access routes
  useEffect(() => {
    const pageEl = document.getElementById('page');
    const portalEl = document.getElementById('portal');
    const isLockedOrAdmin = !isUnlocked || isAccessRoute || isAdminRoute;

    if (pageEl) {
      if (isLockedOrAdmin) {
        pageEl.style.display = 'none';
        pageEl.style.visibility = 'hidden';
        pageEl.setAttribute('aria-hidden', 'true');
      } else {
        pageEl.style.display = 'block';
        pageEl.style.visibility = 'visible';
        pageEl.removeAttribute('aria-hidden');
      }
    }

    if (portalEl) {
      if (isLockedOrAdmin) {
        portalEl.style.display = 'none';
      } else {
        portalEl.style.display = '';
      }
    }

    if (isLockedOrAdmin) {
      window.scrollTo(0, 0);
      document.body.classList.add('is-locked');
      document.documentElement.classList.add('is-locked');
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('is-locked');
      document.documentElement.classList.remove('is-locked');
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
  }, [isUnlocked, isAccessRoute, isAdminRoute]);

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
    if (isUnlocked && !isAdminRoute) {
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
    }
  }, [isUnlocked, isAdminRoute, cartItems]);

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

  // Dev Switcher Handlers
  const handleSwitchToLockscreen = () => {
    try {
      localStorage.removeItem('site_key_validated');
      localStorage.removeItem('site_key_lifetime');
      localStorage.removeItem('site_key_expires_at');
    } catch {}
    setIsUnlocked(false);
    window.history.pushState({}, '', '/access');
    setCurrentPath('/access');
  };

  const handleSwitchToAppleStore = () => {
    try {
      localStorage.setItem('site_key_validated', 'VOID-DEMO-2026');
      localStorage.setItem('site_key_lifetime', 'true');
    } catch {}
    setIsUnlocked(true);
    window.history.pushState({}, '', '/');
    setCurrentPath('/');
  };

  const handleSwitchToAdmin = () => {
    window.history.pushState({}, '', '/adminvoid');
    setCurrentPath('/adminvoid');
  };

  return (
    <div id="interactive-app-wrapper">
      {/* Dev Switcher Bar */}
      <DevSwitcherWindow
        key="global-dev-switcher"
        currentRoute={currentPath}
        isUnlocked={isUnlocked}
        onSwitchToLockscreen={handleSwitchToLockscreen}
        onSwitchToAppleStore={handleSwitchToAppleStore}
        onSwitchToAdmin={handleSwitchToAdmin}
      />

      {isAdminRoute ? (
        <AdminVoidPanel
          key="admin-void-panel-view"
          onExit={() => {
            window.history.pushState({}, '', '/');
            setCurrentPath('/');
          }}
        />
      ) : (!isUnlocked || isAccessRoute) ? (
        <KeyLockModal
          key="key-lock-modal-view"
          isLocked={true}
          onUnlock={() => {
            setIsUnlocked(true);
            window.history.pushState({}, '', '/');
            setCurrentPath('/');
          }}
          adminRevocationNotice={adminRevocationNotice}
          onDismissRevocationNotice={() => setAdminRevocationNotice(null)}
        />
      ) : (
        <div key="store-modals-group" id="store-modals-group">
          {/* Gift Modal */}
          <GiftModal
            product={activeGiftProduct}
            onClose={() => setActiveGiftProduct(null)}
            userSettings={userSettings}
            onSaveSettings={handleSaveSettings}
          />

          {/* Account, Balance & Profile Settings Modal */}
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
        </div>
      )}
    </div>
  );
}
