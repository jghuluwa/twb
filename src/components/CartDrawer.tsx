import { useEffect, useState } from 'react';
import { X, Trash2, ShieldCheck, Truck, CreditCard, ShoppingBag, BadgeCheck, MapPin, LogIn } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { CartItem, Language } from '../types';
import { CustomerAccount } from '../admin/types';
import { translations } from '../data/translations';
import {
  createOrder, fetchPaymentMethods,
  startAlipayCheckout, startStripeCheckout, startWechatCheckout,
  validateDiscountCode, fetchShippingForCheckout, type ShippingMethod
} from '../admin/store';

interface CartDrawerProps {
  currentLang: Language;
  currency: 'USD' | 'CNY';
  cartItems: CartItem[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateQuantity: (index: number, delta: number) => void;
  onRemoveItem: (index: number) => void;
  customer: CustomerAccount | null;
  onRequestLogin: () => void;
  onOrderPlaced?: () => void;
}

export default function CartDrawer({
  currentLang,
  currency,
  cartItems,
  isOpen,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  customer,
  onRequestLogin,
  onOrderPlaced
}: CartDrawerProps) {
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [shippingCountry, setShippingCountry] = useState(currentLang === 'en' ? 'United States' : '中国大陆');
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [methods, setMethods] = useState<{ stripe: boolean; alipay: boolean; wechat: boolean }>({ stripe: false, alipay: false, wechat: false });
  const [submitting, setSubmitting] = useState(false);
  const [wechatQr, setWechatQr] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Discount code state ──
  const [discountInput, setDiscountInput] = useState('');
  const [discount, setDiscount] = useState<{ code: string; amount: number; kind?: string } | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);

  // ── Shipping state ──
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [shippingMethodId, setShippingMethodId] = useState<string | null>(null);

  const t = translations[currentLang];

  // Discover which payment methods the deployment has actually configured.
  useEffect(() => { fetchPaymentMethods().then(setMethods); }, []);

  // Auto-fill the checkout form when a registered customer opens the cart
  useEffect(() => {
    if (!customer) return;
    setCustomerName(customer.name);
    setCustomerEmail(customer.email);
    if (customer.phone) setCustomerPhone(customer.phone);
    const def = customer.addresses.find((a) => a.isDefault) || customer.addresses[0];
    if (def) {
      setSelectedAddressId(def.id);
      setCustomerName(def.recipient || customer.name);
      setCustomerPhone(def.phone || customer.phone || '');
      setShippingCountry(def.country);
      setCustomerAddress(def.address);
    } else if (customer.country) {
      setShippingCountry(customer.country);
    }
  }, [customer, isCheckoutModalOpen]);

  const pickAddress = (id: string) => {
    setSelectedAddressId(id);
    const a = customer?.addresses.find((x) => x.id === id);
    if (!a) return;
    setCustomerName(a.recipient);
    setCustomerPhone(a.phone);
    setShippingCountry(a.country);
    setCustomerAddress(a.address);
  };

  const subtotal = cartItems.reduce((acc, item) => {
    const price = currency === 'USD' ? item.product.priceUSD : item.product.priceCNY;
    return acc + price * item.quantity;
  }, 0);

  const currencySymbol = currency === 'USD' ? '$' : '¥';

  const discountAmount = discount ? discount.amount : 0;
  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
  const chosenShipping = shippingMethods.find((m) => m.id === shippingMethodId) || shippingMethods[0];
  const shippingFee = discount?.kind === 'free_shipping' ? 0 : (chosenShipping?.feeForOrder ?? 0);
  const grandTotal = subtotalAfterDiscount + shippingFee;

