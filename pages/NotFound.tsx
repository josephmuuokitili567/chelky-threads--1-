import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search, ArrowLeft } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="mb-8 relative inline-block">
          <div className="text-9xl font-serif font-bold text-slate-200">404</div>
          <div className="absolute inset-0 flex items-center justify-center">
             <Search className="h-16 w-16 text-brand-gold animate-bounce-slight" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Page Not Found</h1>
        <p className="text-slate-600 mb-8 text-lg">
          Oops! It looks like the page you're looking for has been moved or doesn't exist.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            to="/" 
            className="inline-flex items-center justify-center px-6 py-3 bg-brand-dark text-white font-bold rounded-lg hover:bg-slate-800 transition-colors shadow-md"
          >
            <Home className="mr-2 h-4 w-4" />
            Return Home
          </Link>
          <Link 
            to="/shop" 
            className="inline-flex items-center justify-center px-6 py-3 bg-white text-slate-700 font-bold border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-brand-gold transition-colors shadow-sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;