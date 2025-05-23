import React from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PenSquare, Trash2 } from "lucide-react";
import Image from 'next/image';

// Ürün kategorisi tipi
interface ProductCategory {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  parentId: string | null;
  _count: {
    products: number;
    children: number;
  };
}

// Ürün tipi
interface Product {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  quantity: number;
  price: number;
  sku: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  categoryId: string | null;
  category: ProductCategory | null;
}

interface ProductCardProps {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onEdit, onDelete }) => {
  const placeholderImage = 'https://via.placeholder.com/200x150?text=No+Image';
  
  // Fiyatı formatlı göster
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(price);
  };
  
  return (
    <Card className="overflow-hidden">
      <div className="relative h-40 bg-gray-100">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
            <span>Görsel Yok</span>
          </div>
        )}
        
        <div className="absolute top-2 right-2">
          <Badge variant={product.isActive ? "default" : "destructive"}>
            {product.isActive ? 'Aktif' : 'Pasif'}
          </Badge>
        </div>
        
        {product.category && (
          <div className="absolute bottom-2 left-2">
            <Badge variant="outline" className="bg-white/80">
              {product.category.name}
            </Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold mb-1 truncate" title={product.name}>
          {product.name}
        </h3>
        
        {product.description && (
          <p className="text-sm text-gray-500 line-clamp-2 h-10" title={product.description}>
            {product.description}
          </p>
        )}
        
        <div className="mt-3 flex justify-between items-center">
          <div>
            <p className="font-medium text-blue-600">
              {formatPrice(product.price)}
            </p>
            <p className="text-xs text-gray-500">
              Stok: {product.quantity}
            </p>
          </div>
          
          {product.sku && (
            <div className="text-xs text-gray-400">
              SKU: {product.sku}
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-2 bg-gray-50 flex justify-end space-x-2">
        <Button variant="ghost" size="icon" onClick={onEdit} title="Düzenle">
          <PenSquare className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDelete} title="Sil">
          <Trash2 className="w-4 h-4 text-red-500" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard; 