  // Refresh shipping options when country, currency or subtotal changes
  useEffect(() => {
    if (!isCheckoutModalOpen) return;
    fetchShippingForCheckout(shippingCountry, currency, subtotalAfterDiscount)
      .then((methods) => {
        setShippingMethods(methods);
        if (!shippingMethodId && methods.length > 0) setShippingMethodId(methods[0].id);
      })
      .catch(() => setShippingMethods([]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCheckoutModalOpen, shippingCountry, currency, subtotalAfterDiscount]);

  const applyDiscount = async () => {
    setDiscountError(null);
    const code = discountInput.trim();
    if (!code) return;
    try {
      const v = await validateDiscountCode(code, subtotal, currency);
      if (v.ok) setDiscount({ code: v.code, amount: v.amount, kind: v.kind });
      else { setDiscount(null); setDiscountError(v.reason || '优惠码无效'); }
    } catch (err) {
      setDiscountError(err instanceof Error ? err.message : '验证失败');
    }
  };
  const clearDiscount = () => { setDiscount(null); setDiscountInput(''); setDiscountError(null); };

  // Create the order on the server first (status: pending). The customer then
  // picks a payment method; we redirect to the gateway. The order will be
  // flipped to "paid" by the gateway's webhook.
  const submitOrder = async (): Promise<string | null> => {
    if (!customerName.trim() || !customerEmail.trim()) {
      setSubmitError(currentLang === 'en' ? 'Please fill in name and email.' : '请填写收货人姓名与邮箱');
      return null;
    }
    setSubmitError(null);
    setSubmitting(true);
    try {
      const order = await createOrder({
        currency,
        items: cartItems.map((it) => ({
          productId:         it.product.id,
          productName:       it.product.name[currentLang] || it.product.name.zh || it.product.name.en,
          selectedSize:      it.selectedSize,
          selectedColorName: it.selectedColorName,
          selectedColorHex:  it.selectedColorHex,
          quantity:          it.quantity,
          unitPrice:         currency === 'USD' ? it.product.priceUSD : it.product.priceCNY
        })),
        customer: {
          name:    customerName.trim(),
          email:   customerEmail.trim(),
          phone:   customerPhone.trim() || undefined,
          country: shippingCountry,
          address: customerAddress.trim() || undefined
        },
        customerId: customer?.id,
        discountCode: discount?.code,
        shippingMethodId: chosenShipping?.id
      } as Parameters<typeof createOrder>[0]);
      setPlacedOrderId(order.id);
      return order.id;
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '订单提交失败');
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  const payWithStripe = async () => {
    const id = placedOrderId || await submitOrder();
    if (!id) return;
    try {
      const url = await startStripeCheckout(id);
      onOrderPlaced?.();
      window.location.href = url;
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Stripe checkout failed');
    }
  };
  const payWithAlipay = async () => {
    const id = placedOrderId || await submitOrder();
    if (!id) return;
    try {
      const url = await startAlipayCheckout(id);
      onOrderPlaced?.();
      window.location.href = url;
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '支付宝下单失败');
    }
  };
  const payWithWechat = async () => {
    const id = placedOrderId || await submitOrder();
    if (!id) return;
    try {
      const codeUrl = await startWechatCheckout(id);
      setWechatQr(codeUrl);
      onOrderPlaced?.();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '微信下单失败');
    }
  };
  const submitManual = async () => {
    const id = placedOrderId || await submitOrder();
    if (!id) return;
    setIsOrderPlaced(true);
    onOrderPlaced?.();
  };

  return (
    <AnimatePresence>
      {isOpen && (
    <div className="fixed inset-0 z-50 flex justify-end">

      {/* Background Mask */}
      <motion.div
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
      />

      {/* Slide-out Panel — spring in/out */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-neutral-100 z-10 p-5 sm:p-6 overflow-hidden"
      >
        {/* Panel Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2.5">
            <ShoppingBag className="w-5.5 h-5.5 text-rose-600" />
            <h3 className="font-sans text-lg font-extrabold text-slate-900">{t.cartTitle}</h3>
            <span className="text-[11px] font-mono font-black text-rose-600 bg-rose-50 py-0.5 px-2 rounded-full border border-rose-100/50">
              {cartItems.length}
            </span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-950 transition-colors cursor-pointer">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Cart Contents Scroll */}
        <div className="flex-1 overflow-y-auto py-4 scrollbar-thin">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center h-64 space-y-3">
              <ShoppingBag className="w-12 h-12 text-slate-300 stroke-[1.5]" />
              <p className="text-slate-400 font-sans text-sm font-bold">{t.cartEmpty}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item, index) => {
                const price = currency === 'USD' ? item.product.priceUSD : item.product.priceCNY;
                return (
                  <div key={index} className="flex gap-4 p-3 bg-slate-50/45 rounded-2xl border-2 border-slate-150 shadow-2xs items-center hover:bg-slate-50 transition-colors">
                    
                    {/* Size and color tiny badge visual */}
                    <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200 overflow-hidden shrink-0 relative">
                      <div className="absolute top-1 left-1 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.selectedColorHex }} />
                      <span className="font-mono text-[9px] font-black text-slate-400 mt-2">{item.selectedSize}</span>
                    </div>

                    {/* Meta info info */}
                    <div className="flex-1 space-y-1 text-left">
                      <h4 className="font-sans text-sm font-extrabold text-slate-900 line-clamp-1 leading-tight">
                        {item.product.name[currentLang]}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold">
                        {item.selectedColorName} | {item.selectedSize}
                      </p>

                      {/* Quantum Adjuster row */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden p-0.5">
                          <button
                            onClick={() => onUpdateQuantity(index, -1)}
                            className="px-2 py-0.5 text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
                          >
                            -
                          </button>
                          <span className="px-2.5 text-xs font-mono font-bold text-slate-700">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(index, 1)}
                            className="px-2 py-0.5 text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        {/* Sub price */}
                        <span className="font-mono text-sm font-black text-slate-900">
                          {currencySymbol}{(price * item.quantity).toLocaleString()}
                        </span>
                      </div>

                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => onRemoveItem(index)}
                      className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Global Promotions and checkout details */}
        {cartItems.length > 0 && (
          <div className="border-t border-slate-100 pt-4 space-y-4">
            
            {/* Free shipping banner */}
            <div className="bg-sky-50 text-sky-800 p-3 rounded-xl border border-sky-100 flex items-center space-x-2.5 text-xs font-bold">
              <Truck className="w-4 h-4 text-sky-600 animate-bounce" />
              <span>{currentLang === 'en' ? 'International Free Shipping Active!' : '支持全球极速免费配送！航空极速送达'}</span>
            </div>

            {/* Total Row */}
            <div className="flex justify-between items-end">
              <div>
                <span className="text-xs font-bold text-slate-450 uppercase tracking-wider block">{t.cartTotal}</span>
                <span className="text-[11px] font-bold text-slate-500">{t.paymentNotice}</span>
              </div>
              <span className="font-mono text-2xl font-black text-slate-900">
                {currencySymbol}{subtotal.toLocaleString()}
              </span>
            </div>

            {/* CTA checkout button */}
            <button
              onClick={() => setIsCheckoutModalOpen(true)}
              className="w-full flex items-center justify-center space-x-2 bg-slate-900 hover:bg-rose-600 text-white font-extrabold text-xs py-4 rounded-xl tracking-wider uppercase shadow-xl hover:shadow-rose-100 transition-all cursor-pointer"
            >
              <CreditCard className="w-4 h-4 shrink-0" />
              <span>{t.checkoutBtn}</span>
            </button>
          </div>
        )}

      </motion.div>

      {/* Interactive Checkout Simulator Modal Overlay */}
      {isCheckoutModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsCheckoutModalOpen(false)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs" />
          
          <div className="relative bg-white rounded-3xl w-full max-w-sm p-6 sm:p-8 shadow-2xl border-2 border-slate-150 flex flex-col justify-between overflow-hidden z-20 shrink-0 animate-in fade-in zoom-in duration-205">
            
            {/* Modal Heading */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h4 className="font-sans text-lg font-extrabold text-slate-900 flex items-center space-x-2 text-left">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>{currentLang === 'en' ? 'Gateway Secure Pay' : '通微宝安全加密网关'}</span>
              </h4>
              <button
                onClick={() => setIsCheckoutModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-950 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isOrderPlaced ? (
              <div className="my-8 flex flex-col items-center justify-center text-center space-y-4 py-6">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <BadgeCheck className="w-8 h-8 animate-bounce" />
                </div>
                <h5 className="text-base font-extrabold text-slate-900">
                  {currentLang === 'en' ? 'Order placed successfully!' : '订单已成功提交！'}
                </h5>
                {placedOrderId && (
                  <p className="text-xs font-mono font-black text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-lg">
                    {placedOrderId}
                  </p>
                )}
                <p className="text-xs text-slate-500 max-w-[260px]">
                  {currentLang === 'en'
                    ? 'Your order has been recorded. You can track it from the admin console.'
                    : '订单已安全录入。管理员可在后台「订单管理」中查看与发货。'}
                </p>
              </div>
            ) : (
              <div className="my-6 space-y-3">

                {/* Logged-in banner or prompt to sign in */}
                {customer ? (
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg px-3 py-2 text-[11px] font-bold">
                    <BadgeCheck className="w-3.5 h-3.5" />
                    <span>
                      {currentLang === 'en' ? 'Checking out as' : '正在以以下账号结算：'} <span className="font-black">{customer.email}</span>
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setIsCheckoutModalOpen(false); onRequestLogin(); }}
                    className="w-full flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg px-3 py-2 text-[11px] font-bold cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    {currentLang === 'en' ? 'Sign in for faster checkout & order tracking' : '登录以使用快速结算并追踪订单'}
                  </button>
                )}

                {/* Saved address picker for logged-in users */}
                {customer && customer.addresses.length > 0 && (
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {currentLang === 'en' ? 'Use saved address' : '使用已保存地址'}
                    </label>
                    <select
                      value={selectedAddressId}
                      onChange={(e) => pickAddress(e.target.value)}
                      className="w-full text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none cursor-pointer"
                    >
                      {customer.addresses.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.label} — {a.recipient} · {a.country}{a.isDefault ? (currentLang === 'en' ? ' (default)' : '（默认）') : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Customer information */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{currentLang === 'en' ? 'Full Name' : '收货人姓名 *'}</label>
                    <input type="text" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder={currentLang === 'en' ? 'John Doe' : '请输入姓名'} className="w-full text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none" />
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{currentLang === 'en' ? 'Email' : '邮箱 *'}</label>
                    <input type="email" required value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="you@email.com" className="w-full text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none" />
                  </div>
                  <div className="space-y-1 text-left col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{currentLang === 'en' ? 'Phone (optional)' : '电话（可选）'}</label>
                    <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="+86 138 0000 0000" className="w-full text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none" />
                  </div>
                  <div className="space-y-1 text-left col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{currentLang === 'en' ? 'Address (optional)' : '收货地址（可选）'}</label>
                    <input type="text" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder={currentLang === 'en' ? 'Street, City' : '街道、城市'} className="w-full text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none" />
                  </div>
                </div>

                {/* Simulated Address selection */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{currentLang === 'en' ? 'Select Shipping Target Country' : '配送目的国家或地区'}</label>
                  <select
                    value={shippingCountry}
                    onChange={(e) => setShippingCountry(e.target.value)}
                    className="w-full text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none cursor-pointer"
                  >
                    <option value="United States">United States ($)</option>
                    <option value="China">中国大陆 (¥)</option>
                    <option value="Hong Kong">中國香港特別行政區 (HKD)</option>
                    <option value="Taiwan">中國台灣地區 (TWD)</option>
                    <option value="United Kingdom">United Kingdom (GBP)</option>
                    <option value="Germany">Germany (EUR)</option>
                    <option value="Australia">Australia (AUD)</option>
                  </select>
                </div>

                {/* Discount code */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    {currentLang === 'en' ? 'Discount code' : '优惠码'}
                  </label>
                  {discount ? (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs font-bold text-emerald-700">
                      <span>✓ {discount.code} — -{currencySymbol}{discount.amount.toLocaleString()}{discount.kind === 'free_shipping' ? (currentLang === 'en' ? ' + free shipping' : ' + 免运费') : ''}</span>
                      <button onClick={clearDiscount} className="text-emerald-600 hover:underline cursor-pointer">{currentLang === 'en' ? 'Remove' : '移除'}</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input value={discountInput} onChange={(e) => setDiscountInput(e.target.value)}
                        placeholder={currentLang === 'en' ? 'Enter code' : '输入优惠码'}
                        className="flex-1 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none" />
                      <button onClick={applyDiscount} type="button"
                        className="bg-slate-900 hover:bg-rose-600 text-white font-extrabold text-xs uppercase tracking-wider px-3 py-2 rounded-lg cursor-pointer">
                        {currentLang === 'en' ? 'Apply' : '应用'}
                      </button>
                    </div>
                  )}
                  {discountError && <p className="text-[11px] font-bold text-rose-700">{discountError}</p>}
                </div>

                {/* Shipping method picker */}
                {shippingMethods.length > 0 && (
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      {currentLang === 'en' ? 'Shipping method' : '配送方式'}
                    </label>
                    <select value={shippingMethodId || ''} onChange={(e) => setShippingMethodId(e.target.value)}
                      className="w-full text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none cursor-pointer">
                      {shippingMethods.map((m) => (
                        <option key={m.id} value={m.id}>
                          {(m.name[currentLang] || m.name.zh || m.name.en) + ' · ' + (m.feeForOrder === 0 ? (currentLang === 'en' ? 'FREE' : '免运费') : `${currencySymbol}${m.feeForOrder}`) + (m.estDays ? ` · ${m.estDays}d` : '')}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Subtotal review */}
                <div className="bg-slate-50/50 p-3.5 rounded-xl border-2 border-slate-150 space-y-1.5 text-left">
                  <div className="flex justify-between text-xs font-bold text-slate-600">
                    <span>{currentLang === 'en' ? 'Subtotal' : '小计'}</span>
                    <span className="font-mono">{currencySymbol}{subtotal.toLocaleString()}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-xs font-bold text-emerald-600">
                      <span>{currentLang === 'en' ? 'Discount' : '优惠'}</span>
                      <span className="font-mono">-{currencySymbol}{discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs font-bold text-slate-600">
                    <span>{currentLang === 'en' ? 'Shipping' : '运费'}</span>
                    <span className="font-mono">{shippingFee === 0 ? (currentLang === 'en' ? 'FREE' : '免运费') : `${currencySymbol}${shippingFee.toLocaleString()}`}</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-slate-900 border-t border-slate-200 pt-1.5 mt-1.5">
                    <span>{currentLang === 'en' ? 'Total' : '合计'}</span>
                    <span className="font-mono">{currencySymbol}{grandTotal.toLocaleString()}</span>
                  </div>
                </div>

                {submitError && (
                  <p className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg">{submitError}</p>
                )}

                {wechatQr ? (
                  <div className="space-y-2 text-center pt-2">
                    <p className="text-xs font-bold text-slate-700">
                      {currentLang === 'en' ? 'Scan with WeChat to complete payment' : '使用微信扫码完成支付'}
                    </p>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(wechatQr)}`}
                      alt="WeChat Pay QR"
                      className="mx-auto rounded-lg border border-slate-200"
                    />
                    <p className="text-[10px] text-slate-400 font-bold">
                      {currentLang === 'en' ? 'Order will update automatically after payment.' : '支付完成后订单状态会自动更新。'}
                    </p>
                  </div>
                ) : (
                <>
                <div className="space-y-1.5 text-left pt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{currentLang === 'en' ? 'Pay with' : '选择支付方式'}</span>
                  <div className="space-y-2">
                    {methods.stripe && (
                      <button onClick={payWithStripe} disabled={submitting}
                        className="w-full flex items-center justify-center gap-2 bg-[#635BFF] hover:bg-[#4f47e6] text-white font-extrabold text-xs uppercase tracking-wider py-3 rounded-xl disabled:opacity-60 cursor-pointer">
                        <CreditCard className="w-4 h-4" />
                        {currentLang === 'en' ? 'Pay with Card · Stripe' : '信用卡 · Stripe'}
                      </button>
                    )}
                    {methods.alipay && currency === 'CNY' && (
                      <button onClick={payWithAlipay} disabled={submitting}
                        className="w-full flex items-center justify-center gap-2 bg-[#1677FF] hover:bg-[#0E66E6] text-white font-extrabold text-xs uppercase tracking-wider py-3 rounded-xl disabled:opacity-60 cursor-pointer">
                        支付宝 Alipay
                      </button>
                    )}
                    {methods.wechat && currency === 'CNY' && (
                      <button onClick={payWithWechat} disabled={submitting}
                        className="w-full flex items-center justify-center gap-2 bg-[#07C160] hover:bg-[#05A752] text-white font-extrabold text-xs uppercase tracking-wider py-3 rounded-xl disabled:opacity-60 cursor-pointer">
                        微信支付 WeChat Pay
                      </button>
                    )}
                    {!methods.stripe && !methods.alipay && !methods.wechat && (
                      <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-3 py-2 text-[11px] font-bold">
                        {currentLang === 'en'
                          ? 'Online payment is not enabled yet. Submit the order and our team will contact you to arrange payment.'
                          : '在线支付尚未配置。可先提交订单，客服将与你联系完成线下收款。'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Pay later / manual settlement — always available */}
                <button
                  onClick={submitManual}
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs uppercase tracking-wider py-3 rounded-xl disabled:opacity-60 cursor-pointer"
                >
                  <span>{currentLang === 'en' ? 'Place order — pay later' : '先提交订单（线下/转账支付）'}</span>
                </button>
                </>
                )}

              </div>
            )}

            {/* Shield disclaimer */}
            <div className="border-t border-slate-100 pt-3 text-center">
              <span className="text-[9px] font-bold text-slate-400 font-sans tracking-wide">
                🔐 AES-256 Bit Secure Payment Gateway Encryption Checked
              </span>
            </div>

          </div>
        </div>
      )}

    </div>
      )}
    </AnimatePresence>
  );
}
