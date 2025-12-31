# MongoDB Atlas Setup Guide

## Step 1: Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for a FREE account
3. Create a new project (name it "Chelky Threads")

## Step 2: Create a Cluster
1. Click "Create" to create a new cluster
2. Choose the **FREE tier** (M0 - Sandbox)
3. Select your preferred region (closest to you)
4. Click "Create Cluster" and wait for it to deploy (2-3 minutes)

## Step 3: Create Database User
1. Go to "Database Access" in the left menu
2. Click "Add New Database User"
3. Create a username: `chelky`
4. Create a password: `chelky2025` (or your secure password)
5. Click "Add User"

## Step 4: Set Network Access
1. Go to "Network Access" in the left menu
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (or add your IP)
4. Click "Confirm"

## Step 5: Get Connection String
1. Go back to "Clusters"
2. Click "Connect" on your cluster
3. Select "Drivers" → "Node.js"
4. Copy the connection string

## Step 6: Update .env File
Replace the MONGODB_URI in `.env` with your connection string:

```env
MONGODB_URI=mongodb+srv://chelky:chelky2025@your-cluster-name.mongodb.net/chelky_threads?retryWrites=true&w=majority
```

## Step 7: Verify Connection
Test the connection:
```bash
npm run server
# Should see: "✅ Connected to MongoDB successfully"
```

## Troubleshooting
- **ENOTFOUND error**: Check your cluster name and username/password
- **Authentication failed**: Wrong password or user not created
- **Connection timeout**: Check Network Access settings allow your IP

## Testing with cURL
```bash
curl http://localhost:5000/api/status
```

Expected response:
```json
{
  "server": "Running",
  "database": "Connected to MongoDB",
  "port": 5000,
  "environment": "development"
}
```
