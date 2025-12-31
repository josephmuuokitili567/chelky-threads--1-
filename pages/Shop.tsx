import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { useProducts } from '../context/ProductContext';
import { ShoppingBag, Filter, Search, X, ChevronDown, Star } from 'lucide-react';
import ImageWithLoader from '../components/ImageWithLoader';
import ReviewComponent from '../components/ReviewComponent';

const Shop: React.FC = () => {
  const { addToCart } = useShop();
  const { products } = useProducts();
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const categories = ['All', 'Footwear', 'Clothing', 'Accessories'];

  // Search and filter products
  const filteredProducts = products.filter(p => {
    // Category filter
    if (activeCategory !== 'All' && p.category !== activeCategory) return false;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!p.name.toLowerCase().includes(query) && !p.description?.toLowerCase().includes(query)) {
        return false;
      }
    }
    
    // Price filter
    if (minPrice && p.price < parseFloat(minPrice)) return false;
    if (maxPrice && p.price > parseFloat(maxPrice)) return false;
    
    return true;
  }).sort((a, b) => {
    switch(sortBy) {
      case 'price-asc': return a.price - b.price;
      case 'price-desc': return b.price - a.price;
      case 'rating': return (b.averageRating ?? 0) - (a.averageRating ?? 0);
      default: return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
    }
  });

  const handleReset = () => {
    setSearchQuery('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('featured');
    setActiveCategory('All');
  };

  if (selectedProduct) {
    return (
      <div className="bg-slate-50 min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button 
            onClick={() => setSelectedProduct(null)}
            className="mb-6 text-brand-gold hover:text-yellow-600 font-bold flex items-center gap-2"
          >
            <X className="h-4 w-4" /> Back to Shop
          </button>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
            {/* Product Image */}
            <div className="bg-white rounded-lg overflow-hidden shadow-lg">
              <ImageWithLoader 
                src={selectedProduct.image}
                alt={selectedProduct.name}
                className="w-full h-96 object-cover"
              />
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <p className="text-brand-gold font-bold text-sm uppercase mb-2">{selectedProduct.category}</p>
                <h1 className="text-4xl font-bold text-slate-900 mb-4">{selectedProduct.name}</h1>
                
                {/* Rating */}
                {selectedProduct.averageRating > 0 && (
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star 
                          key={star}
                          className={`h-4 w-4 ${star <= Math.round(selectedProduct.averageRating) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-slate-600">({selectedProduct.reviewCount} reviews)</span>
                  </div>
                )}
              </div>

              <p className="text-slate-600 text-lg">{selectedProduct.description}</p>

              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-slate-900">KES {selectedProduct.price.toLocaleString()}</span>
              </div>

              {/* Stock Status */}
              <div className={`inline-block px-4 py-2 rounded-lg font-bold ${
                (selectedProduct.stock ?? 0) > 0 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {(selectedProduct.stock ?? 0) > 0 ? `${selectedProduct.stock} in stock` : 'Out of stock'}
              </div>

              <button 
                onClick={() => {
                  addToCart(selectedProduct);
                  setSelectedProduct(null);
                }}
                disabled={(selectedProduct.stock ?? 0) === 0}
                className="w-full bg-brand-gold hover:bg-yellow-600 disabled:bg-slate-300 text-white font-bold py-4 rounded-lg transition-colors text-lg flex items-center justify-center gap-2"
              >
                <ShoppingBag className="h-5 w-5" />
                Add to Cart
              </button>
            </div>
          </div>

          {/* Reviews Section */}
          <ReviewComponent productId={selectedProduct.id} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif font-bold text-slate-900 mb-4">Our Collection</h1>
          <p className="text-slate-600 max-w-2xl mx-auto">Explore our diverse range of products designed to give you that confident, stylish edge.</p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Filter Toggle and Sort */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100"
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-gold outline-none"
            aria-label="Sort products"
          >
            <option value="featured">Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>

          {(searchQuery || activeCategory !== 'All' || minPrice || maxPrice) && (
            <button
              onClick={handleReset}
              className="text-sm text-brand-gold hover:text-yellow-600 font-bold"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div className="bg-white p-6 rounded-lg shadow mb-8 border border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Category Filter */}
              <div>
                <h3 className="font-bold text-slate-900 mb-3">Category</h3>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`block w-full text-left px-3 py-2 rounded transition-colors ${
                        activeCategory === cat
                          ? 'bg-brand-gold text-white'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="font-bold text-slate-900 mb-3">Price Range</h3>
                <div className="space-y-3">
                  <input
                    type="number"
                    placeholder="Min Price"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-brand-gold outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Max Price"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-brand-gold outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => setSelectedProduct(product)}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden flex flex-col cursor-pointer"
            >
              <div className="relative h-64 overflow-hidden bg-slate-100">
                <ImageWithLoader 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full hover:scale-105 transition-transform duration-500 object-cover"
                />
                {product.isFeatured && (
                  <div className="absolute top-2 right-2 bg-brand-gold text-white text-xs font-bold px-3 py-1 rounded-full">
                    Featured
                  </div>
                )}
              </div>
              <div className="p-4 flex-grow flex flex-col justify-between">
                <div>
                  <p className="text-xs text-brand-gold font-medium uppercase mb-1">{product.category}</p>
                  <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2">{product.name}</h3>
                  
                  {/* Rating */}
                  {product.averageRating > 0 && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            className={`h-3 w-3 ${star <= Math.round(product.averageRating!) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-slate-500">({product.reviewCount})</span>
                    </div>
                  )}
                  
                  <p className="text-xs text-slate-500 mb-4 line-clamp-2">{product.description}</p>
                </div>
                <div className="space-y-3">
                  {/* Stock Status */}
                  <div className={`text-xs font-bold px-2 py-1 rounded inline-block ${
                    (product.stock ?? 0) > 0
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {(product.stock ?? 0) > 0 ? `${product.stock} left` : 'Out of stock'}
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="font-bold text-slate-900">KES {product.price.toLocaleString()}</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      disabled={(product.stock ?? 0) === 0}
                      className="p-2 bg-slate-100 hover:bg-brand-gold disabled:bg-slate-200 rounded-full text-slate-900 hover:text-white disabled:text-slate-400 transition-colors"
                      aria-label="Add to cart"
                    >
                      <ShoppingBag className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <Filter className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No products found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;