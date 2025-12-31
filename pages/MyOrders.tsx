
import React from 'react';
import { useOrders } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';
import { OrderStatus } from '../types';
import { ShoppingBag, Truck, CheckCircle, Clock, Package, ExternalLink, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const MyOrders: React.FC = () => {
  const { orders } = useOrders();
  const { user } = useAuth();

  // Filter orders for the current user
  const myOrders = orders.filter(order => order.customerEmail === user?.email);

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'Pending': return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'Processing': return <Package className="h-5 w-5 text-blue-500" />;
      case 'Shipped': return <Truck className="h-5 w-5 text-purple-500" />;
      case 'Completed': return <CheckCircle className="h-5 w-5 text-green-500" />;
      default: return <Clock className="h-5 w-5 text-slate-400" />;
    }
  };

  const getStatusBadgeClass = (status: OrderStatus) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'Processing': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Shipped': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Completed': return 'bg-green-50 text-green-700 border-green-200';
      case 'Cancelled': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-3xl font-serif font-bold text-slate-900">My Order History</h1>
          <p className="text-slate-500 mt-2">Track your style journey with Chelky Threads.</p>
        </div>

        {myOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-50 text-slate-300 mb-6">
              <ShoppingBag className="h-10 w-10" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">No orders found</h2>
            <p className="text-slate-500 mb-8">You haven't placed any orders yet. Start exploring our collection!</p>
            <Link to="/shop" className="inline-flex items-center px-6 py-3 bg-brand-dark text-white font-bold rounded-lg hover:bg-slate-800 transition-all shadow-md">
              Start Shopping <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {myOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
                {/* Header */}
                <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-lg shadow-sm border border-slate-100">
                      {getStatusIcon(order.status)}
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-0.5">Order ID</div>
                      <div className="font-bold text-slate-900">{order.id}</div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:items-end">
                    <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-0.5">Date Placed</div>
                    <div className="font-medium text-slate-700">{new Date(order.date).toLocaleDateString(undefined, { dateStyle: 'long' })}</div>
                  </div>

                  <div className={`px-4 py-1.5 rounded-full border text-sm font-bold flex items-center gap-2 ${getStatusBadgeClass(order.status)}`}>
                    {order.status}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Items */}
                    <div className="lg:col-span-2 space-y-4">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Ordered Items</h3>
                      <div className="space-y-3">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-4 group">
                            <div className="h-16 w-16 rounded-md overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-100">
                              <img src={item.image} alt={item.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            </div>
                            <div className="flex-grow">
                              <div className="font-bold text-slate-800">{item.name}</div>
                              <div className="text-xs text-slate-500">{item.category} • Qty: {item.quantity}</div>
                            </div>
                            <div className="font-mono text-sm text-slate-600">
                              KES {(item.price * item.quantity).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Summary & Tracking */}
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Shipping Info</h3>
                          <div className="text-sm text-slate-700 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500">Method:</span>
                              <span className="font-medium">{order.deliveryMethod}</span>
                            </div>
                            {order.trackingNumber ? (
                              <div className="bg-brand-gold/10 p-3 rounded-lg border border-brand-gold/20 mt-4">
                                <div className="text-xs font-bold text-brand-gold uppercase mb-1 flex items-center">
                                  <Truck className="h-3 w-3 mr-1" /> Tracking Number
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="font-mono text-brand-dark font-bold">{order.trackingNumber}</span>
                                  <button className="text-[10px] bg-brand-dark text-white px-2 py-0.5 rounded flex items-center hover:bg-slate-800 transition-colors">
                                    <ExternalLink className="h-2.5 w-2.5 mr-1" /> Track
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-slate-400 italic mt-2 flex items-center gap-1">
                                <Clock className="h-3 w-3" /> Tracking will be available once shipped.
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-200">
                          <div className="flex justify-between items-center text-sm mb-1">
                            <span className="text-slate-500">Total Amount</span>
                            <span className="font-bold text-slate-900 text-lg">KES {order.totalAmount.toLocaleString()}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 text-right">Paid via {order.paymentMethod}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
