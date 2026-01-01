const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { sendOrderConfirmation } = require('./emailService.cjs');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'chelky_threads_ultra_secret_2025';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased for image uploads

// MongoDB Connection
let dbConnected = false;
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/chelky_threads';

console.log('🔄 Attempting MongoDB connection...');
console.log('   URI:', mongoUri.replace(/:[^:@]*@/, ':****@')); // Hide password in logs

const mongooseConnection = mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
})
  .then(() => {
    dbConnected = true;
    console.log('✅ Connected to MongoDB successfully');
  })
  .catch(err => {
    dbConnected = false;
    console.warn('⚠️  MongoDB connection failed');
    console.warn('   Error:', err.message);
    console.warn('   Make sure your MONGODB_URI is correct in .env');
    console.warn('   See MONGODB_SETUP.md for instructions');
  });

// Handle connection errors after initial connection
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
  dbConnected = false;
});

mongoose.connection.on('error', (err) => {
  console.warn('⚠️  MongoDB error:', err.message);
  dbConnected = false;
});

// --- Schemas ---
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['admin', 'manager', 'support', 'customer'], default: 'customer' }
});

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, enum: ['Footwear', 'Clothing', 'Accessories'], required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  description: String,
  isFeatured: { type: Boolean, default: false },
  stock: { type: Number, default: 0, min: 0 },
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 }
});

const OrderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  date: { type: Date, default: Date.now },
  customerName: String,
  customerEmail: String,
  items: Array,
  subtotal: Number,
  shippingFee: Number,
  totalAmount: Number,
  paymentMethod: String,
  deliveryMethod: String,
  status: { type: String, enum: ['Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled'], default: 'Pending' },
  trackingNumber: String
});

const ReviewSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  customerEmail: { type: String, required: true },
  customerName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  date: { type: Date, default: Date.now },
  verified: { type: Boolean, default: false }
});

const User = mongoose.model('User', UserSchema);
const Product = mongoose.model('Product', ProductSchema);
const Order = mongoose.model('Order', OrderSchema);
const Review = mongoose.model('Review', ReviewSchema);

// --- Auth Middleware ---
const auth = (roles = []) => {
  return async (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      if (!token) return res.status(401).json({ error: 'Authentication required' });

      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findOne({ _id: decoded._id });

      if (!user) throw new Error('User not found');
      if (roles.length && !roles.includes(user.role)) {
        return res.status(403).json({ error: 'Unauthorized access for your role.' });
      }

      req.user = user;
      req.token = token;
      next();
    } catch (e) {
      res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
  };
};

// --- Health Check Endpoint ---
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: dbConnected ? 'Connected' : 'Disconnected'
  });
});

