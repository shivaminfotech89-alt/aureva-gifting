import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { useCartStore } from '../../store/cartStore';
import { formatCurrency } from '../../lib/utils';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

export interface ProductData {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  gstPercent: number;
  stock: number;
  enabled: boolean;
  categoryId?: string;
  images: string[];
}

export function ProductCard({ product }: { product: ProductData }) {
  const addItem = useCartStore(state => state.addItem);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      productId: product.id,
      name: product.name,
      basePrice: product.basePrice,
      gstPercent: product.gstPercent,
      quantity: 1,
      image: product.images?.[0] || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=400'
    });
    toast.success(`${product.name} added to cart`);
  };

  return (
    <Link to={`/product/${product.id}`}>
      <Card className="group overflow-hidden rounded-xl border-border/50 hover:border-primary/50 transition-all duration-300">
        <div className="relative h-64 overflow-hidden bg-muted">
          <img 
            src={product.images?.[0] || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=400'} 
            alt={product.name} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
          />
          {product.stock <= 0 && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
              <span className="bg-destructive text-destructive-foreground px-4 py-1 font-bold tracking-wider uppercase text-sm">Out of Stock</span>
            </div>
          )}
        </div>
        <CardContent className="p-5">
          <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">{product.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1 mb-4 h-10">{product.description}</p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Excl. GST</p>
              <p className="font-bold text-xl text-foreground">{formatCurrency(product.basePrice)}</p>
            </div>
            <Button 
              size="icon" 
              variant="secondary"
              className="rounded-full shadow-sm"
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
