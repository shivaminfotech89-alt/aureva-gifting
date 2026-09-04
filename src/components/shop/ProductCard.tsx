import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { formatCurrency } from '../../lib/utils';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useSettingsStore } from '../../store/settingsStore';
import { openWhatsApp, productInquiryMessage } from '../../lib/whatsapp';
import { productImage, PRODUCT_IMAGE_PLACEHOLDER } from '../../lib/productImage';

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
  /** Dealer catalog code, e.g. "E 395". Used when reordering from the supplier. */
  sku?: string;
  /** Firestore Timestamp, or a number for locally-seeded data. Used to sort newest first. */
  createdAt?: any;
  images: string[];
  smallLogoCharge?: number;
  mediumLogoCharge?: number;
  largeLogoCharge?: number;
  fullWrapCharge?: number;
  nameEngravingCharge?: number;
  textPrintingCharge?: number;
  customMessageCharge?: number;
  minOrderQuantity?: number;
  availabilityStatus?: 'in_stock' | 'available_on_request' | 'bulk_only' | 'custom_production' | 'temporarily_unavailable';
  estimatedProcurementTime?: 'ready' | '2_3_days' | '5_7_days' | '7_10_days';
  supplierInfo?: {
    supplierName?: string;
    contact?: string;
    backupSupplier?: string;
    notes?: string;
    lastPrice?: number;
  };
}

export function ProductCard({ product }: { product: ProductData }) {
  const addItem = useCartStore(state => state.addItem);
  const { hasItem, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlistStore();
  const settings = useSettingsStore(state => state.settings);
  
  const isWishlisted = hasItem(product.id);

  const discountedPrice = product.discountPercent 
    ? product.basePrice * (1 - product.discountPercent / 100) 
    : product.basePrice;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: product.id,
      name: product.name,
      basePrice: discountedPrice,
      gstPercent: product.gstPercent,
      quantity: product.minOrderQuantity || 1,
      minOrderQuantity: product.minOrderQuantity || 1,
      image: productImage(product.images)
    });
    toast.success(`${product.name} added to cart`);
  };

  const handleWhatsAppInquiry = (e: React.MouseEvent) => {
    // The card is wrapped in a Link; without this the router navigates and the
    // popup is lost.
    e.preventDefault();
    e.stopPropagation();
    openWhatsApp(settings?.adminWhatsApp, productInquiryMessage({
      name: product.name,
      price: discountedPrice,
      minOrderQuantity: product.minOrderQuantity,
      path: `/product/${product.id}`,
    }));
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isWishlisted) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product.id);
    }
  };

  return (
    <Link to={`/product/${product.id}`} className="block h-full">
      <Card className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-none transition-shadow duration-300 hover:shadow-[0_8px_24px_-12px_rgba(15,23,42,0.18)]">
        <div className="relative flex h-44 items-center justify-center overflow-hidden bg-[#FAFAF8] p-4 md:h-52">
          <img
            src={productImage(product.images)}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain mix-blend-multiply transition-transform duration-500 ease-out group-hover:scale-[1.05]"
            onError={(e) => { (e.target as HTMLImageElement).src = PRODUCT_IMAGE_PLACEHOLDER; }}
          />

          {product.stock <= 0 && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
              <span className="rounded-full bg-[var(--navy-800)] px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                Out of stock
              </span>
            </div>
          )}

          {(product.discountPercent ?? 0) > 0 && product.stock > 0 && (
            <div className="absolute right-3 top-3 z-10 rounded-full bg-[var(--gold-500)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--navy-900)]">
              {product.discountPercent}% off
            </div>
          )}

          <button
            onClick={handleToggleWishlist}
            aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
            aria-pressed={isWishlisted}
            className="absolute left-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-400 shadow-sm transition-colors hover:text-[var(--navy-800)]"
          >
            <Heart className={`h-[15px] w-[15px] ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
          </button>
        </div>

        <CardContent className="flex flex-1 flex-col p-4">
          <h3 className="font-display line-clamp-2 text-[15px] leading-snug text-[var(--navy-800)] transition-colors group-hover:text-[var(--gold-600)]">
            {product.name}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-slate-500">{product.description}</p>

          <div className="mt-4 flex items-end justify-between border-t border-slate-100 pt-3.5">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--gold-600)]">Corporate price</p>
              {product.discountPercent && product.discountPercent > 0 ? (
                <div className="mt-0.5 flex items-baseline gap-2">
                  <p className="text-lg font-semibold text-[var(--navy-800)]">{formatCurrency(discountedPrice)}</p>
                  <p className="text-xs text-slate-400 line-through">{formatCurrency(product.basePrice)}</p>
                </div>
              ) : (
                <p className="mt-0.5 text-lg font-semibold text-[var(--navy-800)]">{formatCurrency(product.basePrice)}</p>
              )}
              {product.minOrderQuantity && product.minOrderQuantity > 1 && (
                <p className="mt-0.5 text-[11px] text-slate-400">Min. {product.minOrderQuantity} units</p>
              )}
            </div>
          </div>

          {/* Inquire without leaving the listing. Most corporate buyers want a
              conversation before a cart. */}
          <div className="mt-3.5 flex gap-2">
            <button
              onClick={handleWhatsAppInquiry}
              className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#25D366] px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#1eb457]"
            >
              <MessageCircle className="h-3.5 w-3.5" strokeWidth={2} />
              Inquire
            </button>
            <Button
              size="icon"
              aria-label={`Add ${product.name} to cart`}
              className="h-9 w-9 shrink-0 rounded-lg bg-[var(--navy-800)] text-white transition-colors hover:bg-[var(--gold-500)] hover:text-[var(--navy-900)] disabled:opacity-40"
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