// --- Diagnostic Endpoint ---
app.get('/api/status', (req, res) => {
  res.json({
    server: 'Running',
    database: dbConnected ? 'Connected to MongoDB' : 'MongoDB not connected',
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/test-analytics', auth(['admin', 'manager']), async (req, res) => {
  try {
    const orders = await Order.find({}).limit(1);
    const products = await Product.find({}).limit(1);
    const users = await User.find({}).limit(1);
    
    res.json({
      status: 'Analytics endpoint test',
      ordersCount: await Order.countDocuments({}),
      productsCount: await Product.countDocuments({}),
      usersCount: await User.countDocuments({}),
      sample: {
        order: orders[0] || null,
        product: products[0] || null,
        user: users[0] ? { email: users[0].email, role: users[0].role } : null
      }
    });
  } catch (e) {
    console.error('Test analytics error:', e.message);
    res.status(500).json({ error: 'Test failed', details: e.message });
  }
});

// --- Auth Routes ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    
    // Check if email already exists
    const existing = await User.findOne({ email: trimmedEmail });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 8);
    const user = new User({ 
      email: trimmedEmail, 
      password: hashedPassword, 
      name: name.trim(),
      role: 'customer'
    });
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign({ _id: user._id.toString() }, JWT_SECRET);
    res.status(201).json({ 
      user: { email: user.email, name: user.name, role: user.role }, 
      token 
    });
  } catch (e) {
    console.error('Registration error:', e.message || e);
    // Check for specific MongoDB errors
    if (e.code === 11000) {
      return res.status(400).json({ error: 'Email already registered.' });
    }
    if (e.name === 'ValidationError') {
      const messages = Object.values(e.errors || {}).map(err => err.message);
      return res.status(400).json({ error: 'Invalid user data: ' + messages.join(', ') });
    }
    if (e.message && e.message.includes('ECONNREFUSED')) {
      return res.status(503).json({ error: 'Database unavailable. Please try again later.' });
    }
    res.status(500).json({ error: 'Server error during registration. Please try again.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    
    const token = jwt.sign({ _id: user._id.toString() }, JWT_SECRET);
    res.json({ 
      user: { email: user.email, name: user.name, role: user.role }, 
      token 
    });
  } catch (e) {
    console.error('Login error:', e.message);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

app.get('/api/auth/verify', auth(), async (req, res) => {
  res.json({ 
    user: { email: req.user.email, name: req.user.name, role: req.user.role } 
  });
});

// --- User Management Routes ---
app.get('/api/users', auth(['admin', 'manager']), async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/users/:email', auth(['admin', 'manager']), async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email }, '-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.patch('/api/users/:email/role', auth(['admin']), async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { email: req.params.email }, 
      { role: req.body.role }, 
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

app.delete('/api/users/:email', auth(['admin']), async (req, res) => {
  try {
    await User.findOneAndDelete({ email: req.params.email });
    res.json({ message: 'User deleted successfully' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// --- Product Routes ---
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

app.post('/api/products', auth(['admin', 'manager']), async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.patch('/api/products/:id', auth(['admin', 'manager']), async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', auth(['admin', 'manager']), async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted successfully' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// --- Order Routes ---
app.post('/api/orders', auth(), async (req, res) => {
  try {
    const orderId = `ORD-${Date.now()}`;
    const order = new Order({ 
      ...req.body, 
      id: orderId,
      customerEmail: req.user.email,
      customerId: req.user._id
    });
    await order.save();

    // Send confirmation email
    try {
      await sendOrderConfirmation({
        orderId: order.id,
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        items: order.items,
        subtotal: order.subtotal,
        shippingFee: order.shippingFee,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        deliveryMethod: order.deliveryMethod,
        date: order.date
      });
    } catch (emailError) {
      console.warn('⚠️  Failed to send order confirmation email:', emailError.message);
      // Don't fail the order if email fails
    }

    res.status(201).json(order);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create order' });
  }
});

app.get('/api/orders/my', auth(), async (req, res) => {
  try {
    const orders = await Order.find({ customerEmail: req.user.email }).sort({ date: -1 });
    res.json(orders);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.get('/api/orders/all', auth(['admin', 'manager', 'support']), async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ date: -1 });
    res.json(orders);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch all orders' });
  }
});

app.get('/api/orders/:id', auth(), async (req, res) => {
  try {
    const order = await Order.findOne({ id: req.params.id });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    // Check authorization: only owner or staff can view
    if (order.customerEmail !== req.user.email && !['admin', 'manager', 'support'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    
    res.json(order);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

app.patch('/api/orders/:id', auth(['admin', 'manager', 'support']), async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { id: req.params.id }, 
      req.body, 
      { new: true }
    );
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update order' });
  }
});

app.delete('/api/orders/:id', auth(['admin']), async (req, res) => {
  try {
    await Order.findOneAndDelete({ id: req.params.id });
    res.json({ message: 'Order deleted successfully' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

// --- Search & Filter Routes ---
app.get('/api/products/search', async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, sortBy } = req.query;
    let query = {};

    // Text search
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }

    // Category filter
    if (category && category !== 'All') {
      query.category = category;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Build sort
    let sort = {};
    switch(sortBy) {
      case 'price-asc':
        sort = { price: 1 };
        break;
      case 'price-desc':
        sort = { price: -1 };
        break;
      case 'newest':
        sort = { createdAt: -1 };
        break;
      case 'rating':
        sort = { averageRating: -1 };
        break;
      default:
        sort = { isFeatured: -1, _id: -1 };
    }

    const products = await Product.find(query).sort(sort);
    res.json(products);
  } catch (e) {
    console.error('Search error:', e.message);
    res.status(500).json({ error: 'Search failed' });
  }
});

// --- Review Routes ---
app.post('/api/reviews', auth(), async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;

    if (!productId || !rating || !comment) {
      return res.status(400).json({ error: 'ProductId, rating, and comment are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Create review
    const review = new Review({
      productId,
      customerEmail: req.user.email,
      customerName: req.user.name,
      rating,
      comment,
      verified: false
    });
    await review.save();

    // Update product rating
    const reviews = await Review.find({ productId });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await Product.findByIdAndUpdate(productId, {
      averageRating: Math.round(avgRating * 100) / 100,
      reviewCount: reviews.length
    });

    res.status(201).json(review);
  } catch (e) {
    console.error('Review creation error:', e.message);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

app.get('/api/reviews/product/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId }).sort({ date: -1 });
    res.json(reviews);
  } catch (e) {
    console.error('Review fetch error:', e.message);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

app.get('/api/reviews', auth(['admin', 'manager']), async (req, res) => {
  try {
    const reviews = await Review.find({}).sort({ date: -1 });
    res.json(reviews);
  } catch (e) {
    console.error('Review fetch error:', e.message);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

app.patch('/api/reviews/:id', auth(['admin', 'manager']), async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!review) return res.status(404).json({ error: 'Review not found' });
    res.json(review);
  } catch (e) {
    console.error('Review update error:', e.message);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

app.delete('/api/reviews/:id', auth(['admin']), async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found' });

    // Update product rating
    const reviews = await Review.find({ productId: review.productId });
    if (reviews.length > 0) {
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      await Product.findByIdAndUpdate(review.productId, {
        averageRating: Math.round(avgRating * 100) / 100,
        reviewCount: reviews.length
      });
    } else {
      await Product.findByIdAndUpdate(review.productId, {
        averageRating: 0,
        reviewCount: 0
      });
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (e) {
    console.error('Review deletion error:', e.message);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// --- Pickup Locations Routes ---
const PICKUP_LOCATIONS = [
  { id: 'pm_001', name: 'Nairobi CBD - Sasa Mall', region: 'CBD', price: 120 },
  { id: 'pm_002', name: 'Nairobi CBD - Imenti House', region: 'CBD', price: 120 },
  { id: 'pm_003', name: 'Westlands - The Mall', region: 'Westlands', price: 150 },
  { id: 'pm_004', name: 'Roysambu - TRM', region: 'Thika Road', price: 180 },
  { id: 'pm_005', name: 'Kahawa Wendani - Magunas', region: 'Thika Road', price: 180 },
  { id: 'pm_006', name: 'Eastleigh - Yare Towers', region: 'Eastleigh', price: 150 },
  { id: 'pm_007', name: 'Karen - Shopping Center', region: 'Karen', price: 250 },
  { id: 'pm_008', name: 'Ongata Rongai - Tuskys', region: 'Rongai', price: 250 },
  { id: 'pm_009', name: 'Juja - Juja City Mall', region: 'Juja', price: 200 },
  { id: 'pm_010', name: 'Thika - Ananas Mall', region: 'Thika', price: 220 },
  { id: 'pm_011', name: 'Utawala - Naivas', region: 'Embakasi', price: 180 },
  { id: 'pm_012', name: 'South B - Hazina', region: 'South B', price: 150 },
  { id: 'pm_013', name: 'Langata - Cleanshelf', region: 'Langata', price: 200 },
  { id: 'pm_014', name: 'Buruburu - The Point', region: 'Eastlands', price: 150 },
  { id: 'pm_015', name: 'Donholm - Greenspan', region: 'Eastlands', price: 150 },
];

app.get('/api/pickup-locations', (req, res) => {
  try {
    res.json(PICKUP_LOCATIONS);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch pickup locations' });
  }
});

app.get('/api/pickup-locations/search', (req, res) => {
  try {
    const query = req.query.q?.toString().toLowerCase() || '';
    
    if (!query) {
      return res.json(PICKUP_LOCATIONS);
    }
    
    const results = PICKUP_LOCATIONS.filter(location =>
      location.name.toLowerCase().includes(query) ||
      location.region.toLowerCase().includes(query)
    );
    
    res.json(results);
  } catch (e) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// --- Analytics Routes ---
app.get('/api/analytics/overview', auth(['admin', 'manager']), async (req, res) => {
  try {
    const orders = await Order.find({});
    const products = await Product.find({});
    const users = await User.find({});
    const reviews = await Review.find({});

    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'Completed').length;
    const totalCustomers = users.filter(u => u.role === 'customer').length;
    const totalProducts = products.length;
    const averageRating = products.length > 0 
      ? (products.reduce((sum, p) => sum + (p.averageRating || 0), 0) / products.length).toFixed(2)
      : 0;

    const response = {
      totalRevenue: parseFloat(totalRevenue.toFixed(2)) || 0,
      totalOrders: totalOrders || 0,
      completedOrders: completedOrders || 0,
      completionRate: totalOrders > 0 ? parseFloat(((completedOrders / totalOrders) * 100).toFixed(1)) : 0,
      totalCustomers: totalCustomers || 0,
      totalProducts: totalProducts || 0,
      averageRating: parseFloat(averageRating) || 0,
      totalReviews: reviews.length || 0
    };
    
    res.json(response);
  } catch (e) {
    console.error('Analytics overview error:', e.message);
    res.status(500).json({ error: 'Failed to fetch analytics overview' });
  }
});

app.get('/api/analytics/revenue', auth(['admin', 'manager']), async (req, res) => {
  try {
    const orders = await Order.find({});
    
    // Group revenue by date
    const revenueByDate = {};
    orders.forEach(order => {
      const date = new Date(order.date).toISOString().split('T')[0];
      if (!revenueByDate[date]) {
        revenueByDate[date] = 0;
      }
      revenueByDate[date] += order.totalAmount || 0;
    });

    const data = Object.entries(revenueByDate)
      .map(([date, amount]) => ({
        date,
        revenue: parseFloat(parseFloat(amount).toFixed(2)) || 0
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    res.json(data || []);
  } catch (e) {
    console.error('Revenue analytics error:', e.message);
    res.status(500).json({ error: 'Failed to fetch revenue analytics' });
  }
});

app.get('/api/analytics/orders', auth(['admin', 'manager']), async (req, res) => {
  try {
    const orders = await Order.find({});
    
    const statusCounts = {
      'Pending': 0,
      'Processing': 0,
      'Shipped': 0,
      'Completed': 0,
      'Cancelled': 0
    };

    orders.forEach(order => {
      const status = order.status || 'Pending';
      if (statusCounts[status] !== undefined) {
        statusCounts[status]++;
      }
    });

    const data = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count: count || 0
    }));

    res.json(data || []);
  } catch (e) {
    console.error('Order analytics error:', e.message);
    res.status(500).json({ error: 'Failed to fetch order analytics' });
  }
});

app.get('/api/analytics/top-products', auth(['admin', 'manager']), async (req, res) => {
  try {
    const orders = await Order.find({});
    
    // Count product sales
    const productSales = {};
    orders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          const productId = item.id || item._id || 'unknown';
          if (!productSales[productId]) {
            productSales[productId] = { quantity: 0, name: item.name || 'Unknown' };
          }
          productSales[productId].quantity += item.quantity || 1;
        });
      }
    });

    const data = Object.entries(productSales)
      .map(([id, data]) => ({
        productId: id,
        name: data.name || 'Unknown',
        sales: data.quantity || 0
      }))
      .sort((a, b) => (b.sales || 0) - (a.sales || 0))
      .slice(0, 10);

    res.json(data || []);
  } catch (e) {
    console.error('Top products error:', e.message);
    res.status(500).json({ error: 'Failed to fetch top products' });
  }
});

app.get('/api/analytics/customer-metrics', auth(['admin', 'manager']), async (req, res) => {
  try {
    const users = await User.find({});
    const orders = await Order.find({});

    const customers = users.filter(u => u.role === 'customer');
    const customerEmails = new Set(customers.map(c => c.email));

    const customerOrderCounts = {};
    orders.forEach(order => {
      if (customerEmails.has(order.customerEmail)) {
        if (!customerOrderCounts[order.customerEmail]) {
          customerOrderCounts[order.customerEmail] = 0;
        }
        customerOrderCounts[order.customerEmail]++;
      }
    });

    const oneTimeCustomers = Object.values(customerOrderCounts).filter(count => count === 1).length;
    const repeatCustomers = Object.values(customerOrderCounts).filter(count => count > 1).length;

    const response = {
      totalCustomers: customers.length || 0,
      oneTimeCustomers: oneTimeCustomers || 0,
      repeatCustomers: repeatCustomers || 0,
      repeatRate: customers.length > 0 ? parseFloat(((repeatCustomers / customers.length) * 100).toFixed(1)) : 0,
      averageOrdersPerCustomer: customers.length > 0 
        ? parseFloat((orders.length / customers.length).toFixed(2))
        : 0
    };

    res.json(response);
  } catch (e) {
    console.error('Customer metrics error:', e.message);
    res.status(500).json({ error: 'Failed to fetch customer metrics' });
  }
});

app.get('/api/analytics/payment-methods', auth(['admin', 'manager']), async (req, res) => {
  try {
    const orders = await Order.find({});
    
    const paymentMethods = {};
    orders.forEach(order => {
      const method = order.paymentMethod || 'Unknown';
      if (!paymentMethods[method]) {
        paymentMethods[method] = 0;
      }
      paymentMethods[method]++;
    });

    const data = Object.entries(paymentMethods).map(([method, count]) => ({
      method: method || 'Unknown',
      count: count || 0
    }));

    res.json(data || []);
  } catch (e) {
    console.error('Payment methods error:', e.message);
    res.status(500).json({ error: 'Failed to fetch payment methods' });
  }
});

// --- Error Handling ---
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// --- Start Server ---
async function startServer() {
  try {
    // Wait a bit for DB connection to attempt
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const server = app.listen(PORT, () => {
      console.log(`\n✓ Chelky Threads Backend Server`);
      console.log(`✓ Running on http://localhost:${PORT}`);
      console.log(`✓ API available at http://localhost:${PORT}/api`);
      console.log(`✓ Health check: http://localhost:${PORT}/health\n`);
    });

    // Graceful Shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
        mongoose.connection.close(false, () => {
          console.log('MongoDB connection closed');
          process.exit(0);
        });
      });
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}


startServer();