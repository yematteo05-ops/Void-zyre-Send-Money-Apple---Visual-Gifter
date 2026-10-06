import React, { useState, useEffect } from 'react';
import { ProductModel, ProductFinish, StorageOption } from '../types';
import {
  Check,
  ChevronRight,
  ShieldCheck,
  Printer,
  Sparkles,
  Mail,
  Heart,
  RotateCcw,
  ArrowRight,
  Calendar,
  Layers,
  CreditCard,
  Users,
  Video,
  Smartphone,
  Tag,
  Gift,
  Eye,
  Sliders,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { GmailSimulatorModal } from './GmailSimulatorModal';
import { UserSettings, DEFAULT_USER_SETTINGS } from './SettingsModal';
import { AppleLogo, ApplePayBadge, AppleCareBadge } from './AppleLogo';

interface GiftModalProps {
  product: ProductModel | null;
  onClose: () => void;
  userSettings?: UserSettings;
  onSaveSettings?: (settings: UserSettings) => void;
}

export function GiftModal({
  product,
  onClose,
  userSettings = DEFAULT_USER_SETTINGS,
  onSaveSettings
}: GiftModalProps) {
  if (!product) return null;

  // Step state: 1 = recipient & occasion, 2 = finish & specs & add-ons, 3 = payment, 4 = official receipt
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Recipient Type (Gmail vs Apple User) & details
  const [recipientType, setRecipientType] = useState<'gmail' | 'apple'>('gmail');
  const [recipientEmail, setRecipientEmail] = useState(userSettings.defaultRecipientEmail || '');
  const [senderName, setSenderName] = useState(userSettings.userName || 'Zyre');
  const [giftMessage, setGiftMessage] = useState(userSettings.defaultGiftMessage || 'By Void Hub https://discord.gg/brhBspMGAj');
  const [ribbonColor, setRibbonColor] = useState('Signature Red');
  const [emailError, setEmailError] = useState('');

  // Feature: Scheduled Delivery
  const [deliveryOption, setDeliveryOption] = useState<'fastest' | 'scheduled'>('fastest');
  const [scheduledDate, setScheduledDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });

  // Feature: Group Gifting (Split the bill)
  const [isGroupGift, setIsGroupGift] = useState(false);

  // Step 2: Color and specs
  const [selectedFinish, setSelectedFinish] = useState<ProductFinish>(product.finishes[0]);
  const [selectedStorage, setSelectedStorage] = useState<StorageOption>(product.storages[0]);
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || { name: product.name, screen: '', priceOffset: 0 });

  // Feature: Multi-Angle Inspector (Front, Back, Profile)
  const [viewAngle, setViewAngle] = useState<'front' | 'back' | 'profile'>('front');

  // Feature: Custom Laser Engraving
  const [hasEngraving, setHasEngraving] = useState(false);
  const [engravingText, setEngravingText] = useState('');

  // Feature: Carrier & eSIM
  const [selectedCarrier, setSelectedCarrier] = useState<'unlocked' | 'att' | 'verizon' | 'tmobile'>('unlocked');

  // Feature: AppleCare+
  const [includeAppleCare, setIncludeAppleCare] = useState(false);

  // Feature: Trade-in Discount
  const [tradeInCredit, setTradeInCredit] = useState(0);
  const [tradeInModel, setTradeInModel] = useState('none');

  // Feature: MagSafe Accessories
  const [includeCase, setIncludeCase] = useState(false);
  const [includeWallet, setIncludeWallet] = useState(false);

  // Step 3: Payment
  const [paymentGateway, setPaymentGateway] = useState<'applepay' | 'paypal'>('applepay');
  const [paypalMethod, setPaypalMethod] = useState<'balance' | 'card' | 'payin4'>('balance');
  const [paypalFlowState, setPaypalFlowState] = useState<'idle' | 'loading' | 'verification' | 'authorizing'>('idle');
  const [paypalVerificationCode, setPaypalVerificationCode] = useState('');
  const [paypalVerificationError, setPaypalVerificationError] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentProgressText, setPaymentProgressText] = useState('');

  // Step 4: Receipt details & Modals
  const [orderNumber, setOrderNumber] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [isGmailPreviewOpen, setIsGmailPreviewOpen] = useState(false);

  // Update defaults if user settings change
  useEffect(() => {
    setSenderName(userSettings.userName || 'Zyre');
    setGiftMessage(userSettings.defaultGiftMessage || 'By Void Hub https://discord.gg/brhBspMGAj');
    if (userSettings.defaultRecipientEmail && !recipientEmail) {
      setRecipientEmail(userSettings.defaultRecipientEmail);
    }
  }, [userSettings]);

  // Reset when product changes
  useEffect(() => {
    setSelectedFinish(product.finishes[0]);
    setSelectedStorage(product.storages[0]);
    setSelectedSize(product.sizes?.[0] || { name: product.name, screen: '', priceOffset: 0 });
    setStep(1);
    setIsProcessingPayment(false);
    setPaypalFlowState('idle');
    setPaypalVerificationCode('');
    setPaypalVerificationError('');
    setEmailError('');
  }, [product]);

  // Calculate dynamic total price
  const baseDevicePrice = selectedStorage.price + (selectedSize.priceOffset || 0);
  const accessoriesTotal =
    (includeCase ? 49 : 0) +
    (includeWallet ? 59 : 0) +
    (includeAppleCare ? 199 : 0);
  const totalPrice = Math.max(0, baseDevicePrice + accessoriesTotal - tradeInCredit);

  // Validate Gmail or Apple User
  const handleValidateEmail = (): boolean => {
    const trimmed = recipientEmail.trim();
    if (!trimmed) {
      setEmailError(
        recipientType === 'gmail'
          ? 'Please enter the recipient’s Gmail address.'
          : 'Please enter the recipient’s Apple ID, iCloud email, or username.'
      );
      return false;
    }

    if (recipientType === 'gmail') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmed.toLowerCase())) {
        setEmailError('Please enter a valid email address.');
        return false;
      }
      if (!trimmed.toLowerCase().endsWith('@gmail.com') && !trimmed.toLowerCase().endsWith('@googlemail.com')) {
        setEmailError('Please enter a valid Gmail address (ending in @gmail.com).');
        return false;
      }
    } else {
      // Apple User: Apple ID email, @icloud.com, phone number, or Apple account handle
      if (trimmed.length < 3) {
        setEmailError('Please enter a valid Apple ID (at least 3 characters).');
        return false;
      }
    }

    setEmailError('');
    return true;
  };

  const handleProceedToSpecs = (e: React.FormEvent) => {
    e.preventDefault();
    if (handleValidateEmail()) {
      setStep(2);
    }
  };

  const handleExecutePayment = () => {
    if (isProcessingPayment) return;
    setIsProcessingPayment(true);

    if (paymentGateway === 'applepay') {
      setPaymentProgressText('Hold Near Reader or Double-Click Side Button...');
      setTimeout(() => {
        setPaymentProgressText('Face ID Confirmed. Processing Apple Pay payment...');
      }, 800);
    } else {
      setPaymentProgressText('Verifying one-time security code...');
      setTimeout(() => {
        setPaymentProgressText(`Authorizing PayPal payment of $${totalPrice.toLocaleString()}.00 USD...`);
      }, 700);
    }

    setTimeout(() => {
      setPaymentProgressText('Payment Authorized. Generating Official Apple Store Gift Receipt...');
    }, 1400);

    setTimeout(() => {
      const randomOrder = 'W' + Math.floor(100000000 + Math.random() * 900000000);
      const randomTx = paymentGateway === 'applepay'
        ? 'APL-' + Math.random().toString(36).substring(2, 9).toUpperCase()
        : 'PAYID-' + Math.random().toString(36).substring(2, 9).toUpperCase();
      const now = new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });

      // Deduct balance from PayPal or Apple Pay!
      if (paymentGateway === 'paypal') {
        const remainingPaypal = Math.max(0, userSettings.paypalBalance - totalPrice);
        onSaveSettings?.({
          ...userSettings,
          paypalBalance: remainingPaypal
        });
      } else if (paymentGateway === 'applepay') {
        const remainingApplePay = Math.max(0, userSettings.applePayBalance - totalPrice);
        onSaveSettings?.({
          ...userSettings,
          applePayBalance: remainingApplePay
        });
      }

      setOrderNumber(randomOrder);
      setTransactionId(randomTx);
      setOrderDate(now);
      setIsProcessingPayment(false);
      setPaypalFlowState('idle');
      setStep(4);
    }, 2000);
  };

  const handleStartPaypalCheckout = () => {
    setPaypalFlowState('loading');
    setPaypalVerificationCode('');
    setPaypalVerificationError('');
    setTimeout(() => {
      setPaypalFlowState('verification');
    }, 1500);
  };

  const handleConfirmPaypalPurchase = () => {
    if (isProcessingPayment) return;
    const cleanCode = paypalVerificationCode.trim().replace(/\D/g, '');
    if (!cleanCode) {
      setPaypalVerificationError('Please enter the 6-digit verification code sent to your Gmail.');
      return;
    }
    if (cleanCode.length < 6) {
      setPaypalVerificationError('Verification code must be 6 digits.');
      return;
    }
    setPaypalVerificationError('');
    setPaypalFlowState('authorizing');
    handleExecutePayment();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-500 apple-backdrop flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
        style={{ fontFamily: '"SF Pro Text", "SF Pro Icons", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
      >
        <div
          className="relative w-full max-w-3xl apple-sheet overflow-hidden my-auto text-[#1d1d1f]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Apple Store Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#d2d2d7]/60 bg-[#ffffff]">
            <div className="flex items-center gap-3">
              <AppleLogo size={18} />
              <div className="h-4 w-px bg-[#d2d2d7]" />
              <div className="text-[14px] font-semibold text-[#1d1d1f] tracking-tight">
                Apple Store Signature Gifting
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Apple Step Indicator */}
              <div className="hidden sm:flex items-center gap-2 text-[12px] font-medium text-[#6e6e73]">
                <span className={`px-2.5 py-0.5 rounded-full ${step === 1 ? 'bg-[#0071e3] text-white font-semibold' : 'text-[#6e6e73]'}`}>1. Recipient</span>
                <span>•</span>
                <span className={`px-2.5 py-0.5 rounded-full ${step === 2 ? 'bg-[#0071e3] text-white font-semibold' : 'text-[#6e6e73]'}`}>2. Customise</span>
                <span>•</span>
                <span className={`px-2.5 py-0.5 rounded-full ${step === 3 ? 'bg-[#0071e3] text-white font-semibold' : 'text-[#6e6e73]'}`}>3. Payment</span>
                <span>•</span>
                <span className={`px-2.5 py-0.5 rounded-full ${step === 4 ? 'bg-[#34c759] text-white font-semibold' : 'text-[#6e6e73]'}`}>4. Receipt</span>
              </div>

              {/* Apple Native Close Button */}
              <button
                onClick={onClose}
                className="apple-close-btn"
                aria-label="Close"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <line x1="1" y1="1" x2="11" y2="11" />
                  <line x1="11" y1="1" x2="1" y2="11" />
                </svg>
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 sm:p-9 max-h-[82vh] overflow-y-auto bg-white">
            {/* ================= STEP 1: RECIPIENT, OCCASION & PACKAGING ================= */}
            {step === 1 && (
              <form onSubmit={handleProceedToSpecs} className="space-y-6">
                <div className="space-y-2">
                  <p className="text-[12px] font-semibold uppercase tracking-wider text-[#6e6e73]">
                    Apple Gift Concierge
                  </p>
                  <h2
                    className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1d1d1f]"
                    style={{ fontFamily: '"SF Pro Display", sans-serif' }}
                  >
                    Who is this special gift for?
                  </h2>
                  <p className="text-[16px] text-[#6e6e73]">
                    We’ll send an official Apple E-Gift notification, embossed greeting card, and delivery updates directly to their Gmail.
                  </p>
                </div>

                {/* Recipient Account Type Toggle (Gmail vs Apple User - Compact Apple Selection Cards) */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#1d1d1f]">
                    Delivery Destination
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Option 1: Gmail */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setRecipientType('gmail');
                        setEmailError('');
                      }}
                      className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between min-h-[82px] ${
                        recipientType === 'gmail'
                          ? 'border-[#0071e3] bg-blue-50/25 ring-1 ring-[#0071e3] shadow-xs'
                          : 'border-[#d2d2d7] bg-white hover:border-[#86868b]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-7 h-7 rounded-lg bg-[#ea4335]/10 flex items-center justify-center">
                          <svg
                            className="w-4 h-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z"
                              fill="#ea4335"
                            />
                          </svg>
                        </div>
                        <div
                          className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                            recipientType === 'gmail'
                              ? 'border-[#0071e3] bg-[#0071e3]'
                              : 'border-[#d2d2d7]'
                          }`}
                        >
                          {recipientType === 'gmail' && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>
                      </div>
                      <div>
                        <div
                          className={`text-[13px] font-semibold leading-tight ${
                            recipientType === 'gmail' ? 'text-[#0071e3]' : 'text-[#1d1d1f]'
                          }`}
                        >
                          Gmail Address
                        </div>
                        <div className="text-[11px] text-[#6e6e73] mt-0.5 leading-tight">
                          Claim link sent to inbox
                        </div>
                      </div>
                    </div>

                    {/* Option 2: Apple User */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setRecipientType('apple');
                        setEmailError('');
                      }}
                      className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between min-h-[82px] ${
                        recipientType === 'apple'
                          ? 'border-[#0071e3] bg-blue-50/25 ring-1 ring-[#0071e3] shadow-xs'
                          : 'border-[#d2d2d7] bg-white hover:border-[#86868b]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-7 h-7 rounded-lg bg-[#1d1d1f] flex items-center justify-center text-white">
                          <AppleLogo size={13} fill="#ffffff" />
                        </div>
                        <div
                          className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                            recipientType === 'apple'
                              ? 'border-[#0071e3] bg-[#0071e3]'
                              : 'border-[#d2d2d7]'
                          }`}
                        >
                          {recipientType === 'apple' && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>
                      </div>
                      <div>
                        <div
                          className={`text-[13px] font-semibold leading-tight ${
                            recipientType === 'apple' ? 'text-[#0071e3]' : 'text-[#1d1d1f]'
                          }`}
                        >
                          Apple User / ID
                        </div>
                        <div className="text-[11px] text-[#6e6e73] mt-0.5 leading-tight">
                          Linked to Apple Wallet
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recipient Address / Account Input (Clean, No Icon) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-semibold text-[#1d1d1f]">
                      {recipientType === 'gmail' ? 'Recipient’s Gmail Address' : 'Recipient’s Apple ID or User'} <span className="text-[#e30000]">*</span>
                    </label>
                    <span className="text-xs text-[#6e6e73]">
                      {recipientType === 'gmail' ? 'Claim link sent via Gmail' : 'Sent to Apple Wallet & iMessage'}
                    </span>
                  </div>
                  <input
                    type={recipientType === 'gmail' ? 'email' : 'text'}
                    required
                    value={recipientEmail}
                    onChange={(e) => {
                      setRecipientEmail(e.target.value);
                      if (emailError) setEmailError('');
                    }}
                    placeholder={recipientType === 'gmail' ? 'friend@gmail.com' : 'user@icloud.com or Apple ID'}
                    className={`apple-input-field ${emailError ? '!border-[#e30000] ring-2 ring-[#e30000]/20' : ''}`}
                  />
                  {emailError && <p className="text-xs text-[#e30000] font-medium">{emailError}</p>}
                </div>

                {/* Sender Name - Default Zyre */}
                <div className="space-y-1.5">
                  <label className="block text-[14px] font-semibold text-[#1d1d1f]">
                    From (Your Name)
                  </label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Zyre"
                    className="apple-input-field"
                  />
                </div>

                {/* Delivery Scheduling - Wide Comfortable Grid */}
                <div className="space-y-2 p-4 rounded-2xl bg-[#f5f5f7] border border-[#d2d2d7]">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6e6e73]">
                    Delivery Scheduling
                  </label>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                      gap: '14px',
                      width: '100%'
                    }}
                  >
                    <div
                      role="button"
                      onClick={() => setDeliveryOption('fastest')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 20px',
                        minHeight: '84px',
                        borderRadius: '14px',
                        border: deliveryOption === 'fastest' ? '2px solid #0071e3' : '1px solid #d2d2d7',
                        backgroundColor: '#ffffff',
                        boxShadow: deliveryOption === 'fastest' ? '0 0 0 1px #0071e3' : 'none',
                        cursor: 'pointer',
                        boxSizing: 'border-box',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#1d1d1f' }}>Fastest Free Delivery</div>
                        <div style={{ fontSize: '13px', color: '#6e6e73', marginTop: '3px' }}>Arrives Tomorrow by 10:30 AM</div>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#34c759' }}>Free Express</span>
                    </div>

                    <div
                      role="button"
                      onClick={() => setDeliveryOption('scheduled')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 20px',
                        minHeight: '84px',
                        borderRadius: '14px',
                        border: deliveryOption === 'scheduled' ? '2px solid #0071e3' : '1px solid #d2d2d7',
                        backgroundColor: '#ffffff',
                        boxShadow: deliveryOption === 'scheduled' ? '0 0 0 1px #0071e3' : 'none',
                        cursor: 'pointer',
                        boxSizing: 'border-box',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#1d1d1f' }}>Schedule for Special Date</div>
                        <div style={{ fontSize: '13px', color: '#6e6e73', marginTop: '3px' }}>Birthday, Anniversary, or Holiday</div>
                      </div>
                      <Calendar className="w-5 h-5 text-[#0071e3] shrink-0" />
                    </div>
                  </div>

                  {deliveryOption === 'scheduled' && (
                    <div className="pt-2">
                      <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">
                        Select Delivery Date:
                      </label>
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="apple-input-field !h-11 text-sm"
                      />
                    </div>
                  )}
                </div>

                {/* Group Gifting (Split the Bill) */}
                <div className="p-4 rounded-2xl bg-[#f5f5f7] border border-[#d2d2d7] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-[#0071e3]" />
                    <div>
                      <div className="text-sm font-bold text-[#1d1d1f]">
                        Group Gifting (Split the Bill with Friends)
                      </div>
                      <div className="text-xs text-[#6e6e73]">
                        Share a contribution link so multiple people can pitch in towards this iPhone.
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isGroupGift}
                    onChange={(e) => setIsGroupGift(e.target.checked)}
                    className="w-5 h-5 accent-[#0071e3] cursor-pointer"
                  />
                </div>

                {/* Submit to Step 2 */}
                <button
                  type="submit"
                  className="apple-cta-primary w-full text-base py-3.5 shadow-sm"
                >
                  <span>Continue to Customise Device</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* ================= STEP 2: FINISH, SPECS, ENGRAVING & ACCESSORIES ================= */}
            {step === 2 && (
              <div className="space-y-7">
                {/* Header */}
                <div className="space-y-1">
                  <p className="text-[12px] font-semibold uppercase tracking-wider text-[#6e6e73]">
                    Step 2 of 4 • Customisation
                  </p>
                  <h2
                    className="text-3xl font-semibold tracking-tight text-[#1d1d1f]"
                    style={{ fontFamily: '"SF Pro Display", sans-serif' }}
                  >
                    Customise their {product.name}.
                  </h2>
                  <p className="text-sm text-[#6e6e73]">
                    Gifting to <strong className="text-[#0071e3]">{recipientEmail}</strong>
                  </p>
                </div>

                {/* Device Stage Showcase with Multi-Angle Inspector and Color-Matching Image */}
                <div className="apple-stage p-6 sm:p-8 text-center relative overflow-hidden bg-[#f5f5f7] rounded-3xl border border-[#e5e5ea]">
                  {/* Angle Switcher */}
                  <div className="absolute top-4 left-4 z-10 flex items-center gap-1 bg-white/80 backdrop-blur-md p-1 rounded-full border border-black/10 shadow-xs">
                    {(['front', 'back', 'profile'] as const).map((angle) => (
                      <button
                        key={angle}
                        type="button"
                        onClick={() => setViewAngle(angle)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all cursor-pointer ${
                          viewAngle === angle ? 'bg-[#0071e3] text-white shadow-xs' : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                        }`}
                      >
                        {angle}
                      </button>
                    ))}
                  </div>

                  <div className="h-68 sm:h-80 flex items-center justify-center relative">
                    <img
                      key={selectedFinish.name + selectedFinish.image}
                      src={selectedFinish.image}
                      alt={`${product.name} in ${selectedFinish.name}`}
                      className={`max-h-full max-w-full object-contain filter drop-shadow-xl transition-all duration-300 ${
                        viewAngle === 'back' ? 'scale-x-[-1]' : viewAngle === 'profile' ? 'scale-90 rotate-12' : ''
                      }`}
                      style={{ maxHeight: '290px' }}
                    />

                    {/* Live Engraving Preview on Device Back */}
                    {hasEngraving && engravingText && viewAngle === 'back' && (
                      <div className="absolute bottom-16 bg-black/20 backdrop-blur-xs px-3 py-1 rounded border border-white/20 text-xs font-mono font-bold text-white/90 tracking-widest uppercase flex items-center gap-1">
                        <AppleLogo size={12} />
                        <span>{engravingText}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3">
                    <div className="text-xs uppercase tracking-widest text-[#86868b] font-bold">Selected Finish</div>
                    <div className="text-xl font-bold text-[#1d1d1f] flex items-center justify-center gap-2 mt-0.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/20"
                        style={{ backgroundColor: selectedFinish.colorHex }}
                      />
                      {selectedFinish.name}
                    </div>
                  </div>
                </div>

                {/* Color Swatches */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[#1d1d1f]">
                    Finish: <span className="font-normal text-[#6e6e73]">{selectedFinish.name}</span>
                  </label>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {product.finishes.map((finish) => {
                      const isSelected = selectedFinish.name === finish.name;
                      return (
                        <div
                          key={finish.name}
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedFinish(finish)}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border cursor-pointer transition-all ${
                            isSelected ? 'border-[#0071e3] bg-white ring-2 ring-[#0071e3]/20' : 'border-[#d2d2d7] bg-white hover:border-[#86868b]'
                          }`}
                        >
                          <span
                            className="w-4 h-4 rounded-full border border-black/15 shrink-0"
                            style={{ backgroundColor: finish.colorHex }}
                          />
                          <span className={`text-xs font-semibold ${isSelected ? 'text-[#0071e3]' : 'text-[#1d1d1f]'}`}>
                            {finish.name}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#0071e3]" />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Wide Storage Capacity Selection Tiles */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[#1d1d1f]">
                    How much capacity?
                  </label>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${product.storages.length}, minmax(0, 1fr))`,
                      gap: '12px',
                      width: '100%'
                    }}
                  >
                    {product.storages.map((storage) => {
                      const isSelected = selectedStorage.size === storage.size;
                      return (
                        <div
                          key={storage.size}
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedStorage(storage)}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            minHeight: '84px',
                            padding: '14px 10px',
                            borderRadius: '14px',
                            border: isSelected ? '2px solid #0071e3' : '1px solid #d2d2d7',
                            backgroundColor: '#ffffff',
                            boxShadow: isSelected ? '0 0 0 1px #0071e3' : 'none',
                            cursor: 'pointer',
                            boxSizing: 'border-box',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ fontSize: '20px', fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                            {storage.size}
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: 500, color: '#6e6e73', marginTop: '4px' }}>
                            ${storage.price}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Free Custom Laser Engraving */}
                <div className="p-4 rounded-2xl bg-[#f5f5f7] border border-[#d2d2d7] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#0071e3]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-[#1d1d1f]">
                        Free Custom Laser Engraving
                      </span>
                    </div>
                    <span className="text-xs text-[#34c759] font-bold">FREE</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="engraving-toggle"
                      checked={hasEngraving}
                      onChange={(e) => {
                        setHasEngraving(e.target.checked);
                        if (e.target.checked) setViewAngle('back');
                      }}
                      className="w-5 h-5 accent-[#0071e3] cursor-pointer"
                    />
                    <label htmlFor="engraving-toggle" className="text-xs text-[#6e6e73] cursor-pointer">
                      Etch a custom name, initials, or memorable date directly onto the titanium back of the iPhone.
                    </label>
                  </div>
                  {hasEngraving && (
                    <input
                      type="text"
                      maxLength={24}
                      value={engravingText}
                      onChange={(e) => setEngravingText(e.target.value)}
                      placeholder="e.g. ZYRE • 2026"
                      className="apple-input-field !h-10 text-sm font-mono"
                    />
                  )}
                </div>

                {/* Carrier Setup - Wide Grid */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[#1d1d1f]">
                    Connectivity & Carrier Setup
                  </label>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                      gap: '12px',
                      width: '100%'
                    }}
                  >
                    {[
                      { id: 'unlocked', label: 'Connect Later', desc: 'Unlocked eSIM' },
                      { id: 'att', label: 'AT&T', desc: 'Instant eSIM' },
                      { id: 'verizon', label: 'Verizon', desc: '5G Ultra Wideband' },
                      { id: 'tmobile', label: 'T-Mobile', desc: 'Auto carrier' }
                    ].map((c) => (
                      <div
                        key={c.id}
                        role="button"
                        onClick={() => setSelectedCarrier(c.id as any)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center',
                          padding: '14px 10px',
                          minHeight: '80px',
                          borderRadius: '14px',
                          border: selectedCarrier === c.id ? '2px solid #0071e3' : '1px solid #d2d2d7',
                          backgroundColor: '#ffffff',
                          boxShadow: selectedCarrier === c.id ? '0 0 0 1px #0071e3' : 'none',
                          cursor: 'pointer',
                          boxSizing: 'border-box',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#1d1d1f' }}>{c.label}</div>
                        <div style={{ fontSize: '11px', color: '#6e6e73', marginTop: '2px' }}>{c.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trade-in Estimator */}
                <div className="p-4 rounded-2xl bg-[#f5f5f7] border border-[#d2d2d7] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#1d1d1f]">
                      Apple Trade In Credit (Optional)
                    </span>
                    {tradeInCredit > 0 && (
                      <span className="text-xs font-bold text-[#34c759]">-${tradeInCredit} Instant Credit</span>
                    )}
                  </div>
                  <select
                    value={tradeInModel}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTradeInModel(val);
                      if (val === 'iphone-15-pro') setTradeInCredit(650);
                      else if (val === 'iphone-14-pro') setTradeInCredit(450);
                      else if (val === 'iphone-13') setTradeInCredit(280);
                      else setTradeInCredit(0);
                    }}
                    className="apple-input-field !h-10 text-xs"
                  >
                    <option value="none">No trade-in device</option>
                    <option value="iphone-15-pro">iPhone 15 Pro Max (Get $650 instant credit)</option>
                    <option value="iphone-14-pro">iPhone 14 Pro (Get $450 instant credit)</option>
                    <option value="iphone-13">iPhone 13 (Get $280 instant credit)</option>
                  </select>
                </div>

                {/* AppleCare+ & MagSafe Accessories */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[#1d1d1f]">
                    Gift Add-ons & Protection
                  </label>
                  <div className="space-y-2">
                    <div
                      role="button"
                      onClick={() => setIncludeAppleCare(!includeAppleCare)}
                      className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer ${
                        includeAppleCare ? 'border-[#0071e3] bg-white ring-2 ring-[#0071e3]/20' : 'border-[#d2d2d7] bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center text-red-500 font-bold text-sm">
                          <AppleLogo size={14} className="text-red-500" />
                          <span>Care+</span>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#1d1d1f]">AppleCare+ with Theft & Loss</div>
                          <div className="text-[11px] text-[#6e6e73]">2 years unlimited repairs and 24/7 priority support</div>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#1d1d1f]">+$199</span>
                    </div>

                    <div
                      role="button"
                      onClick={() => setIncludeCase(!includeCase)}
                      className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer ${
                        includeCase ? 'border-[#0071e3] bg-white ring-2 ring-[#0071e3]/20' : 'border-[#d2d2d7] bg-white'
                      }`}
                    >
                      <div className="text-xs">
                        <span className="font-bold text-[#1d1d1f]">Color-Matched MagSafe Silicone Case</span>
                        <div className="text-[11px] text-[#6e6e73]">Matching {selectedFinish.name} finish</div>
                      </div>
                      <span className="text-xs font-bold text-[#1d1d1f]">+$49</span>
                    </div>

                    <div
                      role="button"
                      onClick={() => setIncludeWallet(!includeWallet)}
                      className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer ${
                        includeWallet ? 'border-[#0071e3] bg-white ring-2 ring-[#0071e3]/20' : 'border-[#d2d2d7] bg-white'
                      }`}
                    >
                      <div className="text-xs">
                        <span className="font-bold text-[#1d1d1f]">iPhone FineWoven Wallet with MagSafe</span>
                        <div className="text-[11px] text-[#6e6e73]">Supports Find My notification when detached</div>
                      </div>
                      <span className="text-xs font-bold text-[#1d1d1f]">+$59</span>
                    </div>
                  </div>
                </div>

                {/* Subtotal & Next */}
                <div className="pt-4 border-t border-[#d2d2d7] flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <div className="text-xs text-[#6e6e73]">Total Gift Package:</div>
                    <div className="text-3xl font-bold text-[#1d1d1f]">
                      ${totalPrice.toLocaleString()}.00
                    </div>
                    {tradeInCredit > 0 && (
                      <div className="text-xs text-[#34c759] font-medium">Includes ${tradeInCredit} Trade-in Credit</div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="apple-cta-secondary px-6 py-3 text-sm"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="apple-cta-primary flex-1 sm:flex-initial px-7 py-3 text-sm"
                    >
                      <span>Proceed to Payment</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 3: PAYMENT GATEWAYS ================= */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <p className="text-[12px] font-semibold uppercase tracking-wider text-[#6e6e73]">
                    Step 3 of 4 • Secure Payment
                  </p>
                  <h2
                    className="text-3xl font-semibold tracking-tight text-[#1d1d1f]"
                    style={{ fontFamily: '"SF Pro Display", sans-serif' }}
                  >
                    Choose how to pay.
                  </h2>
                </div>

                {/* Gateway Switcher (Apple Pay vs PayPal) - Wide Cards */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    gap: '14px',
                    width: '100%'
                  }}
                >
                  <div
                    role="button"
                    onClick={() => setPaymentGateway('applepay')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      height: '64px',
                      borderRadius: '16px',
                      border: paymentGateway === 'applepay' ? '2px solid #000000' : '1px solid #d2d2d7',
                      backgroundColor: paymentGateway === 'applepay' ? '#000000' : '#ffffff',
                      color: paymentGateway === 'applepay' ? '#ffffff' : '#1d1d1f',
                      boxShadow: paymentGateway === 'applepay' ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                      cursor: 'pointer',
                      boxSizing: 'border-box',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <ApplePayBadge size={22} fill={paymentGateway === 'applepay' ? '#ffffff' : '#000000'} />
                  </div>

                  <div
                    role="button"
                    onClick={() => setPaymentGateway('paypal')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      height: '64px',
                      borderRadius: '16px',
                      border: paymentGateway === 'paypal' ? '2px solid #003087' : '1px solid #d2d2d7',
                      backgroundColor: paymentGateway === 'paypal' ? '#003087' : '#ffffff',
                      color: paymentGateway === 'paypal' ? '#ffffff' : '#1d1d1f',
                      boxShadow: paymentGateway === 'paypal' ? '0 4px 12px rgba(0,48,135,0.2)' : 'none',
                      cursor: 'pointer',
                      boxSizing: 'border-box',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span className="font-bold italic text-lg tracking-tight">PayPal</span>
                    <span className="text-xs font-semibold opacity-90">Express Checkout</span>
                  </div>
                </div>

                {/* Apple Pay View */}
                {paymentGateway === 'applepay' && (
                  <div className="p-6 rounded-3xl bg-[#f5f5f7] border border-[#d2d2d7] space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-[#d2d2d7]">
                      <div className="flex items-center gap-2">
                        <ApplePayBadge size={24} />
                        <span className="text-xs font-semibold text-[#6e6e73]">Apple Card (${userSettings.applePayBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} Available)</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-[#6e6e73]">Amount Due</div>
                        <div className="text-lg font-bold">${totalPrice.toLocaleString()}.00</div>
                      </div>
                    </div>

                    <div className="text-xs space-y-2 text-[#6e6e73]">
                      <div className="flex justify-between">
                        <span>Card:</span>
                        <strong className="text-[#1d1d1f]">Apple Card (•••• 9021)</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Sender:</span>
                        <strong className="text-[#1d1d1f]">{senderName}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>{recipientType === 'gmail' ? 'Recipient Email:' : 'Recipient Apple ID:'}</span>
                        <strong className="text-[#1d1d1f]">{recipientEmail}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Delivery:</span>
                        <strong className="text-[#34c759]">Free Express Signature Packaging</strong>
                      </div>
                    </div>

                    {isProcessingPayment ? (
                      <div className="w-full py-4 rounded-full bg-black text-white font-bold text-center flex flex-col items-center justify-center gap-2 shadow-lg">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs">{paymentProgressText}</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleExecutePayment}
                        className="w-full h-13 rounded-full bg-black hover:bg-neutral-800 text-white font-bold text-base flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer"
                      >
                        <AppleLogo size={18} fill="#ffffff" />
                        <span>Pay with Passcode / Face ID (${totalPrice.toLocaleString()}.00)</span>
                      </button>
                    )}
                  </div>
                )}

                {/* PayPal View (Multi-Page Loading & Verification Flow) */}
                {paymentGateway === 'paypal' && (
                  <div className="space-y-4">
                    {/* State 1: Loading Gateway Page */}
                    {paypalFlowState === 'loading' && (
                      <div className="p-8 rounded-3xl bg-[#f5f5f7] border border-[#d2d2d7] text-center space-y-5 animate-in fade-in duration-300">
                        <div className="w-14 h-14 rounded-2xl bg-[#003087] text-white flex items-center justify-center mx-auto shadow-md">
                          <span className="font-bold italic text-2xl tracking-tighter">P</span>
                        </div>
                        <div className="space-y-1.5">
                          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0079C1]">
                            <div className="w-2 h-2 rounded-full bg-[#0079C1] animate-ping" />
                            <span>PayPal Secure Gateway</span>
                          </div>
                          <h3 className="text-xl font-bold text-[#1d1d1f]">Connecting to PayPal...</h3>
                          <p className="text-xs text-[#6e6e73] max-w-sm mx-auto">
                            Sending a 6-digit one-time verification security code to your Gmail inbox to authorize this transaction.
                          </p>
                        </div>
                        <div className="w-48 h-1.5 bg-[#e5e5ea] rounded-full mx-auto overflow-hidden">
                          <div className="h-full bg-[#0079C1] rounded-full animate-pulse w-3/4" />
                        </div>
                      </div>
                    )}

                    {/* State 2: Verification Code Sent to Gmail Screen */}
                    {(paypalFlowState === 'verification' || paypalFlowState === 'authorizing') && (
                      <div className="p-6 rounded-3xl bg-[#ffffff] border-2 border-[#003087]/20 shadow-md space-y-5 animate-in fade-in duration-300">
                        {/* Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-[#e5e5ea]">
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-bold italic text-[#003087]">PayPal</span>
                            <span className="text-xs font-semibold text-[#6e6e73]">Security Check</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-[#0079C1] font-semibold">
                            <ShieldCheck className="w-4 h-4" />
                            <span>Identity Verification</span>
                          </div>
                        </div>

                        {/* Notification Notice with Masked Gmail */}
                        <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/60 space-y-2">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#ea4335]/15 text-[#ea4335] flex items-center justify-center shrink-0 mt-0.5">
                              <Mail className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-[#1d1d1f]">
                                A verification code has been sent to your Gmail
                              </div>
                              <div className="text-xs font-bold font-mono text-[#0071e3] mt-0.5 tracking-wider">
                                {(() => {
                                  const raw = recipientType === 'gmail' && recipientEmail ? recipientEmail : (userSettings.defaultRecipientEmail || 'user@gmail.com');
                                  if (!raw.includes('@')) return '••••••••@gmail.com';
                                  const [name, domain] = raw.split('@');
                                  const start = name.slice(0, 2);
                                  const end = name.slice(-2);
                                  return `${start}••••••••${end}@${domain}`;
                                })()}
                              </div>
                              <div className="text-[11px] text-[#6e6e73] mt-1">
                                Please check your inbox and enter the 6-digit code below to confirm your purchase.
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Code Input */}
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-[#1d1d1f]">
                            6-Digit Verification Code <span className="text-[#e30000]">*</span>
                          </label>

                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={8}
                            value={paypalVerificationCode}
                            onChange={(e) => {
                              setPaypalVerificationCode(e.target.value);
                              if (paypalVerificationError) setPaypalVerificationError('');
                            }}
                            placeholder="Enter 6-digit code"
                            autoFocus
                            className={`apple-input-field font-mono text-center text-lg tracking-widest font-bold !h-13 ${
                              paypalVerificationError ? '!border-[#e30000] ring-2 ring-[#e30000]/20' : 'border-[#003087]/40 focus:border-[#003087]'
                            }`}
                          />

                          {paypalVerificationError && (
                            <p className="text-xs text-[#e30000] font-medium text-center">{paypalVerificationError}</p>
                          )}
                        </div>

                        {/* Summary of payment method */}
                        <div className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-[#f5f5f7] text-[#6e6e73]">
                          <span>Paying with {paypalMethod === 'balance' ? 'PayPal Balance' : paypalMethod === 'card' ? 'Visa Debit (•••• 4821)' : 'Pay in 4'}</span>
                          <span className="font-bold text-[#1d1d1f]">${totalPrice.toLocaleString()}.00 USD</span>
                        </div>

                        {/* Confirm Purchase button */}
                        {isProcessingPayment || paypalFlowState === 'authorizing' ? (
                          <div className="w-full py-4 rounded-full bg-[#ffc439] text-[#003087] font-bold text-center flex flex-col items-center justify-center gap-1 shadow-md">
                            <div className="w-4 h-4 border-2 border-[#003087] border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs">{paymentProgressText || 'Authorizing PayPal Payment...'}</span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <button
                              type="button"
                              onClick={handleConfirmPaypalPurchase}
                              className="apple-paypal-gold-btn cursor-pointer w-full text-base font-bold !h-12 shadow-md"
                            >
                              <ShieldCheck className="w-4 h-4" />
                              <span>Confirm Purchase (${totalPrice.toLocaleString()}.00 USD)</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setPaypalFlowState('idle')}
                              className="w-full text-center text-xs text-[#6e6e73] hover:text-[#1d1d1f] py-1 cursor-pointer"
                            >
                              Cancel & choose different payment method
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* State 0: Initial Method Selection */}
                    {paypalFlowState === 'idle' && (
                      <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-[#003087] text-white flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-bold italic">PayPal</span>
                            <span className="text-xs text-blue-200">Express Checkout</span>
                          </div>
                          <div className="text-base font-bold">${totalPrice.toLocaleString()}.00 USD</div>
                        </div>

                        {/* PayPal Options */}
                        <div className="space-y-2 text-xs">
                          {[
                            { id: 'balance', label: `PayPal Balance ($${userSettings.paypalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })})`, badge: 'Instant' },
                            { id: 'card', label: 'Chase Premier Visa Debit (•••• 4821)', badge: '' },
                            { id: 'payin4', label: 'Pay in 4 (4 payments of $' + (totalPrice / 4).toFixed(2) + ')', badge: '0% APR' }
                          ].map((opt) => (
                            <div
                              key={opt.id}
                              role="button"
                              onClick={() => setPaypalMethod(opt.id as any)}
                              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer ${
                                paypalMethod === opt.id ? 'border-[#0079C1] bg-blue-50/50' : 'border-[#d2d2d7] bg-white'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name="paypalSub"
                                  checked={paypalMethod === opt.id}
                                  onChange={() => setPaypalMethod(opt.id as any)}
                                  className="accent-[#0079C1]"
                                />
                                <span className="font-semibold text-[#1d1d1f]">{opt.label}</span>
                              </div>
                              {opt.badge && <span className="font-bold text-[#34c759]">{opt.badge}</span>}
                            </div>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={handleStartPaypalCheckout}
                          className="apple-paypal-gold-btn cursor-pointer"
                        >
                          <span className="font-bold italic">PayPal</span>
                          <span>Pay with PayPal (${totalPrice.toLocaleString()}.00 USD)</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-xs text-[#6e6e73] hover:underline"
                  >
                    Back to device customisation
                  </button>
                </div>
              </div>
            )}

            {/* ================= STEP 4: OFFICIAL RECEIPT (CLEAN, NO EXTRA BUTTONS) ================= */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="p-6 sm:p-8 bg-[#fbfbfd] rounded-3xl border border-[#d2d2d7] space-y-6">
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#d2d2d7] gap-3">
                    <div className="flex items-center gap-3">
                      <AppleLogo size={28} />
                      <div>
                        <h3 className="text-lg font-bold text-[#1d1d1f]">Apple Store Official Gift Receipt</h3>
                        <p className="text-xs text-[#6e6e73]">Order: <strong className="font-mono text-[#1d1d1f]">{orderNumber}</strong></p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-[#34c759]/10 text-[#34c759] text-xs font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Confirmed & Paid
                    </span>
                  </div>

                  {/* Recipient Notice */}
                  <div className="p-4 rounded-2xl bg-[#f5f5f7] border border-[#d2d2d7]">
                    <div className="text-xs font-bold text-[#1d1d1f]">
                      {recipientType === 'gmail' ? "E-Gift Sent to Recipient's Gmail" : "E-Gift Linked to Recipient's Apple ID"}
                    </div>
                    <div className="text-xs text-[#0071e3] font-semibold mt-0.5 flex items-center gap-1.5">
                      {recipientType === 'gmail' ? <Mail className="w-3.5 h-3.5 text-[#ea4335]" /> : <AppleLogo size={13} />}
                      <span>{recipientEmail}</span>
                    </div>
                  </div>

                  {/* Summary grid */}
                  <div className="p-4 rounded-2xl bg-white border border-[#d2d2d7] space-y-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#6e6e73]">Device</span>
                      <strong>{product.name} {selectedStorage.size} ({selectedFinish.name})</strong>
                    </div>
                    {hasEngraving && engravingText && (
                      <div className="flex justify-between">
                        <span className="text-[#6e6e73]">Custom Laser Engraving</span>
                        <strong className="font-mono">"{engravingText}"</strong>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-[#6e6e73]">Packaging</span>
                      <strong>Signature Apple Gift Box</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6e6e73]">From</span>
                      <strong>{senderName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6e6e73]">Payment Gateway</span>
                      <strong>{paymentGateway === 'applepay' ? 'Apple Pay' : 'PayPal'} ({transactionId})</strong>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-[#d2d2d7] text-sm font-bold">
                      <span>Total Paid</span>
                      <span>${totalPrice.toLocaleString()}.00 USD</span>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={onClose}
                    className="apple-cta-primary px-8 py-3 text-sm"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recipient Gmail Simulator Modal */}
      <GmailSimulatorModal
        isOpen={isGmailPreviewOpen}
        onClose={() => setIsGmailPreviewOpen(false)}
        recipientEmail={recipientEmail}
        senderName={senderName}
        giftMessage={giftMessage}
        product={product}
        finish={selectedFinish}
        storage={selectedStorage}
        engravingText={hasEngraving ? engravingText : ''}
        orderNumber={orderNumber}
        ribbonColor={ribbonColor}
      />
    </>
  );
}
