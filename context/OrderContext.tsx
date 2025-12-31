import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Order, OrderStatus } from '../types';
import { useAuth } from './AuthContext';

interface OrderContextType {
  orders: Order[];
  addOrder: (order: Order) => Promise<void>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
  updateOrderTracking: (id: string, trackingNumber: string) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  refreshOrders: () => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const { token, user } = useAuth();

  const refreshOrders = async () => {
    if (!token) return;
    const endpoint = ['admin', 'manager', 'support'].includes(user?.role || '') 
      ? '/api/orders/all' 
      : '/api/orders/my';
    
    try {
      const res = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setOrders(data);
    } catch (e) {
      console.error("Order fetch failed");
    }
  };

  useEffect(() => {
    refreshOrders();
  }, [token, user?.role]);

  const addOrder = async (order: Order) => {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(order)
    });
    if (res.ok) await refreshOrders();
  };

  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    const res = await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
    if (res.ok) await refreshOrders();
  };

  const updateOrderTracking = async (id: string, trackingNumber: string) => {
    const res = await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ trackingNumber })
    });
    if (res.ok) await refreshOrders();
  };

  const deleteOrder = async (id: string) => {
    // Note: server.js currently doesn't have a delete order route, 
    // but in a real app we'd add it or handle it as a cancel.
    console.warn("Delete order not yet implemented on server");
  };

  return (
    <OrderContext.Provider value={{ orders, addOrder, updateOrderStatus, updateOrderTracking, deleteOrder, refreshOrders }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) throw new Error('useOrders must be used within an OrderProvider');
  return context;
};