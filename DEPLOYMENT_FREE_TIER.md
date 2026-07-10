# 🌐 Best Free Deployment Websites Guide

This full-stack application (Express backend + React/Vite frontend) is fully compatible with popular free cloud-hosting platforms. Here are the **two absolute best free options** to deploy your live website in minutes without needing a credit card:

---

## Option 1: Render (Fully Free, Recommended for Web Servers)
[Render](https://render.com/) offers a fantastic **Free Tier** for web services that connects directly to your GitHub repository and deploys web servers automatically.

### Why Render is Great:
- Fully supports background WebSockets and dynamic API calls.
- Deploys straight from your code repository.
- Free SSL certificates included automatically.

### 🚀 Step-by-Step Deployment on Render:
1. **Export Code to GitHub:**
   - Push your code workspace to a public or private GitHub repository.
2. **Create a Free Account:**
   - Visit [Render.com](https://render.com/) and sign up (using your GitHub account for single-click integration).
3. **Configure New Web Service:**
   - Click the blue **"New +"** button in the dashboard and select **"Web Service"**.
   - Connect your newly created GitHub repository.
4. **Define Settings:**
   - **Name:** `ethiopian-leather-store` (or any custom name)
   - **Language:** `Node`
   - **Branch:** `main` (or your active development branch)
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start`
   - **Instance Type:** Select **"Free"** ($0/month)
5. **Set Environment Variables:**
   - Under the **"Environment"** tab, add any necessary environment variables (e.g. `GEMINI_API_KEY` for AI features).
6. **Click Deploy!**
   - Render will build the React assets, compile the Express server, and give you a live shareable public URL (e.g., `https://your-app.onrender.com`).

---

## Option 2: Vercel (Hobby Tier - Fast, Elegant & Serverless)
[Vercel](https://vercel.com/) is the premium hosting platform built by the creators of Next.js. It features a robust, global serverless architecture with an incredibly generous **Hobby Tier** (100% free).

### Why Vercel is Great:
- Instant global Edge CDN makes the website load with lightning-fast speeds.
- Built-in continuous deployment (deploys every time you push to GitHub).
- Zero-configuration required because we have preconfigured your project's `vercel.json` file in the root directory!

### 🚀 Step-by-Step Deployment on Vercel:
1. **Push Code to GitHub:**
   - Ensure your latest workspace files (including the root `vercel.json` file) are pushed to GitHub.
2. **Sign up on Vercel:**
   - Go to [Vercel.com](https://vercel.com/) and register using your GitHub credentials.
3. **Import Project:**
   - Click **"Add New"** > **"Project"** in the top right.
   - Choose your repository from the imported list.
4. **Confirm Environment Keys:**
   - Under the **"Environment Variables"** drop-down, add any custom tokens (e.g. `GEMINI_API_KEY` if required).
5. **Deploy:**
   - Click **"Deploy"**. Vercel will instantly map your Express routes using its `@vercel/node` serverless runtime and host your static Vite assets on its global network!

---

## Option 3: Google Cloud Run (Always Free Tier)
Don't forget! We also generated a complete Cloud Run instructions file in **`DEPLOYMENT_GCP.md`** located in the root of this workspace. 

Google Cloud's **Always Free Tier** gives you up to **2 million requests per month** completely free on Cloud Run, making it an incredibly powerful professional deployment option. Refer to `DEPLOYMENT_GCP.md` for CLI deployment instructions!
