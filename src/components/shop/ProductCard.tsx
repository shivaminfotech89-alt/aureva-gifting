import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { formatCurrency } from '../../lib/utils';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart } from 'lucide-react';
import { toast } from 'sonner';

export interface ProductData {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  discountPercent?: number;
  gstPercent: number;
  stock: number;
  enabled: boolean;
  categoryId?: string;
  images: string[];
  smallLogoCharge?: number;
  mediumLogoCharge?: number;
  largeLogoCharge?: number;
  fullWrapCharge?: number;
}

export function ProductCard({ product }: { product: ProductData }) {
  const addItem = useCartStore(state => state.addItem);
  const { hasItem, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlistStore();
  
  const isWishlisted = hasItem(product.id);

  const discountedPrice = product.discountPercent 
    ? product.basePrice * (1 - product.discountPercent / 100) 
    : product.basePrice;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      productId: product.id,
      name: product.name,
      basePrice: discountedPrice,
      gstPercent: product.gstPercent,
      quantity: 1,
      image: product.images?.[0] || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=400'
    });
    toast.success(`${product.name} added to cart`);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isWishlisted) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product.id);
    }
  };

  return (
    <Link to={`/product/${product.id}`}>
      <Card className="group overflow-hidden rounded-[1.5rem] border-0 bg-white hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 relative h-full flex flex-col">
        <div className="relative h-72 md:h-80 overflow-hidden bg-slate-50 p-6 flex items-center justify-center">
          <img 
            src={product.images?.[0] || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=400'} 
            alt={product.name} 
            className="w-full h-full object-contain mix-blend-multiply transition-transform duration-700 ease-out group-hover:scale-110" 
          />
          {product.stock <= 0 && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-20">
              <span className="bg-slate-900 text-white px-6 py-2 font-bold tracking-widest uppercase text-xs rounded-full">Out of Stock</span>
            </div>
          )}
          {product.discountPercent && product.discountPercent > 0 && product.stock > 0 && (
            <div className="absolute top-4 right-4 bg-[#FFB347] text-white px-3 py-1 font-bold tracking-wider uppercase text-[10px] rounded-full shadow-lg z-10">
              {product.discountPercent}% OFF
            </div>
          )}
        </div>
        
        <button 
          onClick={handleToggleWishlist}
          className="absolute top-4 left-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white hover:bg-[#f9e596] text-slate-400 hover:text-slate-900 shadow-sm transition-all duration-300"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
        </button>

        <CardContent className="p-6 md:p-8 flex-1 flex flex-col bg-white">
          <h3 className="font-serif font-bold text-xl line-clamp-2 text-slate-900 group-hover:text-[#d4af37] transition-colors mb-2">{product.name}</h3>
          <p className="text-sm text-slate-500 line-clamp-2 mb-6 font-light h-10">{product.description}</p>
          
          <div className="mt-auto flex items-end justify-between border-t border-slate-100 pt-6">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#d4af37] font-bold mb-1">Corporate Price</p>
              {product.discountPercent && product.discountPercent > 0 ? (
                <div className="flex flex-col">
                  <p className="text-xs text-slate-400 line-through">{formatCurrency(product.basePrice)}</p>
                  <p className="font-bold text-xl md:text-2xl text-slate-900">{formatCurrency(discountedPrice)}</p>
                </div>
              ) : (
                <p className="font-bold text-xl md:text-2xl text-slate-900">{formatCurrency(product.basePrice)}</p>
              )}
            </div>
            <Button 
              size="icon" 
              className="rounded-full w-12 h-12 bg-slate-900 hover:bg-[#d4af37] text-white hover:text-slate-900 shadow-xl transition-all duration-300 group-hover:-translate-y-1"
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
            >
              <ShoppingCart className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
