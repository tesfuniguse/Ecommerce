# Ethiopian Leather Premium Heritage Store 🇪🇹🛡️
### የኢትዮጵያ ሌዘር - Premium Full-Stack E-Commerce & Management Platform

A highly polished, full-stack, enterprise-grade e-commerce application celebrating authentic Ethiopian leather craftsmanship. Powered by a modern architecture combining a highly interactive React 19 single-page frontend, a robust Express backend with WebSocket-based real-time event distribution, AI-powered product insights, and integrated localized payment options.

---

## 🌟 Key Features

### 🛒 Elegant Shopping Experience
- **Responsive Catalog & Bento Grid**: Immersive typography and adaptive bento layouts designed for modern desktop displays down to ultra-compact mobile screens.
- **Multilingual Support**: Real-time localization toggle between English and Amharic (`en`/`am`) spanning all labels, core descriptions, categories, and AI summaries.
- **Dual-Mode Portals**: Seamless transition between Customer Storefront, Seller Portal, and Administrative Dashboard for analytical reports.

### ⚡ Technical Capabilities
- **Real-Time Dispatch (WebSockets)**: Instantaneous order updates, promotional announcements, and low-stock indicators broadcasted securely over WebSockets.
- **Gemini-Powered AI Intelligence**: Automated smart recommendations, product analysis, localized Amharic translations, and descriptive summaries.
- **Flexible Data Store**: A robust hybrid engine utilizing a fallback local JSON-file filesystem for frictionless local testing and MongoDB Atlas cloud synchronization for durable production scale.
- **Interactive QR & PDF Utility**: Generates clean printable receipt invoices in PDF format with secure embedded checkout QR codes parsed via `jsQR`.
- **Integrated Telebirr Payment Gateway**: Secure placeholder parameters and step-by-step transactional routing modeled for the mobile-first Ethiopian ecosystem.

---

## 🛠️ Tech Stack

- **Frontend**: 
  - [React 19](https://react.dev/) + [Vite 6](https://vite.dev/)
  - [Tailwind CSS v4](https://tailwindcss.com/) for display precision and modular utilities
  - [Motion](https://motion.dev/) (from `motion/react`) for smooth Micro-animations and staggered transitions
  - [Recharts](https://recharts.org/) for modern analytical dashboards and seller metrics
  - [Lucide React](https://lucide.dev/) for crisp vector symbols
- **Backend & Utilities**:
  - [Express 4](https://expressjs.com/) on Node.js running [TypeScript (TSX)](https://github.com/privatenumber/tsx)
  - [ws](https://github.com/websockets/ws) for low-overhead real-time bi-directional WebSockets
  - [esbuild](https://esbuild.github.io/) for bundling server-side TypeScript files into optimized production-ready ES code
  - [jsPDF](https://github.com/parallax/jsPDF) and [jsQR](https://github.com/cozmo/jsQR) for invoices and security codes

---

## 📋 System Prerequisites

Ensure you have the following installed on your local workstation:
- **Node.js**: `v18.0.0` or higher (recommended: `v20.x` LTS)
- **NPM**: `v9.0.0` or higher (packaged with Node.js) or **Yarn** / **PNPM**

---

## 🚀 Getting Started (Installation & Setup)

Follow these steps to run the application on your local machine:

### 1. Clone & Navigate
Unpack the source files into your local environment:
```bash
git clone <repository-url>
cd ethiopian-leather-store
```

### 2. Install Dependencies
Install all production and developer packages declared in `package.json`:
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory and define the required parameters based on `.env.example`:
```bash
cp .env.example .env
```

Open the `.env` file and populate the configuration keys:
```env
# Google Gemini Pro/Flash API Key for AI recommendation mechanisms
GEMINI_API_KEY="your-gemini-api-key-here"

# Publicly accessible URL for your server (defaults to http://localhost:3000 in local development)
APP_URL="http://localhost:3000"

# Optional: MongoDB Atlas cloud database connection.
# If omitted, the server automatically defaults to server-safe JSON file fallback storage.
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/your-db"

# Telebirr payment credentials for sandbox or production gateways
TELEBIRR_APP_ID="your_app_id"
TELEBIRR_APP_KEY="your_app_key"
TELEBIRR_MERCHANT_CODE="your_merchant_code"
TELEBIRR_SHORT_CODE="your_short_code"
TELEBIRR_PUBLIC_KEY="your_public_key"
TELEBIRR_PRIVATE_KEY="your_private_key"
```

---

## 🏃 Available Scripts

You can execute the following NPM commands in your terminal:

### Development Environment
Starts the application in active development mode. It bootstraps the Express API server and hooks the Vite middleware directly to serve hot-reloaded assets on port `3000`:
```bash
npm run dev
```
Open your browser and navigate to: `http://localhost:3000`

### Code Quality Verification (Linter)
Verifies type integrity, matches declarations, and catches fatal structural code bugs:
```bash
npm run lint
```

### Production Build & Compilation
Vite compiles the React client-side SPA into static assets in `dist/`, and `esbuild` bundles the Express server-side entry point into a single production-safe CommonJS module (`dist/server.cjs`):
```bash
npm run build
```

### Production Execution
Launches the optimized production server. (Note: Run `npm run build` at least once before executing this command):
```bash
npm run start
```

### Project Clean
Removes build folders, stale outputs, and cached runtime JSON items to reset the directory:
```bash
npm run clean
```

---

## 📁 Key File Structure

```text
├── .env.example              # Template containing all environment variable flags
├── package.json              # Configured build scripts and packages
├── server.ts                 # Express full-stack entrance file & API gateway
├── vite.config.ts            # Vite integration configuration and Tailwind plugins
├── index.html                # Main SPA page frame
├── src/
│   ├── main.tsx              # Front-end React entry point
│   ├── App.tsx               # Master App router and global view manager
│   ├── index.css             # Tailwind v4 theme layer, Google fonts, and styles
│   ├── types.ts              # Shared data definitions and interfaces
│   ├── components/           # Modular visual components
│   │   ├── Header.tsx        # High-performance adaptive navigation & menu
│   │   ├── Cart.tsx          # Shopping bag drawer with local persistence
│   │   ├── Checkout.tsx      # Secure checkout processor
│   │   ├── TelebirrPayment.tsx # Localized payment gateway interface
│   │   ├── OrderStatus.tsx   # Detailed tracking timelines & delivery charts
│   │   ├── AdminDashboard.tsx # Executive analytical controls with Recharts
│   │   ├── SellerDashboard.tsx # Exclusive inventory metrics and portals
│   │   └── CustomerDashboard.tsx # Personal orders history and notifications
│   └── data/                 # Local configurations & initial static catalogs
```

---

## 🔒 Security & Deployment Notes

1. **Client-Side Safety**: Secret tokens, encryption keys, and `GEMINI_API_KEY` are **never** exposed to the client browser. All Gemini interactions and Telebirr signatures are safely encapsulated and proxied through `/api/*` endpoints handled in the Express layer.
2. **Reverse Proxying**: The server binds to port `3000` on interface `0.0.0.0`, ensuring immediate compatibility with Cloud Run, Heroku, Docker container orchestrations, or custom VPS reverse proxies (Nginx/Apache).
3. **Database Portability**: The project features a dual storage adapter. In development, files inside `/data_store` are read and written synchronously. For a production-ready environment, providing a valid `MONGODB_URI` converts the architecture into a secure, fully-synced cloud database backend.
