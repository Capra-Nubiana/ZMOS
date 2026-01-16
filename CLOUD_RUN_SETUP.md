# Google Cloud Run Deployment Setup

This guide will walk you through setting up automated deployment to Google Cloud Run for the ZMOS backend.

## Prerequisites

- Google Cloud account
- GitHub repository access (Capra-Nubiana/ZMOS)
- `gcloud` CLI installed locally (optional, for command-line setup)

---

## Step 1: Create/Select GCP Project

1. **Go to Google Cloud Console:**
   https://console.cloud.google.com

2. **Create a new project** or select existing:
   - Click on the project dropdown (top left)
   - Click "New Project"
   - Name: `zmos-backend` (or your preferred name)
   - Note your **Project ID** (you'll need this later)

---

## Step 2: Enable Required APIs

Go to: https://console.cloud.google.com/apis/library

Enable the following APIs:
- ✅ **Cloud Run API**
- ✅ **Artifact Registry API**
- ✅ **Cloud Build API**
- ✅ **Secret Manager API**
- ✅ **Cloud SQL Admin API** (if using Cloud SQL for Postgres)

**Quick command-line method:**
```bash
gcloud services enable run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  sqladmin.googleapis.com
```

---

## Step 3: Create Artifact Registry Repository

1. **Go to Artifact Registry:**
   https://console.cloud.google.com/artifacts

2. **Create Repository:**
   - Click "CREATE REPOSITORY"
   - **Name:** `zmos`
   - **Format:** Docker
   - **Location type:** Region
   - **Region:** `us-central1` (or your preferred region)
   - Click "CREATE"

**Command-line method:**
```bash
gcloud artifacts repositories create zmos \
  --repository-format=docker \
  --location=us-central1 \
  --description="ZMOS Backend Docker images"
```

---

## Step 4: Set Up Database (PostgreSQL)

### Option A: Cloud SQL (Recommended for Production)

1. **Go to Cloud SQL:**
   https://console.cloud.google.com/sql

2. **Create Instance:**
   - Click "CREATE INSTANCE"
   - Choose "PostgreSQL"
   - **Instance ID:** `zmos-postgres`
   - **Password:** Set a strong password
   - **Region:** `us-central1` (same as Cloud Run)
   - **Machine type:** Shared core (for testing) or dedicated (for production)
   - Click "CREATE INSTANCE"

3. **Get Connection Name:**
   - After creation, note the **Connection name** (format: `project-id:region:instance-id`)
   - You'll use this for the DATABASE_URL

4. **Create Database:**
   ```bash
   gcloud sql databases create zmos --instance=zmos-postgres
   ```

5. **DATABASE_URL format for Cloud SQL:**
   ```
   postgresql://USER:PASSWORD@/zmos?host=/cloudsql/PROJECT-ID:REGION:INSTANCE-ID
   ```

### Option B: External PostgreSQL (e.g., Railway, Supabase, Neon)

Use your existing PostgreSQL connection string.

---

## Step 5: Create Service Account

1. **Go to IAM & Admin > Service Accounts:**
   https://console.cloud.google.com/iam-admin/serviceaccounts

2. **Create Service Account:**
   - Click "CREATE SERVICE ACCOUNT"
   - **Name:** `github-actions-deployer`
   - **Description:** "Service account for GitHub Actions to deploy to Cloud Run"
   - Click "CREATE AND CONTINUE"

3. **Grant Roles:**
   Add the following roles:
   - ✅ **Cloud Run Admin** (`roles/run.admin`)
   - ✅ **Artifact Registry Writer** (`roles/artifactregistry.writer`)
   - ✅ **Service Account User** (`roles/iam.serviceAccountUser`)
   - ✅ **Secret Manager Secret Accessor** (`roles/secretmanager.secretAccessor`)

   Click "CONTINUE" then "DONE"

4. **Create Key:**
   - Click on the service account you just created
   - Go to "KEYS" tab
   - Click "ADD KEY" > "Create new key"
   - Choose **JSON** format
   - Click "CREATE"
   - **Save this JSON file securely** - you'll add it to GitHub Secrets

**Command-line method:**
```bash
# Create service account
gcloud iam service-accounts create github-actions-deployer \
  --description="GitHub Actions deployer" \
  --display-name="GitHub Actions Deployer"

# Grant roles
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:github-actions-deployer@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:github-actions-deployer@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:github-actions-deployer@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:github-actions-deployer@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Create key
gcloud iam service-accounts keys create key.json \
  --iam-account=github-actions-deployer@PROJECT_ID.iam.gserviceaccount.com
```

---

## Step 6: Create Secrets in Secret Manager

1. **Go to Secret Manager:**
   https://console.cloud.google.com/security/secret-manager

2. **Create the following secrets:**

### Secret: DATABASE_URL
- Click "CREATE SECRET"
- **Name:** `DATABASE_URL`
- **Secret value:** Your PostgreSQL connection string
  ```
  postgresql://user:password@host:5432/zmos
  ```
- Click "CREATE SECRET"

### Secret: JWT_SECRET
- **Name:** `JWT_SECRET`
- **Secret value:** A random secure string (generate with: `openssl rand -base64 32`)
- Click "CREATE SECRET"

### Secret: GOOGLE_CLIENT_ID
- **Name:** `GOOGLE_CLIENT_ID`
- **Secret value:** Your Google OAuth Client ID
- Click "CREATE SECRET"

### Secret: GEMINI_API_KEY
- **Name:** `GEMINI_API_KEY`
- **Secret value:** Your Google Gemini API key
- Click "CREATE SECRET"

**Command-line method:**
```bash
# DATABASE_URL
echo -n "postgresql://user:pass@host:5432/zmos" | \
  gcloud secrets create DATABASE_URL --data-file=-

# JWT_SECRET
openssl rand -base64 32 | \
  gcloud secrets create JWT_SECRET --data-file=-

# GOOGLE_CLIENT_ID
echo -n "your-client-id" | \
  gcloud secrets create GOOGLE_CLIENT_ID --data-file=-

# GEMINI_API_KEY
echo -n "your-api-key" | \
  gcloud secrets create GEMINI_API_KEY --data-file=-
```

---

## Step 7: Configure GitHub Secrets

1. **Go to GitHub Repository Settings:**
   https://github.com/Capra-Nubiana/ZMOS/settings/secrets/actions

2. **Add the following secrets:**

### Secret: GCP_PROJECT_ID
- Click "New repository secret"
- **Name:** `GCP_PROJECT_ID`
- **Value:** Your GCP Project ID (e.g., `zmos-backend-123456`)
- Click "Add secret"

### Secret: GCP_SA_KEY
- Click "New repository secret"
- **Name:** `GCP_SA_KEY`
- **Value:** Entire contents of the service account JSON key file you downloaded in Step 5
- Click "Add secret"

---

## Step 8: Initial Deployment

### Option A: Push to GitHub (Automatic)

Simply push your code to the `main` branch:
```bash
git push origin main
```

The GitHub Actions workflow will automatically:
1. Build the Docker image
2. Push to Artifact Registry
3. Deploy to Cloud Run

### Option B: Manual Deployment

```bash
# Authenticate
gcloud auth login

# Set project
gcloud config set project PROJECT_ID

# Build and deploy
gcloud run deploy zmos-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

---

## Step 9: Verify Deployment

1. **Check GitHub Actions:**
   https://github.com/Capra-Nubiana/ZMOS/actions

   The workflow should complete successfully.

2. **Get Service URL:**
   ```bash
   gcloud run services describe zmos-backend \
     --region us-central1 \
     --format 'value(status.url)'
   ```

3. **Test the API:**
   ```bash
   curl https://zmos-backend-xxxxx-uc.a.run.app/health
   ```

---

## Step 10: Database Migration

After first deployment, run Prisma migrations:

```bash
# Install Cloud SQL Proxy locally
gcloud sql connect zmos-postgres --user=postgres

# Or use Cloud Shell
gcloud cloud-shell ssh

# Clone repo and run migrations
git clone https://github.com/Capra-Nubiana/ZMOS.git
cd ZMOS
npm install
npx prisma migrate deploy
```

---

## Additional Configuration

### Enable CORS (if needed)

The backend should handle CORS in code, but you can also configure it at Cloud Run level.

### Custom Domain

1. Go to Cloud Run service
2. Click "MANAGE CUSTOM DOMAINS"
3. Follow the wizard to add your domain

### Monitoring

1. **Logs:** https://console.cloud.google.com/logs
2. **Metrics:** https://console.cloud.google.com/run/detail/us-central1/zmos-backend/metrics

### Cost Management

- **Set budget alerts:** https://console.cloud.google.com/billing/budgets
- Cloud Run free tier: 2 million requests/month
- Estimated cost for low traffic: $5-20/month

---

## Environment Variables Reference

| Variable | Description | Where to set |
|----------|-------------|--------------|
| `DATABASE_URL` | PostgreSQL connection string | Secret Manager |
| `JWT_SECRET` | Secret for JWT signing | Secret Manager |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Secret Manager |
| `GEMINI_API_KEY` | Google Gemini API key | Secret Manager |
| `NODE_ENV` | Environment (production) | Workflow (set automatically) |
| `PORT` | Server port | Cloud Run (set automatically to 8080) |

---

## Troubleshooting

### Build fails
- Check GitHub Actions logs
- Verify service account has correct permissions
- Ensure Artifact Registry repository exists

### Deployment fails
- Check that all secrets exist in Secret Manager
- Verify database connection string
- Check Cloud Run service logs

### Database connection fails
- Verify DATABASE_URL is correct
- For Cloud SQL, ensure Cloud SQL Proxy is configured
- Check that Prisma migrations have run

### 403 Permission errors
- Verify service account has all required roles
- Check that secrets are accessible

---

## Security Best Practices

✅ Use Secret Manager for all sensitive data
✅ Enable VPC connector for private database access
✅ Use Cloud Armor for DDoS protection
✅ Enable Cloud Audit Logs
✅ Set up budget alerts
✅ Use least-privilege IAM roles
✅ Rotate service account keys regularly

---

## Next Steps

- [ ] Set up staging environment (separate Cloud Run service)
- [ ] Configure CI/CD for develop branch
- [ ] Set up Cloud SQL backups
- [ ] Configure uptime monitoring
- [ ] Add custom domain
- [ ] Set up Cloud CDN (if needed)

---

**🎉 You're all set!** Your ZMOS backend will now automatically deploy to Cloud Run on every push to `main`.
