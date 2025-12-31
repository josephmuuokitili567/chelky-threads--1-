import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Product } from '../types';
import { useAuth } from './AuthContext';

interface ProductContextType {
  products: Product[];
  isLoading: boolean;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (updatedProduct: Product) => Promise<void>;
  deleteProduct: (id: string | number) => Promise<void>;
  refreshProducts: () => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuth();

  // Map MongoDB _id to the app's id property
  const mapProduct = (p: any): Product => ({
    ...p,
    id: p._id || p.id
  });

  const refreshProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data.map(mapProduct));
      }
    } catch (e) {
      console.error("Failed to load products from server");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProducts();
  }, []);

  const addProduct = async (productData: Omit<Product, 'id'>) => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      });
      if (res.ok) await refreshProducts();
    } catch (e) {
      console.error("Add product failed", e);
    }
  };

  const updateProduct = async (updatedProduct: Product) => {
    try {
      const id = updatedProduct.id;
      const res = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedProduct)
      });
      if (res.ok) await refreshProducts();
    } catch (e) {
      console.error("Update product failed", e);
    }
  };

  const deleteProduct = async (id: string | number) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) await refreshProducts();
    } catch (e) {
      console.error("Delete product failed", e);
    }
  };

  const resetToDefaults = async () => {
    // In a live backend, we generally avoid destructive global resets
    console.warn("Global reset is disabled in production mode");
  };

  return (
    <ProductContext.Provider value={{ products, isLoading, addProduct, updateProduct, deleteProduct, refreshProducts, resetToDefaults }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) throw new Error('useProducts must be used within a ProductProvider');
  return context;
};