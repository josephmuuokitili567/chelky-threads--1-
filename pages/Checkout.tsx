import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import { BUSINESS_DETAILS } from '../constants';
import { pickupService } from '../services/pickupService';
import { DeliveryMethod, PickupLocation, Order } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, CheckCircle, Smartphone, AlertCircle, Copy, Check, Loader2, Zap, FileText, ArrowRight, Truck, MapPin, Search, RefreshCw } from 'lucide-react';

const Checkout: React.FC = () => {
  const { cart, removeFromCart, updateQuantity, cartTotal, clearCart } = useShop();
  const { user } = useAuth();
  const { addOrder } = useOrders();
  const navigate = useNavigate();
  const [step, setStep] = useState<'cart' | 'payment' | 'success'>('cart');
  
  // Delivery State
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('delivery');
  const [selectedLocation, setSelectedLocation] = useState<PickupLocation | null>(null);
  const [locationSearch, setLocationSearch] = useState('');
  const [isSearchingLocations, setIsSearchingLocations] = useState(false);
  const [availableLocations, setAvailableLocations] = useState<PickupLocation[]>([]);
  const [shippingCost, setShippingCost] = useState(300); // Default standard delivery
  
  // Payment Method State
  const [paymentMethod, setPaymentMethod] = useState<'express' | 'manual'>('express');
  
  // Manual Payment State
  const [mpesaCode, setMpesaCode] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  
  // Express Payment State
  const [expressPhone, setExpressPhone] = useState('');
  const [expressStatus, setExpressStatus] = useState<'idle' | 'sending' | 'confirming' | 'verifying'>('idle');
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const [paymentPollInterval, setPaymentPollInterval] = useState<NodeJS.Timeout | null>(null);
  
  // General State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Derived State
  const grandTotal = cartTotal + shippingCost;

  // Initialize Search when Method Changes
  useEffect(() => {
    const fetchInitialAgents = async () => {
        if (deliveryMethod === 'pickup_mtaani') {
            setIsSearchingLocations(true);
            try {
                const agents = await pickupService.getAgents();
                setAvailableLocations(agents);
            } catch (err) {
                console.error("Failed to load pick-up agents", err);
                setError("Failed to load Pick-Up Mtaani locations. Please check your connection.");
            } finally {
                setIsSearchingLocations(false);
            }
        } else {
            setShippingCost(300); // Reset to Standard Delivery
            setSelectedLocation(null);
        }
    };

    fetchInitialAgents();
  }, [deliveryMethod]);

  // Handle Real-time API Search
  useEffect(() => {
    if (deliveryMethod !== 'pickup_mtaani') return;

    const delaySearch = setTimeout(async () => {
        setIsSearchingLocations(true);
        try {
            const results = await pickupService.searchAgents(locationSearch);
            setAvailableLocations(results);
        } catch (err) {
            console.error("Search failed", err);
        } finally {
            setIsSearchingLocations(false);
        }
    }, 500); // 500ms Debounce

    return () => clearTimeout(delaySearch);
  }, [locationSearch, deliveryMethod]);

  // Redirect if cart is empty
  useEffect(() => {
    if (cart.length === 0 && step === 'cart') {
      navigate('/shop');
    }
  }, [cart, step, navigate]);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setStep('payment');
    window.scrollTo(0, 0);
  };

  const selectLocation = (loc: PickupLocation) => {
    setSelectedLocation(loc);
    setShippingCost(loc.price);
  };

  const copyPaybill = async () => {
    if (!navigator.clipboard) {
      setError('Clipboard not supported. Please copy manually.');
      return;
    }
    try {
      await navigator.clipboard.writeText(BUSINESS_DETAILS.paybill);
      setCopied(true);
      setError('');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      setError('Failed to copy paybill number. Please copy it manually.');
    }
  };

  const createOrderRecord = (pm: 'M-Pesa Express' | 'Manual Paybill') => {
    if (!user) return;

    const newOrder: Order = {
        id: `ORD-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString(),
        customerName: user.name || 'Guest',
        customerEmail: user.email,
        items: [...cart],
        subtotal: cartTotal,
        shippingFee: shippingCost,
        totalAmount: grandTotal,
        paymentMethod: pm,
        deliveryMethod: deliveryMethod === 'pickup_mtaani' && selectedLocation 
            ? `Pick-Up: ${selectedLocation.name}` 
            : 'Standard Delivery',
        status: 'Processing'
    };

    addOrder(newOrder);
  };

  const handleManualPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (deliveryMethod === 'pickup_mtaani' && !selectedLocation) {
        setError('Please select a Pick-Up Mtaani location.');
        return;
    }

    if (manualPhone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid phone number (e.g., 0712345678).');
      return;
    }
    if (mpesaCode.length < 10) {
      setError('Please enter a valid M-PESA transaction code (10 characters).');
      return;
    }

    setIsLoading(true);
    // Simulate API verification
    setTimeout(() => {
      setIsLoading(false);
      createOrderRecord('Manual Paybill');
      setStep('success');
      clearCart();
      window.scrollTo(0, 0);
    }, 2500);
  };

  const handleExpressPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (deliveryMethod === 'pickup_mtaani' && !selectedLocation) {
        setError('Please select a Pick-Up Mtaani location.');
        return;
    }

    const cleanPhone = expressPhone.replace(/\D/g, '');
    // Allow 9 digits (712...) or 10 digits (0712...) or 12 digits (254...)
    if (cleanPhone.length < 9 || cleanPhone.length > 12) {
      setError('Please enter a valid M-Pesa phone number.');
      return;
    }

    setExpressStatus('sending');
    setIsLoading(true);
    
    try {
      // Create order first
      const orderId = `ORD-${Date.now().toString().slice(-6)}`;
      
      // Initiate STK Push
      const response = await fetch('/api/payments/initiate-stk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('chelky_token')}`
        },
        body: JSON.stringify({
          phoneNumber: expressPhone,
          amount: grandTotal,
          orderId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initiate payment');
      }

      const data = await response.json();
      setCheckoutRequestId(data.checkoutRequestId);
      setExpressStatus('confirming');
      
      // Create order record
      createOrderRecord('M-Pesa Express');

      // Poll for payment status every 2 seconds for up to 2 minutes
      let pollCount = 0;
      const pollInterval = setInterval(async () => {
        pollCount++;
        
        try {
          const statusResponse = await fetch('/api/payments/query-status', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('chelky_token')}`
            },
            body: JSON.stringify({
              checkoutRequestId: data.checkoutRequestId
            })
          });

          const statusData = await statusResponse.json();

          if (statusData.success) {
            clearInterval(pollInterval);
            setPaymentPollInterval(null);
            setExpressStatus('idle');
            setIsLoading(false);
            setStep('success');
            clearCart();
            window.scrollTo(0, 0);
          } else if (pollCount >= 60) { // 2 minutes
            clearInterval(pollInterval);
            setPaymentPollInterval(null);
            setExpressStatus('idle');
            setIsLoading(false);
            setError('Payment timeout. Please try again or use manual paybill.');
          }
        } catch (err) {
          console.error('Payment status check error:', err);
        }
      }, 2000);

      setPaymentPollInterval(pollInterval);
    } catch (err: any) {
      setIsLoading(false);
      setExpressStatus('idle');
      setError(err.message || 'Failed to initiate payment. Please try again.');
    }
  };

  const retryExpress = () => {
    setExpressStatus('idle');
    setError('');
    setCheckoutRequestId(null);
    if (paymentPollInterval) {
      clearInterval(paymentPollInterval);
      setPaymentPollInterval(null);
    }
  };

  if (cart.length === 0 && step === 'cart') {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {step === 'cart' && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h1 className="text-2xl font-serif font-bold text-slate-900">Shopping Cart</h1>
              <span className="text-sm text-slate-500">{cart.length} items</span>
            </div>
            <div className="p-6">
              {cart.map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row items-center justify-between py-6 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors rounded-lg px-2">
                  <div className="flex items-center w-full sm:w-auto mb-4 sm:mb-0">
                    <img src={item.image} alt={item.name} className="h-24 w-24 object-cover rounded-md shadow-sm" />
                    <div className="ml-4">
                      <h3 className="font-semibold text-slate-900 text-lg">{item.name}</h3>
                      <p className="text-sm text-slate-500 mb-1">{item.category}</p>
                      <p className="text-brand-gold font-bold sm:hidden">KES {item.price.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between w-full sm:w-auto gap-8">
                    <div className="flex items-center border border-slate-200 rounded-md bg-white">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="px-4 text-sm font-medium text-slate-900 w-8 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="hidden sm:block text-right w-32">
                      <p className="font-bold text-slate-900">KES {(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                    
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-400 hover:text-red-600 p-2 transition-colors rounded-full hover:bg-red-50"
                      title="Remove Item"
                      aria-label="Remove item from cart"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-slate-50 p-6">
              <div className="flex justify-between items-center text-xl font-bold text-slate-900 mb-6">
                <span>Subtotal</span>
                <span>KES {cartTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-end">
                <button 
                  onClick={handleCheckout}
                  className="w-full sm:w-auto px-8 py-4 bg-brand-dark text-white font-bold rounded-md hover:bg-slate-800 transition-colors shadow-lg flex items-center justify-center"
                >
                   Proceed to Checkout
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'payment' && (
          <div className="animate-fade-in-up">
            <h2 className="text-2xl font-serif font-bold text-slate-900 mb-6">Checkout & Payment</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Delivery & Payment */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* 1. Delivery Method Section */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                        <Truck className="w-5 h-5 mr-2 text-brand-gold" />
                        Delivery Method
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <button
                            onClick={() => setDeliveryMethod('delivery')}
                            className={`p-4 rounded-lg border-2 text-left transition-all ${
                                deliveryMethod === 'delivery' 
                                ? 'border-brand-gold bg-brand-light' 
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                        >
                            <div className="font-bold text-slate-900">Standard Delivery</div>
                            <div className="text-sm text-slate-500">Doorstep delivery within Nairobi</div>
                            <div className="text-brand-gold font-bold mt-2">KES 300</div>
                        </button>

                        <button
                            onClick={() => setDeliveryMethod('pickup_mtaani')}
                            className={`p-4 rounded-lg border-2 text-left transition-all ${
                                deliveryMethod === 'pickup_mtaani' 
                                ? 'border-brand-gold bg-brand-light' 
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                        >
                            <div className="font-bold text-slate-900 flex justify-between">
                                Pick-Up Mtaani
                                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded">API</span>
                            </div>
                            <div className="text-sm text-slate-500">Collect from nearest agent</div>
                            <div className="text-brand-gold font-bold mt-2">From KES 120</div>
                        </button>
                    </div>

                    {/* Pick-Up Mtaani Logic */}
                    {deliveryMethod === 'pickup_mtaani' && (
                        <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200 animate-fade-in-up">
                            <h4 className="text-sm font-semibold text-slate-900 mb-3">Select Pick-Up Agent</h4>
                            
                            {selectedLocation ? (
                                <div className="flex justify-between items-center bg-white p-3 rounded border border-green-200 shadow-sm">
                                    <div>
                                        <div className="flex items-center">
                                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                            <p className="font-bold text-slate-800">{selectedLocation.name}</p>
                                        </div>
                                        <p className="text-xs text-slate-500 ml-6">{selectedLocation.region}</p>
                                    </div>
                                    <div className="flex items-center flex-col sm:flex-row gap-2">
                                        <span className="font-bold text-slate-900">KES {selectedLocation.price}</span>
                                        <button 
                                            onClick={() => { setSelectedLocation(null); setLocationSearch(''); }}
                                            className="text-xs text-brand-dark underline hover:text-brand-gold"
                                        >
                                            Change
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search location (e.g. CBD, Roysambu)..."
                                            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none transition-shadow"
                                            value={locationSearch}
                                            onChange={(e) => setLocationSearch(e.target.value)}
                                        />
                                        <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                                        {isSearchingLocations && (
                                            <div className="absolute right-3 top-3.5">
                                                <Loader2 className="h-4 w-4 animate-spin text-brand-gold" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-2 max-h-48 overflow-y-auto border border-slate-100 rounded-md bg-white shadow-inner">
                                        {!isSearchingLocations && availableLocations.map(loc => (
                                            <button
                                                key={loc.id}
                                                onClick={() => selectLocation(loc)}
                                                className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 flex justify-between items-center transition-colors group"
                                            >
                                                <div>
                                                    <p className="text-sm font-medium text-slate-800 group-hover:text-brand-gold transition-colors">{loc.name}</p>
                                                    <p className="text-xs text-slate-500">{loc.region}</p>
                                                </div>
                                                <span className="text-sm font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">KES {loc.price}</span>
                                            </button>
                                        ))}
                                        {!isSearchingLocations && availableLocations.length === 0 && (
                                            <div className="p-6 text-center text-sm text-slate-500">
                                                No agents found matching "{locationSearch}".
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 2. Payment Section */}
                <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                        <Zap className="w-5 h-5 mr-2 text-brand-gold" />
                        Payment Method
                    </h3>
                    
                    {/* Method Tabs */}
                    <div className="flex space-x-4 border-b border-slate-200 mb-6">
                    <button 
                        onClick={() => { setPaymentMethod('express'); setError(''); }}
                        className={`pb-4 px-2 text-sm font-bold flex items-center transition-colors border-b-2 ${paymentMethod === 'express' ? 'border-brand-gold text-brand-dark' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        M-Pesa Express (Auto)
                    </button>
                    <button 
                        onClick={() => { setPaymentMethod('manual'); setError(''); }}
                        className={`pb-4 px-2 text-sm font-bold flex items-center transition-colors border-b-2 ${paymentMethod === 'manual' ? 'border-brand-gold text-brand-dark' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        Manual Paybill
                    </button>
                    </div>

                    {/* Express Payment View */}
                    {paymentMethod === 'express' && (
                    <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
                        <div className="flex items-center mb-6">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mr-4">
                            <Smartphone className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Direct Payment</h3>
                            <p className="text-sm text-slate-500">We'll send a payment prompt to your phone.</p>
                        </div>
                        </div>

                        {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-6 flex items-start text-sm" role="alert">
                            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                            {error}
                        </div>
                        )}

                        {expressStatus === 'confirming' ? (
                        <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-100 animate-pulse">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-gold/10 text-brand-gold mb-4">
                            <Smartphone className="h-8 w-8 animate-bounce" />
                            </div>
                            <h4 className="text-xl font-bold text-slate-900 mb-2">Check your phone</h4>
                            <p className="text-slate-600 mb-2">A request has been sent to <strong>+254 {expressPhone.replace(/^0+/, '')}</strong></p>
                            <p className="text-sm text-slate-400">Enter your M-PESA PIN to complete the payment.</p>
                            <div className="mt-6 flex flex-col items-center">
                              <div className="flex items-center text-sm text-slate-500 mb-4">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Waiting for confirmation...
                              </div>
                              <button 
                                onClick={retryExpress}
                                className="text-xs text-red-500 hover:text-red-700 underline flex items-center"
                              >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Didn't receive prompt? Retry
                              </button>
                            </div>
                        </div>
                        ) : (
                        <form onSubmit={handleExpressPayment} className="space-y-6">
                            <div>
                            <label htmlFor="express-phone" className="block text-sm font-medium text-slate-700 mb-1">M-Pesa Phone Number</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 font-medium">+254</span>
                                <input 
                                type="tel" 
                                id="express-phone"
                                value={expressPhone}
                                onChange={(e) => setExpressPhone(e.target.value)}
                                placeholder="712 345 678"
                                className="w-full pl-16 pr-4 py-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none transition-all font-medium text-lg"
                                aria-required="true"
                                />
                            </div>
                            <p className="text-xs text-slate-400 mt-2">Enter the number you want to pay with.</p>
                            </div>

                            <button 
                            type="submit" 
                            disabled={expressStatus === 'sending'}
                            className="w-full flex justify-center items-center px-4 py-4 border border-transparent text-base font-bold rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                            >
                            {expressStatus === 'sending' ? (
                                <>
                                <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                                Sending Prompt...
                                </>
                            ) : (
                                <>
                                Send M-Pesa Prompt
                                <span className="ml-2 text-green-100 font-normal text-sm">(KES {grandTotal.toLocaleString()})</span>
                                <ArrowRight className="ml-2 h-5 w-5" />
                                </>
                            )}
                            </button>
                        </form>
                        )}
                    </div>
                    )}

                    {/* Manual Payment View */}
                    {paymentMethod === 'manual' && (
                    <div className="space-y-6">
                        {/* Instructions */}
                        <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-slate-300">
                        <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 mb-6 relative group text-center">
                            <p className="text-slate-500 font-medium mb-1 text-xs uppercase">Paybill Number</p>
                            <div className="flex items-center justify-center gap-3">
                            <p className="text-3xl font-bold text-slate-900 tracking-wider">{BUSINESS_DETAILS.paybill}</p>
                            <button 
                                onClick={copyPaybill}
                                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                                title="Copy Paybill"
                                aria-label="Copy Paybill Number"
                            >
                                {copied ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5" />}
                            </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="font-semibold text-slate-900 text-sm">Steps:</h3>
                            <ol className="space-y-2 text-slate-600 text-sm list-decimal list-inside">
                            <li>Go to <strong>M-PESA</strong> &gt; <strong>Lipa na M-PESA</strong> &gt; <strong>Paybill</strong>.</li>
                            <li>Business No: <strong>{BUSINESS_DETAILS.paybill}</strong>.</li>
                            <li>Account No: <strong>Your Name</strong>.</li>
                            <li>Amount: <strong>KES {grandTotal.toLocaleString()}</strong>.</li>
                            <li>Enter PIN and Send.</li>
                            </ol>
                        </div>
                        </div>

                        {/* Form */}
                        <div className="bg-white rounded-lg shadow-lg p-6">
                        <h3 className="font-bold text-slate-900 mb-4">Confirm Transaction</h3>
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 flex items-start text-sm" role="alert">
                            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                            {error}
                            </div>
                        )}
                        <form onSubmit={handleManualPayment} className="space-y-4">
                            <div>
                            <label htmlFor="manual-phone" className="block text-sm font-medium text-slate-700 mb-1">Phone Number Used</label>
                            <input 
                                type="tel" 
                                id="manual-phone"
                                value={manualPhone}
                                onChange={(e) => setManualPhone(e.target.value)}
                                placeholder="e.g. 0712345678"
                                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-gold outline-none"
                                aria-required="true"
                            />
                            </div>
                            <div>
                            <label htmlFor="code" className="block text-sm font-medium text-slate-700 mb-1">M-Pesa Transaction Code</label>
                            <input 
                                type="text" 
                                id="code"
                                value={mpesaCode}
                                onChange={(e) => setMpesaCode(e.target.value.toUpperCase())}
                                placeholder="e.g. QWE123RTY4"
                                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-gold outline-none uppercase font-mono"
                                maxLength={10}
                                aria-required="true"
                            />
                            </div>
                            <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full px-4 py-3 bg-slate-900 text-white font-bold rounded-md hover:bg-slate-800 transition-colors disabled:opacity-70"
                            >
                            {isLoading ? "Verifying..." : "Verify & Complete"}
                            </button>
                        </form>
                        </div>
                    </div>
                    )}
                    
                    <button 
                    onClick={() => setStep('cart')}
                    className="w-full text-center text-sm text-slate-500 hover:text-slate-800 py-2"
                    >
                    Back to Cart
                    </button>
                </div>
              </div>

              {/* Order Summary - Right Column */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-lg p-6 sticky top-24">
                  <h3 className="text-lg font-serif font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Order Summary</h3>
                  <div className="space-y-4 mb-6">
                    {cart.map(item => (
                      <div key={item.id} className="flex justify-between items-start text-sm">
                        <div className="flex-1 pr-4">
                           <span className="text-slate-500">{item.quantity}x</span> <span className="text-slate-800 font-medium">{item.name}</span>
                        </div>
                        <span className="text-slate-600 whitespace-nowrap">{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t border-slate-100 pt-4 space-y-2">
                    <div className="flex justify-between text-slate-500 text-sm">
                        <span>Subtotal</span>
                        <span>KES {cartTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-sm">
                        <span>Shipping</span>
                        <span>KES {shippingCost.toLocaleString()}</span>
                    </div>
                    {deliveryMethod === 'pickup_mtaani' && selectedLocation && (
                        <div className="text-xs text-brand-gold text-right italic">
                            via {selectedLocation.name}
                        </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-lg font-bold text-slate-900 pt-4 border-t border-slate-100 mt-2">
                    <span>Total</span>
                    <span>KES {grandTotal.toLocaleString()}</span>
                  </div>
                  <div className="mt-6 flex items-center justify-center text-xs text-slate-400 bg-slate-50 p-3 rounded">
                    <CheckCircle className="h-3 w-3 mr-1 text-green-500" /> Secure SSL Encryption
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="bg-white rounded-lg shadow-xl p-12 text-center max-w-2xl mx-auto animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 text-green-600 mb-8 animate-bounce">
              <CheckCircle className="h-12 w-12" />
            </div>
            <h2 className="text-4xl font-serif font-bold text-slate-900 mb-4">Payment Confirmed!</h2>
            <p className="text-xl text-slate-700 mb-2">Thank you for your order.</p>
            <p className="text-slate-500 mb-10 leading-relaxed">
              We have received your payment for <strong>KES {grandTotal.toLocaleString()}</strong>. 
              <br/>
              {selectedLocation ? (
                 <span>Your items will be shipped to <strong>{selectedLocation.name}</strong> via Pick-Up Mtaani.</span>
              ) : (
                 <span>Your items will be delivered to your doorstep.</span>
              )}
              <br/>
              A receipt and tracking details have been sent to <strong>{BUSINESS_DETAILS.email}</strong>.
            </p>
            
            <div className="space-y-4">
              <Link to="/" className="inline-block w-full sm:w-auto px-10 py-4 bg-brand-dark text-white font-bold rounded-md hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl">
                Continue Shopping
              </Link>
              <div className="block mt-4">
                 <Link to="/contact" className="text-brand-gold hover:underline text-sm">Need help? Contact Support</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;