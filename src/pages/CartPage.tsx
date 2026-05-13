import React from 'react';
import { useCartStore } from '../store/cartStore';
import { Button, buttonVariants } from '../components/ui/button';
import { formatCurrency, calculateGST } from '../lib/utils';
import { Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CartPage() {
  const { items, removeItem, updateQuantity, getSubTotal, getGstTotal, getGrandTotal } = useCartStore();

  const handleQuantity = (id: string, current: number, change: number) => {
    const next = current + change;
    if (next > 0) {
      updateQuantity(id, next);
    } else if (next === 0) {
      removeItem(id);
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-slate-50 min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="container mx-auto max-w-2xl text-center bg-white p-12 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
          <h1 className="text-4xl font-bold font-serif mb-4 text-[#0F172A]">Your Cart is Empty</h1>
          <p className="text-slate-500 mb-8 text-lg">Looks like you haven't added any premium gifts to your cart yet.</p>
          <Link to="/shop" className={buttonVariants({ size: "lg", className: "bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl h-14 px-8 font-bold text-lg shadow-sm" })}>
            Explore Collections
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-4rem)] py-12">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl">
        <h1 className="text-3xl md:text-5xl font-bold font-serif tracking-tight mb-10 text-[#0F172A]">Shopping Cart</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-6">
            {items.map(item => (
              <div key={item.productId} className="flex gap-6 p-5 sm:p-6 bg-white border border-slate-200 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="h-28 w-28 sm:h-36 sm:w-36 rounded-2xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-4">
                      <Link to={`/product/${item.productId}`} className="font-bold font-serif text-xl text-[#0F172A] hover:text-[#d4af37] transition-colors line-clamp-2">{item.name}</Link>
                      <button onClick={() => removeItem(item.productId)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl shrink-0 transition-all border border-transparent hover:border-red-100">
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                    <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider text-[11px]">Base: {formatCurrency(item.basePrice)}</p>
                    
                    {item.customization?.enabled && (
                       <div className="mt-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold bg-[#d4af37]/10 border border-[#d4af37]/20 text-[#0F172A] px-2.5 py-1 rounded-md uppercase tracking-widest">Customized</span>
                          </div>
                        {item.customization.logoUrl && (
                           <div className="flex items-center gap-3">
                             <span className="text-xs font-bold text-slate-500 w-16">Logo:</span>
                             <img src={item.customization.logoUrl} alt="Logo preview" className="h-8 w-8 object-contain bg-white rounded-lg p-1 border shadow-sm" />
                             {item.customization.logoSize && <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">({item.customization.logoSize})</span>}
                           </div>
                        )}
                        {item.customization.customText && (
                           <div className="flex text-xs items-center">
                             <span className="font-bold text-slate-500 w-16">Name:</span>
                             <span className="font-bold text-[#0F172A]">"{item.customization.customText}"</span>
                           </div>
                        )}
                        <div className="flex text-xs items-center">
                          <span className="font-bold text-slate-500 w-16">Charge:</span>
                          <span className="font-bold text-[#d4af37]">{formatCurrency(item.customization.charge)}</span>
                        </div>
                     </div>
                  )}

                  <p className="text-[11px] font-bold text-slate-500 mt-3 uppercase tracking-wider">GST: {item.gstPercent}%</p>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-1 border border-slate-200 shadow-inner">
                    <button onClick={() => handleQuantity(item.productId, item.quantity, -1)} className="p-1.5 hover:bg-white hover:text-[#0F172A] rounded-lg text-slate-500 transition-colors shadow-sm"><Minus className="h-4 w-4" /></button>
                    <span className="w-8 text-center font-bold text-[#0F172A] text-sm">{item.quantity}</span>
                    <button onClick={() => handleQuantity(item.productId, item.quantity, 1)} className="p-1.5 hover:bg-white hover:text-[#0F172A] rounded-lg text-slate-500 transition-colors shadow-sm"><Plus className="h-4 w-4" /></button>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-2xl text-[#0F172A]">{formatCurrency(((item.basePrice + (item.customization?.charge || 0)) + calculateGST(item.basePrice + (item.customization?.charge || 0), item.gstPercent)) * item.quantity)}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-fit sticky top-28">
          <h2 className="text-2xl font-bold font-serif mb-6 text-[#0F172A]">Order Summary</h2>
          <div className="space-y-4 mb-8 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[11px]">Subtotal</span>
              <span className="font-bold text-[#0F172A] text-base">{formatCurrency(getSubTotal())}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[11px]">GST Estimate</span>
              <span className="font-bold text-[#0F172A] text-base">{formatCurrency(getGstTotal())}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[11px]">Delivery</span>
              <span className="font-bold text-[#d4af37] text-[11px] uppercase tracking-wider">Calculated at checkout</span>
            </div>
          </div>
          
          <div className="border-t border-slate-200 pt-6 mb-8 flex justify-between items-end">
            <span className="font-bold text-slate-500 uppercase tracking-widest text-xs">Total</span>
            <span className="font-bold font-serif text-4xl text-[#0F172A]">{formatCurrency(getGrandTotal())}</span>
          </div>

          <Link to="/checkout" className={buttonVariants({ size: "lg", className: "w-full text-base font-bold gap-2 bg-[#d4af37] hover:bg-[#F4C542] text-[#0F172A] rounded-xl h-14 shadow-sm transition-all" })}>
            Proceed to Checkout <ArrowRight className="h-5 w-5" />
          </Link>
          <div className="mt-6 text-center">
             <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Secure Encryption & 100% Buyer Protection</p>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
