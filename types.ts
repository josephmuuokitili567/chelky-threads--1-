
export interface Product {
  id: number;
  name: string;
  category: 'Footwear' | 'Clothing' | 'Accessories';
  price: number; // In KES
  image: string;
  description: string;
  isFeatured?: boolean;
  stock?: number; // Inventory count
  averageRating?: number; // 1-5 stars
  reviewCount?: number; // Total reviews
}

export interface Review {
  id: string;
  productId: number;
  customerEmail: string;
  customerName: string;
  rating: number; // 1-5
  comment: string;
  date: string; // ISO String
  verified?: boolean; // Purchase verified
  paybill: string;
  email: string;
  phone: string;
  instagram: string;
  tiktok: string;
}

export interface PickupLocation {
  id: string;
  name: string; // e.g., "Sasa Mall - Nairobi CBD"
  region: string;
  price: number;
}

export type DeliveryMethod = 'delivery' | 'pickup_mtaani';

export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Completed' | 'Cancelled';

export interface Order {
  id: string;
  date: string; // ISO String
  customerName: string;
  customerEmail: string;
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  paymentMethod: 'M-Pesa Express' | 'Manual Paybill';
  deliveryMethod: string;
  status: OrderStatus;
  trackingNumber?: string;
}
