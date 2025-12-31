import React, { useState, useRef, useEffect } from 'react';
import { useProducts } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import { UserRole } from '../context/AuthContext';
import { Product, OrderStatus, Order } from '../types';
import { Trash2, Edit, Plus, Save, X, RotateCcw, LayoutDashboard, Users, Key, Package, Upload, CheckCircle, AlertCircle, ShoppingCart, DollarSign, Truck, FileText, TrendingUp, Wallet, Lock, MapPin, Eye, ExternalLink, ShieldCheck, Image as ImageIcon } from 'lucide-react';

const Admin: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, resetToDefaults } = useProducts();
  const { allUsers, adminUpdateUserRole, refreshUsers } = useAuth();
  const { orders, updateOrderStatus, updateOrderTracking, deleteOrder, refreshOrders } = useOrders();
  const [activeTab, setActiveTab] = useState<'products' | 'users' | 'transactions'>('products');
  
  // Notification State
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modal State
  const [viewOrder, setViewOrder] = useState<Order | null>(null);

  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Password Reset Modal State
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [userToReset, setUserToReset] = useState<{email: string, name: string} | null>(null);
  const [newPassword, setNewPassword] = useState('');
  
  // Product Form State
  const [isEditing, setIsEditing] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({
    name: '',
    category: 'Footwear',
    price: 0,
    image: '',
    description: '',
    isFeatured: false
  });

  // Automatically refresh data relevant to the selected tab
  useEffect(() => {
    if (activeTab === 'users') {
      refreshUsers();
    } else if (activeTab === 'transactions') {
      refreshOrders();
    }
  }, [activeTab]);

  // Derived Statistics
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const totalShippingFees = orders.reduce((sum, order) => sum + order.shippingFee, 0);
  const productRevenue = totalRevenue - totalShippingFees;

  // Helper: Show Notification
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const getStatusColor = (status: OrderStatus) => {
    switch(status) {
        case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'Processing': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'Shipped': return 'bg-purple-100 text-purple-800 border-purple-200';
        case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
        case 'Cancelled': return 'bg-red-100 text-red-800 border-red-200';
        default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch(role) {
      case 'admin': return 'bg-red-100 text-red-700 border-red-200';
      case 'manager': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'support': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  // --- Handlers ---
  const handleRoleChange = async (email: string, newRole: UserRole) => {
    const success = await adminUpdateUserRole(email, newRole);
    if (success) {
      showNotification(`Role updated to ${newRole} for ${email}`);
    } else {
      showNotification("Failed to update role", "error");
    }
  };

  const handleEditClick = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentProduct({ ...product });
    setIsEditing(true);
    setImageError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    resetForm();
  };

  const resetForm = () => {
    setCurrentProduct({
      name: '',
      category: 'Footwear',
      price: 0,
      image: '',
      description: '',
      isFeatured: false
    });
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct.name || !currentProduct.price || !currentProduct.image) {
      showNotification("Please fill in all required fields (Name, Price, Image)", "error");
      return;
    }

    try {
      if (isEditing && currentProduct.id) {
        updateProduct(currentProduct as Product);
        showNotification("Product updated successfully!");
      } else {
        addProduct(currentProduct as Omit<Product, 'id'>);
        showNotification("Product added successfully!");
      }
      setIsEditing(false);
      resetForm();
    } catch (error) {
      showNotification("An error occurred while saving.", "error");
    }
  };

  const handleDelete = (id: string | number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this product?")) {
      deleteProduct(id);
      showNotification("Product deleted.");
      if (isEditing && currentProduct.id === id) handleCancelEdit();
    }
  };
  
  const handleToggleFeatured = (product: Product, e?: React.MouseEvent) => {
     if (e) e.stopPropagation();
     try {
       const newStatus = !product.isFeatured;
       updateProduct({ ...product, isFeatured: newStatus });
       showNotification(newStatus ? `"${product.name}" is now featured.` : `"${product.name}" removed from featured.`);
     } catch (error) {
       showNotification("Failed to update product status.", "error");
     }
  };

  const handleResetInventory = () => {
    if (window.confirm("WARNING: This will delete all your current products. Are you sure?")) {
      resetToDefaults();
      handleCancelEdit();
      showNotification("Inventory reset is disabled on the live server.");
    }
  };

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
      updateOrderStatus(orderId, newStatus);
      showNotification(`Order #${orderId} marked as ${newStatus}.`);
      if (viewOrder && viewOrder.id === orderId) {
        setViewOrder({ ...viewOrder, status: newStatus });
      }
  };
  
  const handleTrackingBlur = (order: Order, newValue: string) => {
      const oldValue = order.trackingNumber || '';
      if (oldValue !== newValue) {
          updateOrderTracking(order.id, newValue);
          showNotification("Tracking number saved.");
      }
  };

  const handleDeleteOrder = (orderId: string) => {
      if (window.confirm(`Are you sure you want to delete Order #${orderId}?`)) {
          deleteOrder(orderId);
          showNotification("Order record deleted.");
      }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImageError(null);
    
    if (file) {
      // 5MB Limit Check
      if (file.size > 5 * 1024 * 1024) { 
        setImageError("File size exceeds 5MB. Please choose a smaller image.");
        showNotification("Image too large", "error");
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 800;
          if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } }
          else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
            setCurrentProduct(prev => ({ ...prev, image: compressedDataUrl }));
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const removeImage = () => {
    setCurrentProduct(prev => ({ ...prev, image: '' }));
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  const initiatePasswordReset = (user: {email: string, name: string}) => {
    setUserToReset(user);
    setNewPassword('');
    setResetModalOpen(true);
  };

  const handleConfirmReset = async () => {
    if (!userToReset || !newPassword.trim()) return;
    showNotification("Admin security allows role changes only via dashboard.", "error");
    setResetModalOpen(false);
    setUserToReset(null);
  };

  const isUploadedImage = currentProduct.image?.startsWith('data:');

  return (
    <div className="min-h-screen bg-slate-50 py-12 relative">
      {notification && (
        <div className={`fixed top-24 right-4 z-50 px-6 py-4 rounded-lg shadow-xl flex items-center animate-fade-in-up transition-all transform ${
          notification.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-500 text-white'
        }`}>
          {notification.type === 'success' ? <CheckCircle className="h-5 w-5 mr-3" /> : <AlertCircle className="h-5 w-5 mr-3" />}
          <span className="font-bold">{notification.message}</span>
        </div>
      )}

      {/* View Order Modal */}
      {viewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-up max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-900 flex items-center">
                <FileText className="mr-2 h-5 w-5 text-brand-gold" />
                Order Details: {viewOrder.id}
              </h3>
              <button onClick={() => setViewOrder(null)} className="text-slate-400 hover:text-slate-600" title="Close order details">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-8 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Customer Info</h4>
                    <p className="text-slate-900 font-bold">{viewOrder.customerName}</p>
                    <p className="text-slate-500 text-sm">{viewOrder.customerEmail}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status</h4>
                    <select
                      value={viewOrder.status}
                      onChange={(e) => handleStatusChange(viewOrder.id, e.target.value as OrderStatus)}
                      className={`text-sm font-bold px-3 py-1.5 rounded-full border ${getStatusColor(viewOrder.status)}`}
                      aria-label="Order status"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Tracking</h4>
                  <input 
                    type="text" 
                    placeholder="Tracking ID..."
                    defaultValue={viewOrder.trackingNumber || ''}
                    onBlur={(e) => handleTrackingBlur(viewOrder, e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-gold"
                  />
                </div>
              </div>
              <div className="space-y-3">
                {viewOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center border-b border-slate-50 pb-3 last:border-0">
                    <div className="flex items-center gap-3">
                      <img src={item.image} className="h-12 w-12 object-cover rounded" alt={item.name} />
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                        <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="font-mono text-sm font-bold">KES {(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button onClick={() => setViewOrder(null)} className="px-6 py-2 bg-brand-dark text-white font-bold rounded-lg hover:bg-slate-800">Close</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-slate-900 flex items-center">
              <LayoutDashboard className="mr-3 h-8 w-8 text-brand-gold" /> Admin Dashboard
            </h1>
          </div>
          <button onClick={handleResetInventory} className="px-4 py-2 border border-red-200 bg-white text-red-600 rounded-md hover:bg-red-50 flex items-center text-sm font-bold shadow-sm">
            <RotateCcw className="h-4 w-4 mr-2" /> Server Status
          </button>
        </div>

        <div className="flex space-x-1 bg-white p-1 rounded-lg shadow-sm w-fit mb-8 border border-slate-200">
          <button onClick={() => setActiveTab('products')} className={`px-6 py-2 rounded-md text-sm font-bold flex items-center ${activeTab === 'products' ? 'bg-brand-dark text-white' : 'text-slate-500'}`}><Package className="h-4 w-4 mr-2" /> Products</button>
          <button onClick={() => setActiveTab('users')} className={`px-6 py-2 rounded-md text-sm font-bold flex items-center ${activeTab === 'users' ? 'bg-brand-dark text-white' : 'text-slate-500'}`}><Users className="h-4 w-4 mr-2" /> Users</button>
          <button onClick={() => setActiveTab('transactions')} className={`px-6 py-2 rounded-md text-sm font-bold flex items-center ${activeTab === 'transactions' ? 'bg-brand-dark text-white' : 'text-slate-500'}`}><ShoppingCart className="h-4 w-4 mr-2" /> Transactions</button>
        </div>

        {activeTab === 'products' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className={`bg-white p-6 rounded-lg shadow-lg sticky top-24 border-t-4 ${isEditing ? 'border-blue-500' : 'border-brand-gold'}`}>
                <h2 className="text-xl font-bold mb-4">{isEditing ? 'Edit Product' : 'Add Product'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Product Name</label>
                    <input type="text" placeholder="Name" required value={currentProduct.name} onChange={(e) => setCurrentProduct({...currentProduct, name: e.target.value})} className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-brand-gold outline-none" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                      <select value={currentProduct.category} onChange={(e) => setCurrentProduct({...currentProduct, category: e.target.value as any})} className="w-full p-2 border border-slate-300 rounded bg-white" aria-label="Product category">
                        <option value="Footwear">Footwear</option>
                        <option value="Clothing">Clothing</option>
                        <option value="Accessories">Accessories</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Price (KES)</label>
                      <input type="number" placeholder="Price" required value={currentProduct.price || ''} onChange={(e) => setCurrentProduct({...currentProduct, price: Number(e.target.value)})} className="w-full p-2 border border-slate-300 rounded" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Stock Quantity</label>
                    <input type="number" placeholder="Stock" min="0" value={currentProduct.stock ?? 0} onChange={(e) => setCurrentProduct({...currentProduct, stock: Math.max(0, Number(e.target.value))})} className="w-full p-2 border border-slate-300 rounded" />
                  </div>

                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-500 uppercase">Product Image Source</label>
                    
                    {/* Inline Image Preview */}
                    {currentProduct.image ? (
                      <div className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                        <img src={currentProduct.image} className="h-40 w-full object-contain" alt="Product Preview" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <button type="button" onClick={removeImage} className="bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors" title="Remove image">
                              <Trash2 className="h-5 w-5" />
                           </button>
                        </div>
                      </div>
                    ) : (
                      <div className={`h-40 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors ${imageError ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'}`}>
                         <ImageIcon className={`h-10 w-10 mb-2 ${imageError ? 'text-red-400' : 'text-slate-300'}`} />
                         <span className="text-xs font-medium text-slate-400">No image staged</span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Or paste Image URL" 
                        value={isUploadedImage ? '' : currentProduct.image} 
                        onChange={(e) => {
                          setCurrentProduct({...currentProduct, image: e.target.value});
                          setImageError(null);
                        }} 
                        className="w-full p-2 border border-slate-300 rounded text-sm disabled:bg-slate-50 disabled:text-slate-400" 
                        disabled={isUploadedImage} 
                      />
                      <button 
                        type="button" 
                        onClick={triggerFileInput} 
                        className={`px-3 rounded transition-colors ${imageError ? 'bg-red-500' : 'bg-slate-800'} text-white`}
                        title="Upload from device"
                      >
                        <Upload className="h-4 w-4" />
                      </button>
                      <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" aria-label="Upload product image" />
                    </div>
                    
                    {imageError && (
                      <div className="flex items-center text-xs font-bold text-red-500 mt-1 animate-fade-in-up">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {imageError}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                    <textarea 
                      placeholder="Product details..." 
                      value={currentProduct.description} 
                      onChange={(e) => setCurrentProduct({...currentProduct, description: e.target.value})} 
                      className="w-full p-2 border border-slate-300 rounded text-sm min-h-[80px]"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button type="submit" className={`flex-1 text-white font-bold py-3 rounded shadow-md transition-all ${isEditing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-brand-gold hover:bg-yellow-600'}`}>{isEditing ? 'Update' : 'Add'} Product</button>
                    <button type="button" onClick={handleCancelEdit} className="px-4 py-3 bg-slate-200 rounded font-bold hover:bg-slate-300 transition-colors">Cancel</button>
                  </div>
                </form>
              </div>
            </div>
            <div className="lg:col-span-2 overflow-x-auto bg-white rounded-lg shadow">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 uppercase text-xs">
                  <tr><th className="px-6 py-4">Product</th><th className="px-6 py-4">Price</th><th className="px-6 py-4">Stock</th><th className="px-6 py-4 text-center">Featured</th><th className="px-6 py-4 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 flex items-center gap-3"><img src={p.image} className="h-10 w-10 rounded object-cover" alt={p.name} /><span>{p.name}</span></td>
                      <td className="px-6 py-4 font-bold">KES {p.price.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${(p.stock ?? 0) <= 5 ? 'bg-red-100 text-red-700' : (p.stock ?? 0) <= 15 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                          {p.stock ?? 0} units
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => handleToggleFeatured(p)} className={`h-6 w-11 rounded-full border-2 transition-colors ${p.isFeatured ? 'bg-brand-gold' : 'bg-slate-200'}`}><span className={`block h-5 w-5 rounded-full bg-white transform transition ${p.isFeatured ? 'translate-x-5' : 'translate-x-0'}`} /></button>
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        <button onClick={() => handleEditClick(p)} className="p-2 hover:text-brand-gold"><Edit className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(p.id)} className="p-2 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
             <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center"><Users className="mr-2 h-5 w-5" /> Customer Accounts</h2>
              <button onClick={() => refreshUsers()} className="p-2 text-slate-400 hover:text-brand-gold transition-colors" title="Reload Users">
                 <RotateCcw className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4">Name / Email</th>
                    <th className="px-6 py-4">Current Role</th>
                    <th className="px-6 py-4">Change Role</th>
                    <th className="px-6 py-4 text-right">Security</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allUsers.map((u, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${getRoleBadgeColor(u.role)}`}>
                          {u.role || 'customer'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={u.role || 'customer'}
                          onChange={(e) => handleRoleChange(u.email, e.target.value as UserRole)}
                          className="bg-white border border-slate-200 text-xs font-semibold rounded-md px-3 py-1.5 outline-none cursor-pointer"
                          aria-label="User role"
                        >
                          <option value="customer">Customer</option>
                          <option value="support">Support</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => initiatePasswordReset(u)} className="text-xs font-bold text-slate-600 hover:text-brand-gold border border-slate-200 px-3 py-1.5 rounded-md">
                          <Key className="h-3 w-3 mr-1.5 inline" /> Status
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow border border-slate-100">
                <p className="text-sm font-bold text-slate-400 uppercase">Gross Sales</p>
                <p className="text-2xl font-serif font-bold text-slate-900">KES {totalRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow border border-slate-100">
                <p className="text-sm font-bold text-slate-400 uppercase">Product Revenue</p>
                <p className="text-2xl font-serif font-bold text-slate-900">KES {productRevenue.toLocaleString()}</p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                  <tr><th className="px-6 py-4">Order</th><th className="px-6 py-4">Total</th><th className="px-6 py-4">Tracking</th><th className="px-6 py-4 text-center">Status</th><th className="px-6 py-4 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map(o => (
                    <tr key={o.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4"><p className="font-bold">{o.id}</p><p className="text-xs text-slate-400">{o.customerEmail}</p></td>
                      <td className="px-6 py-4 font-bold">KES {o.totalAmount.toLocaleString()}</td>
                      <td className="px-6 py-4"><input type="text" defaultValue={o.trackingNumber} onBlur={(e) => handleTrackingBlur(o, e.target.value)} className="w-24 text-xs border rounded p-1" aria-label="Tracking number" placeholder="Tracking #" /></td>
                      <td className="px-6 py-4 text-center"><span className={`px-2 py-1 rounded text-[10px] font-bold ${getStatusColor(o.status)}`}>{o.status}</span></td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2"><button onClick={() => setViewOrder(o)} className="p-2 hover:text-brand-gold" title="View order details"><Eye className="h-4 w-4" /></button><button onClick={() => handleDeleteOrder(o.id)} className="p-2 hover:text-red-600" title="Delete order"><Trash2 className="h-4 w-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Reset Modal */}
      {resetModalOpen && userToReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up p-6">
            <h3 className="text-lg font-bold mb-4">Account Security for {userToReset.name}</h3>
            <p className="text-sm text-slate-500 mb-6">User permissions are handled via the role selection dropdown. You can elevate or restrict access in real-time.</p>
            <div className="flex gap-3">
              <button onClick={() => setResetModalOpen(false)} className="flex-1 px-4 py-2 bg-brand-dark text-white rounded font-bold hover:bg-slate-800 transition-colors">Got it</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;