# Chelky Threads - Server Setup Guide

## Prerequisites
- Node.js v16 or higher
- MongoDB running locally or accessible via connection string
- npm or yarn

## Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory with:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chelky_threads
JWT_SECRET=your_secret_key_here
NODE_ENV=development
```

## Running the Application

### Development Mode (Frontend + Backend)
```bash
npm run dev
```
This will start both the Vite dev server (port 3000) and the Express backend (port 5000) concurrently.

### Backend Only
```bash
npm run server
```

### Frontend Only
```bash
npm run dev-frontend
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify` - Verify token

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (admin/manager only)
- `PATCH /api/products/:id` - Update product (admin/manager only)
- `DELETE /api/products/:id` - Delete product (admin only)

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/my` - Get user's orders
- `GET /api/orders/:id` - Get specific order
- `GET /api/orders/all` - Get all orders (admin/manager/support)
- `PATCH /api/orders/:id` - Update order status (admin/manager/support)
- `DELETE /api/orders/:id` - Delete order (admin only)

### Users
- `GET /api/users` - Get all users (admin/manager)
- `GET /api/users/:email` - Get user by email (admin/manager)
- `PATCH /api/users/:email/role` - Update user role (admin only)
- `DELETE /api/users/:email` - Delete user (admin only)

### Pickup Locations
- `GET /api/pickup-locations` - Get all pickup locations
- `GET /api/pickup-locations/search?q=query` - Search pickup locations

## Database Connection
The app uses MongoDB. If MongoDB is not running locally, update the `MONGODB_URI` in `.env`:

```bash
# Local MongoDB
mongodb://localhost:27017/chelky_threads

# MongoDB Atlas (cloud)
mongodb+srv://username:password@cluster.mongodb.net/chelky_threads
```

## Server Architecture
- **Frontend**: React + TypeScript (Vite)
- **Backend**: Express.js + Node.js
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT tokens + bcryptjs for password hashing
- **API Proxy**: Vite proxy configuration for seamless API calls

## Testing
You can test the API using Postman or cURL:

```bash
# Test registration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","name":"User Name"}'

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Health check
curl http://localhost:5000/health
```

## Troubleshooting
- **MongoDB connection error**: Ensure MongoDB is running (`mongod`)
- **Port 5000 in use**: Change PORT in `.env` file
- **CORS errors**: Check vite.config.ts proxy configuration
- **JWT errors**: Verify JWT_SECRET matches in `.env`
