# Aadhya Pharmex Distribution DMS

A comprehensive, responsive Pharmaceutical Distribution Management System (DMS) built with the MERN stack (MongoDB, Express, React, Node.js). 

## Overview
Aadhya Pharmex DMS is an enterprise-grade application designed to streamline pharmaceutical supply chains, offering complete control over:
- Live Inventory and Stock Allocation
- Real-time Dashboard with WebSocket (Socket.io) Updates
- Delivery Tracking and Dispatch Control
- Retailer Network Management
- Purchase and GRN Processing
- Scheme and Promotion Management
- GST, Billing, and Regulatory Compliance Tracking (Automated Cron Jobs)

## Features
- **Frontend App (`pharma-app`):** Built with React 19 + Vite 6. Features a beautifully styled, custom UI using `theme.js` with responsive layouts, comprehensive modals, and dynamic KPI charts. Uses a custom `useDashboardData` hook for real-time polling and WebSocket synchronization.
- **Backend API (`pharma-api`):** Built with Node.js and Express. Connects to MongoDB via Mongoose. Protected by JWT middleware.
- **Real-Time Engine:** Uses `Socket.io` to instantly push order updates to connected clients.
- **Background Cron Jobs:** Powered by `node-cron` to automatically compute heavy sales aggregations every 30 minutes, and to monitor expiring inventory and drug licenses every hour to generate notifications.
- **Modals System:** A highly interactive experience for creating new orders, stocks, dispatches, retailers, purchases, schemes, and invoices directly from the dashboard.

## Project Structure
The repository contains two main directories:
1. `pharma-app/` - The React frontend application.
   - `src/pages/` - Dashboard, Orders, Inventory, Delivery, Retailers, Purchase, Schemes, Billing, Compliance, Settings, Auth.
   - `src/components/` - Reusable UI components including Layout, Charts, Modals, and standard UI elements.
   - `src/hooks/` - Contains real-time custom hooks (e.g., `useDashboardData.js`).
2. `pharma-api/` - The Node.js/Express backend server.
   - `models/` - 11 Mongoose schemas (User, Otp, Order, OrderItem, Product, Inventory, Retailer, Invoice, Company, Notification, DashboardCache).
   - `routes/` - Specific endpoint routers (e.g., `dashboard.js`).
   - `cron/` - Background schedule definitions.
   - `middleware/` - JWT authentication guards.
   - `server.js` - Main Express/Socket.io server entry point.

## Tech Stack
- **Frontend Framework:** React 19 + Vite 6
- **Backend Framework:** Node.js + Express
- **Database:** MongoDB + Mongoose
- **Real-time & Background:** Socket.io + Node-Cron
- **Styling:** Vanilla CSS (`index.css`) + Custom Design System (`theme.js`)
- **Icons:** Tabler Icons

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB Server running locally on port 27017

### Installation & Running

1. **Clone the repository**
   ```bash
   git clone https://github.com/Arshitraj-123/Adhya-Pharmex.git
   ```

2. **Start the Backend**
   ```bash
   cd Adhya-Pharmex/pharma-api
   npm install
   node server.js
   ```

3. **Start the Frontend** (in a new terminal)
   ```bash
   cd Adhya-Pharmex/pharma-app
   npm install
   npm run dev
   ```

## License
© Aadhya Pharmex 2026. All Rights Reserved.
