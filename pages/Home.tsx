import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, ShieldCheck, Truck, ShoppingBag } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { useProducts } from '../context/ProductContext';
import ImageWithLoader from '../components/ImageWithLoader';

const Home: React.FC = () => {
  const { addToCart } = useShop();
  const { products } = useProducts();
  
  const featuredProducts = products.filter(p => p.isFeatured);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative h-[600px] w-full bg-slate-900 flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=1920&auto=format&fit=crop" 
            alt="Fashion Background" 
            className="w-full h-full object-cover opacity-60"
          />
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6 animate-fade-in-up">
            Where Style Meets <span className="text-brand-gold">Confidence</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-200 mb-8 font-light">
            Elegance, authenticity, and youth. Discover the look that defines you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/shop" 
              className="px-8 py-3 bg-brand-gold text-white font-semibold rounded-md hover:bg-yellow-600 transition-colors duration-300 shadow-lg"
            >
              Shop Collection
            </Link>
            <Link 
              to="/about" 
              className="px-8 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-md hover:bg-white hover:text-slate-900 transition-colors duration-300"
            >
              Our Story
            </Link>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-brand-light text-brand-gold mb-4">
                <Star className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Affordable Luxury</h3>
              <p className="text-slate-600 text-sm">Premium quality fashion that doesn't break the bank.</p>
            </div>
            <div className="p-6">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-brand-light text-brand-gold mb-4">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Trusted & Authentic</h3>
              <p className="text-slate-600 text-sm">Join our community of confident trendsetters.</p>
            </div>
            <div className="p-6">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-brand-light text-brand-gold mb-4">
                <Truck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Nationwide Delivery</h3>
              <p className="text-slate-600 text-sm">We deliver style directly to your doorstep.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-serif font-bold text-slate-900">Featured Collection</h2>
              <p className="text-slate-600 mt-2">Curated just for you</p>
            </div>
            <Link to="/shop" className="hidden sm:flex items-center text-brand-gold font-medium hover:text-brand-accent transition-colors">
              View all <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProducts.length > 0 ? (
              featuredProducts.map((product) => (
                <div key={product.id} className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
                  <div className="relative h-64 overflow-hidden">
                    <ImageWithLoader 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full transform group-hover:scale-105 transition-transform duration-500"
                    />
                    <button 
                      onClick={() => addToCart(product)}
                      className="absolute bottom-4 right-4 z-20 bg-white p-2 rounded-full shadow-lg text-slate-900 hover:text-brand-gold transform translate-y-12 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300"
                      title="Add to Cart"
                    >
                      <ShoppingBag className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-medium text-brand-gold uppercase tracking-wider mb-1">{product.category}</p>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">{product.name}</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-900 font-bold">KES {product.price.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-12 text-slate-500">
                <p>No featured products available at the moment.</p>
              </div>
            )}
          </div>
          
          <div className="mt-8 text-center sm:hidden">
            <Link to="/shop" className="inline-flex items-center text-brand-gold font-medium hover:text-brand-accent">
              View all products <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;