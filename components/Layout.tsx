import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Menu, X, Instagram, Mail, MessageCircle, Lock, LogOut, User, ListChecks, ShieldCheck } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { BUSINESS_DETAILS } from '../constants';
import VoiceStylist from './VoiceStylist';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { cartCount } = useShop();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const isActive = (path: string) => location.pathname === path ? 'text-brand-gold font-bold' : 'text-slate-600 hover:text-brand-dark';

  const handleLogout = () => {
    logout();
    navigate('/login');
    closeMenu();
  };

  const isPrivilegedUser = user && ['admin', 'manager', 'support'].includes(user.role);

  // Format phone number for WhatsApp (remove spaces, ensure country code)
  const whatsAppNumber = BUSINESS_DETAILS.phone.replace(/\s+/g, '').replace('+', '');
  const whatsappUrl = `https://wa.me/${whatsAppNumber}`;

  return (
    <div className="flex flex-col min-h-screen font-sans">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center" onClick={closeMenu}>
              <span className="text-2xl font-serif font-bold text-brand-dark tracking-tight">
                Chelky<span className="text-brand-gold">Threads</span>
              </span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex space-x-8 items-center font-medium">
              <Link to="/" className={`${isActive('/')} transition-colors`}>Home</Link>
              <Link to="/shop" className={`${isActive('/shop')} transition-colors`}>Shop</Link>
              <Link to="/orders" className={`${isActive('/orders')} transition-colors`}>My Orders</Link>
              <Link to="/about" className={`${isActive('/about')} transition-colors`}>Our Story</Link>
              <Link to="/contact" className={`${isActive('/contact')} transition-colors`}>Contact</Link>
              {isPrivilegedUser && (
                <Link to="/admin" className="text-red-500 font-bold hover:text-red-700 transition-colors flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4" /> Dashboard
                </Link>
              )}
            </div>

            {/* Icons */}
            <div className="flex items-center space-x-4">
               {user && (
                 <div className="hidden md:flex items-center text-xs text-slate-500 mr-2 border-r border-slate-200 pr-4">
                    <User className="h-3 w-3 mr-1" />
                    <span>Hi, {user.name} ({user.role})</span>
                 </div>
               )}
              
              <Link to="/cart" className="relative p-2 text-brand-dark hover:text-brand-gold transition-colors" aria-label="Cart">
                <ShoppingBag className="h-6 w-6" />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-brand-accent rounded-full shadow-sm">
                    {cartCount}
                  </span>
                )}
              </Link>
              
              <button onClick={handleLogout} className="hidden md:block p-2 text-slate-400 hover:text-red-500 transition-colors" title="Sign Out">
                <LogOut className="h-5 w-5" />
              </button>

              <button className="md:hidden p-2 text-brand-dark hover:text-brand-gold transition-colors" onClick={toggleMenu} aria-label="Menu">
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 absolute w-full shadow-lg">
            <div className="px-4 pt-2 pb-4 space-y-1">
              <div className="px-3 py-2 text-sm text-slate-500 border-b border-slate-50 mb-2">
                 Logged in as: <strong>{user?.email}</strong> ({user?.role})
              </div>
              <Link to="/" className="block px-3 py-3 rounded-md text-base font-medium text-slate-700 hover:text-brand-gold hover:bg-slate-50 transition-colors" onClick={closeMenu}>Home</Link>
              <Link to="/shop" className="block px-3 py-3 rounded-md text-base font-medium text-slate-700 hover:text-brand-gold hover:bg-slate-50 transition-colors" onClick={closeMenu}>Shop</Link>
              <Link to="/orders" className="block px-3 py-3 rounded-md text-base font-medium text-slate-700 hover:text-brand-gold hover:bg-slate-50 transition-colors" onClick={closeMenu}>My Orders</Link>
              <Link to="/about" className="block px-3 py-3 rounded-md text-base font-medium text-slate-700 hover:text-brand-gold hover:bg-slate-50 transition-colors" onClick={closeMenu}>Our Story</Link>
              <Link to="/contact" className="block px-3 py-3 rounded-md text-base font-medium text-slate-700 hover:text-brand-gold hover:bg-slate-50 transition-colors" onClick={closeMenu}>Contact</Link>
              {isPrivilegedUser && (
                 <Link to="/admin" className="block px-3 py-3 rounded-md text-base font-bold text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2" onClick={closeMenu}>
                    <ShieldCheck className="h-5 w-5" /> Admin Dashboard
                 </Link>
              )}
              <button 
                onClick={handleLogout}
                className="w-full text-left px-3 py-3 rounded-md text-base font-medium text-slate-400 hover:text-red-500 hover:bg-slate-50 transition-colors flex items-center"
              >
                <LogOut className="h-4 w-4 mr-2" /> Sign Out
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-grow relative">
        {children}
      </main>

      {/* Voice Stylist Widget */}
      <VoiceStylist />

      {/* Footer */}
      <footer className="bg-brand-dark text-slate-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-2xl font-serif font-bold text-white mb-4">Chelky<span className="text-brand-gold">Threads</span></h3>
              <p className="mb-4 text-sm leading-relaxed text-slate-400">
                Where style meets confidence. We offer a curated selection of fashion-forward products that reflect the vibrant youth culture of Nairobi.
              </p>
              <div className="flex space-x-4">
                <a href={`https://instagram.com`} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-brand-gold transition-colors p-2 hover:bg-white/5 rounded-full"><Instagram className="h-5 w-5" /></a>
                <a href={`mailto:${BUSINESS_DETAILS.email}`} className="text-slate-400 hover:text-brand-gold transition-colors p-2 hover:bg-white/5 rounded-full"><Mail className="h-5 w-5" /></a>
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-green-500 transition-colors p-2 hover:bg-white/5 rounded-full"><MessageCircle className="h-5 w-5" /></a>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Quick Links</h4>
              <ul className="space-y-3 text-sm">
                <li><Link to="/shop" className="hover:text-brand-gold transition-colors block">Shop Collection</Link></li>
                <li><Link to="/orders" className="hover:text-brand-gold transition-colors block">Order History</Link></li>
                <li><Link to="/about" className="hover:text-brand-gold transition-colors block">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-brand-gold transition-colors block">Contact Support</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Contact Us</h4>
              <ul className="space-y-4 text-sm">
                <li className="flex items-center group">
                  <div className="p-2 bg-slate-800 rounded-full mr-3 group-hover:bg-brand-gold transition-colors">
                    <Mail className="h-4 w-4 text-slate-300 group-hover:text-white" />
                  </div>
                  <span>{BUSINESS_DETAILS.email}</span>
                </li>
                <li className="flex items-center group">
                  <div className="p-2 bg-slate-800 rounded-full mr-3 group-hover:bg-green-600 transition-colors">
                    <MessageCircle className="h-4 w-4 text-slate-300 group-hover:text-white" />
                  </div>
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">WhatsApp Available</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-10 pt-8 text-center text-xs text-slate-500 flex justify-between items-center flex-col sm:flex-row">
            <span>&copy; {new Date().getFullYear()} Chelky Threads. All rights reserved.</span>
            {isPrivilegedUser && (
              <span className="mt-2 sm:mt-0 flex items-center gap-1 text-green-500">
                <Lock className="h-3 w-3" /> Privileged Access Active ({user.role})
              </span>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;