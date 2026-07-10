# Google Cloud Run Deployment Guide (Free Tier Eligible)

This guide provides clear, step-by-step instructions on how to deploy this full-stack Express + Vite application directly to **Google Cloud Run** using your **Google Cloud Free Trial**.

Google Cloud Run is a fully managed serverless platform that automatically scales containerized applications. It offers an incredibly generous **always-free tier** that is perfect for hosting this application completely free of charge.

---

## 🎁 Google Cloud Run Free Tier Benefits
Your Google Cloud Run deployment fits comfortably within the always-free tier:
- **2 Million Requests** per month.
- **180,000 vCPU-seconds** and **360,000 GB-seconds** of memory per month.
- **120 Build minutes** per day via Cloud Build.
- **0.5 GB** of free container storage in Artifact Registry.

---

## 🚀 Step 1: Install & Set Up Google Cloud CLI
To interact with Google Cloud from your local machine, download and authorize the Google Cloud CLI (gcloud):

1. **Download and Install:**
   - **macOS (Homebrew):** `brew install --cask google-cloud-sdk`
   - **Windows (PowerShell):** Download the interactive installer from the [Google Cloud SDK Documentation](https://cloud.google.com/sdk/docs/install).
   - **Linux:** Run `curl https://sdk.cloud.google.com | bash`

2. **Initialize CLI and Authenticate:**
   Open your terminal and run:
   ```bash
   gcloud init
   ```
   *Follow the browser prompts to log in to your Google Account that has the active free trial.*

---

## 🛠️ Step 2: Configure your GCP Project
Before deploying, set up a Google Cloud Project and enable the required services:

1. **Create a New Project:**
   ```bash
   gcloud projects create my-ethiopian-leather-store --name="Ethiopian Leather Store"
   ```
   *(Replace `my-ethiopian-leather-store` with a unique ID of your choice)*

2. **Set the CLI to use this project:**
   ```bash
   gcloud config set project my-ethiopian-leather-store
   ```

3. **Enable Required APIs:**
   Enable Google Cloud Build and Google Cloud Run services for your project:
   ```bash
   gcloud services enable run.googleapis.com \
                          build.googleapis.com \
                          artifactregistry.googleapis.com
   ```

---

## 📦 Step 3: Deploy with a Single Command
Because this workspace contains a pre-configured production `Dockerfile` and `.dockerignore`, you can build and deploy the app directly using the Google Cloud Build service:

Run the following command in the root folder of your project:
```bash
gcloud run deploy ethiopian-leather-store \
    --source . \
    --region europe-west2 \
    --allow-unauthenticated \
    --set-env-vars=NODE_ENV=production
```

### What this command does:
1. **Compresses & Uploads:** Bundles your codebase safely (excluding ignored local folders like `node_modules`).
2. **Builds Container Securely:** Triggers a serverless build in Cloud Build using the multi-stage `Dockerfile`.
3. **Pushes Image:** Registers the optimized runtime image in the Artifact Registry.
4. **Bootstraps Service:** Provisions your serverless container instance in the chosen region (e.g., `europe-west2` or `us-central1`).
5. **Sets Public Route:** Returns a secure live HTTPS URL for your application!

---

## 🔒 Step 4: Configure Environment Variables & Secrets
If your application uses specific environment keys (such as `MONGODB_URI` or `GEMINI_API_KEY`), you can supply them directly or inject them securely via the Google Cloud Console or the CLI.

To set your credentials securely:
```bash
gcloud run services update ethiopian-leather-store \
    --region europe-west2 \
    --set-env-vars="MONGODB_URI=your_mongodb_connection_string,GEMINI_API_KEY=your_gemini_api_key"
```

---

## 💡 Pro-Tips for Staying in the Free Tier
To guarantee that your service never incurs costs outside of your free tier, configure these resource caps:

- **Min/Max Instances:** Ensure that your service scales down to 0 instances when not in use so you don't consume idle resources:
  ```bash
  gcloud run services update ethiopian-leather-store \
      --region europe-west2 \
      --min-instances 0 \
      --max-instances 2
  ```
- **Allocate Memory Wisely:** This compiled service is highly performant and requires minimal memory. 512MiB of RAM is perfect:
  ```bash
  gcloud run services update ethiopian-leather-store \
      --region europe-west2 \
      --memory 512MiB
  ```
