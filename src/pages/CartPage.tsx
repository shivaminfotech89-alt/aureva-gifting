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
      <div className="container mx-auto px-4 py-24 max-w-4xl text-center">
        <h1 className="text-3xl font-bold mb-6">Your Cart is Empty</h1>
        <p className="text-muted-foreground mb-8">Looks like you haven't added any premium gifts to your cart yet.</p>
        <Link to="/shop" className={buttonVariants({ size: "lg" })}>
          Explore Collections
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 md:px-8 max-w-7xl">
      <h1 className="text-3xl md:text-5xl font-bold font-sans tracking-tight mb-10 text-primary">Shopping Cart</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-6">
          {items.map(item => (
            <div key={item.productId} className="flex gap-6 p-4 sm:p-6 bg-card border border-border rounded-xl shadow-sm">
              <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-4">
                    <Link to={`/product/${item.productId}`} className="font-semibold text-lg hover:text-primary transition-colors line-clamp-2">{item.name}</Link>
                    <button onClick={() => removeItem(item.productId)} className="text-muted-foreground hover:text-destructive shrink-0">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Base: {formatCurrency(item.basePrice)}</p>
                  
                  {item.customization?.enabled && (
                     <div className="mt-2 p-3 bg-muted/40 rounded-lg border border-border/50 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded uppercase tracking-wider">Customized</span>
                        </div>
                        {item.customization.logoUrl && (
                           <div className="flex items-center gap-2">
                             <span className="text-xs text-muted-foreground w-16">Logo:</span>
                             <img src={item.customization.logoUrl} alt="Logo preview" className="h-6 object-contain bg-white rounded p-0.5 border" />
                           </div>
                        )}
                        {item.customization.customText && (
                           <div className="flex text-xs">
                             <span className="text-muted-foreground w-16">Name:</span>
                             <span className="font-medium">"{item.customization.customText}"</span>
                           </div>
                        )}
                        <div className="flex text-xs">
                          <span className="text-muted-foreground w-16">Charge:</span>
                          <span className="font-medium">{formatCurrency(item.customization.charge)}</span>
                        </div>
                     </div>
                  )}

                  <p className="text-sm text-muted-foreground mt-2">GST: {item.gstPercent}%</p>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-1 border border-border">
                    <button onClick={() => handleQuantity(item.productId, item.quantity, -1)} className="p-1 hover:text-primary"><Minus className="h-4 w-4" /></button>
                    <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                    <button onClick={() => handleQuantity(item.productId, item.quantity, 1)} className="p-1 hover:text-primary"><Plus className="h-4 w-4" /></button>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{formatCurrency(((item.basePrice + (item.customization?.charge || 0)) + calculateGST(item.basePrice + (item.customization?.charge || 0), item.gstPercent)) * item.quantity)}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-muted/30 p-8 rounded-xl border border-border h-fit sticky top-28">
          <h2 className="text-xl font-bold mb-6">Order Summary</h2>
          <div className="space-y-4 mb-6 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatCurrency(getSubTotal())}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">GST Estimate</span>
              <span className="font-medium">{formatCurrency(getGstTotal())}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery</span>
              <span className="font-medium text-primary">Calculated at checkout</span>
            </div>
          </div>
          
          <div className="border-t border-border pt-4 mb-8 flex justify-between items-end">
            <span className="font-bold text-lg">Total</span>
            <span className="font-bold text-3xl text-primary">{formatCurrency(getGrandTotal())}</span>
          </div>

          <Link to="/checkout" className={buttonVariants({ size: "lg", className: "w-full text-lg font-bold gap-2" })}>
            Proceed to Checkout <ArrowRight className="h-5 w-5" />
          </Link>
          <div className="mt-4 text-center">
             <p className="text-xs text-muted-foreground">Secure Encryption & 100% Buyer Protection</p>
          </div>
        </div>
      </div>
    </div>
  );
}
