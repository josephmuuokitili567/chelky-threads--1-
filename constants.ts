import { BusinessInfo, Product } from './types';

export const BUSINESS_DETAILS: BusinessInfo = {
  name: "Chelky Threads",
  paybill: "6514541",
  email: "chelkythreads@gmail.com",
  phone: "+254 740 235 572",
  instagram: "@chelkythreads",
  tiktok: "@chelkythreads"
};

export const PRODUCTS: Product[] = [
  // Footwear
  {
    id: 1,
    name: "Nairobi Street High-Tops",
    category: "Footwear",
    price: 3500,
    image: "https://images.unsplash.com/photo-1607522370275-f14bc3a5d288?q=80&w=800&auto=format&fit=crop",
    description: "Urban style meets comfort. Perfect for the Nairobi hustle.",
    isFeatured: true
  },
  {
    id: 2,
    name: "Classic Leather Loafers",
    category: "Footwear",
    price: 4200,
    image: "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?q=80&w=800&auto=format&fit=crop",
    description: "Elegant brown leather loafers for the corporate professional.",
    isFeatured: true
  },
  {
    id: 3,
    name: "Weekend Canvas Sneakers",
    category: "Footwear",
    price: 2500,
    image: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=80&w=800&auto=format&fit=crop",
    description: "Lightweight and trendy, ideal for students and casual outings.",
  },
  {
    id: 4,
    name: "Executive Black Heels",
    category: "Footwear",
    price: 3800,
    image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=800&auto=format&fit=crop",
    description: "Command the room with these comfortable yet stylish heels.",
  },
  // Clothing
  {
    id: 5,
    name: "Signature Denim Jacket",
    category: "Clothing",
    price: 2800,
    image: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=800&auto=format&fit=crop",
    description: "A timeless piece that adds edge to any outfit.",
    isFeatured: true
  },
  {
    id: 6,
    name: "Urban Graphic Tee",
    category: "Clothing",
    price: 1500,
    image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=800&auto=format&fit=crop",
    description: "Express yourself with our limited edition graphic tees.",
  },
  {
    id: 7,
    name: "Smart Casual Chinos",
    category: "Clothing",
    price: 2200,
    image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?q=80&w=800&auto=format&fit=crop",
    description: "Versatile trousers suitable for office or evening wear.",
  },
  // Accessories
  {
    id: 8,
    name: "Minimalist Leather Belt",
    category: "Accessories",
    price: 1200,
    image: "https://images.unsplash.com/photo-1624222247344-550fb60583dc?q=80&w=800&auto=format&fit=crop",
    description: "Genuine leather belt to complete your formal look.",
  },
  {
    id: 9,
    name: "City Commuter Bag",
    category: "Accessories",
    price: 3000,
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=800&auto=format&fit=crop",
    description: "Stylish and functional bag for your daily essentials.",
  }
];