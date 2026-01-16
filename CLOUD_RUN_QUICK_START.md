# Cloud Run Quick Start Guide

**Fastest way to get ZMOS backend running on Google Cloud Run**

---

## 🚀 Quick Setup (15 minutes)

### 1. Create GCP Project

```bash
# Set your project ID
export PROJECT_ID="zmos-backend"

# Create project
gcloud projects create $PROJECT_ID

# Set as active project
gcloud config set project $PROJECT_ID

# Link billing account (required)
gcloud billing accounts list
gcloud billing projects link $PROJECT_ID --billing-account=BILLING_ACCOUNT_ID
```

### 2. Enable APIs (One Command)

```bash
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  sqladmin.googleapis.com
```

### 3. Create Artifact Registry

```bash
gcloud artifacts repositories create zmos \
  --repository-format=docker \
  --location=us-central1 \
  --description="ZMOS Docker images"
```

### 4. Create Secrets

```bash
# Database URL (use your actual connection string)
echo -n "postgresql://user:password@host:5432/zmos" | \
  gcloud secrets create DATABASE_URL --data-file=-

# JWT Secret (generates random secret)
openssl rand -base64 32 | \
  gcloud secrets create JWT_SECRET --data-file=-

# Google Client ID
echo -n "YOUR_GOOGLE_CLIENT_ID" | \
  gcloud secrets create GOOGLE_CLIENT_ID --data-file=-

# Gemini API Key
echo -n "YOUR_GEMINI_API_KEY" | \
  gcloud secrets create GEMINI_API_KEY --data-file=-
```

### 5. Create Service Account for GitHub

```bash
# Create service account
gcloud iam service-accounts create github-actions-deployer \
  --display-name="GitHub Actions Deployer"

# Grant required roles
for ROLE in run.admin artifactregistry.writer iam.serviceAccountUser secretmanager.secretAccessor
do
  gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:github-actions-deployer@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/${ROLE}"
done

# Create and download key
gcloud iam service-accounts keys create github-sa-key.json \
  --iam-account=github-actions-deployer@${PROJECT_ID}.iam.gserviceaccount.com

echo "✅ Service account key saved to: github-sa-key.json"
echo "⚠️  Add this file's contents to GitHub Secrets as GCP_SA_KEY"
```

### 6. Add GitHub Secrets

Go to: **https://github.com/Capra-Nubiana/ZMOS/settings/secrets/actions**

**Add these two secrets:**

1. **GCP_PROJECT_ID**
   - Value: Your project ID (e.g., `zmos-backend`)

2. **GCP_SA_KEY**
   - Value: Entire contents of `github-sa-key.json` file

### 7. Deploy!

```bash
# Push to main branch
git push origin main
```

GitHub Actions will automatically build and deploy!

---

## 📊 Verify Deployment

### Check GitHub Actions
https://github.com/Capra-Nubiana/ZMOS/actions

### Get Service URL
```bash
gcloud run services describe zmos-backend \
  --region us-central1 \
  --format 'value(status.url)'
```

### Test API
```bash
SERVICE_URL=$(gcloud run services describe zmos-backend --region us-central1 --format 'value(status.url)')
curl $SERVICE_URL/health
```

---

## 🗄️ Database Options

### Option A: Use Existing PostgreSQL (Fastest)

If you already have PostgreSQL (Railway, Supabase, Neon, etc.):

```bash
# Just update the DATABASE_URL secret
echo -n "postgresql://user:password@host:5432/dbname" | \
  gcloud secrets versions add DATABASE_URL --data-file=-
```

### Option B: Create Cloud SQL PostgreSQL

```bash
# Create instance
gcloud sql instances create zmos-postgres \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password=CHANGE_THIS_PASSWORD

# Create database
gcloud sql databases create zmos --instance=zmos-postgres

# Get connection name
CONNECTION_NAME=$(gcloud sql instances describe zmos-postgres --format='value(connectionName)')

# Update secret with Cloud SQL connection string
echo -n "postgresql://postgres:YOUR_PASSWORD@/zmos?host=/cloudsql/${CONNECTION_NAME}" | \
  gcloud secrets versions add DATABASE_URL --data-file=-
```

---

## 🔧 Common Commands

### View Logs
```bash
gcloud run services logs read zmos-backend --region us-central1
```

### Update Environment Variable
```bash
gcloud run services update zmos-backend \
  --region us-central1 \
  --set-env-vars "KEY=VALUE"
```

### Update Secret
```bash
echo -n "new-value" | \
  gcloud secrets versions add SECRET_NAME --data-file=-
```

### Redeploy (Same Image)
```bash
gcloud run services update zmos-backend --region us-central1
```

### Scale Configuration
```bash
gcloud run services update zmos-backend \
  --region us-central1 \
  --min-instances 0 \
  --max-instances 10 \
  --memory 512Mi \
  --cpu 1
```

---

## 💰 Cost Estimate

**With minimal traffic (< 10k requests/month):**
- Cloud Run: **$0** (within free tier)
- Artifact Registry: **$0** (within free tier)
- Secret Manager: **$0.06/month** (per secret)
- Cloud SQL (db-f1-micro): **~$7/month**

**Total: ~$7-10/month** (mostly database)

**To minimize costs:**
- Use external PostgreSQL provider (Railway, Supabase free tier)
- Or use serverless PostgreSQL (Neon, PlanetScale)
- Cloud Run scales to zero when not used

---

## ⚡ Performance Tips

### 1. Keep Warm (Reduce Cold Starts)
```bash
gcloud run services update zmos-backend \
  --region us-central1 \
  --min-instances 1  # Keeps 1 instance always running
```

### 2. Increase Resources
```bash
gcloud run services update zmos-backend \
  --region us-central1 \
  --memory 1Gi \
  --cpu 2
```

### 3. Connection Pooling for Database
Already configured in Prisma schema. No action needed!

---

## 🔒 Security Checklist

- ✅ All secrets in Secret Manager (not environment variables)
- ✅ Service runs as non-root user (configured in Dockerfile)
- ✅ Health checks enabled
- ✅ HTTPS enforced by default
- ⚠️ Consider restricting `--allow-unauthenticated` for production
- ⚠️ Set up VPC connector for private database access
- ⚠️ Enable Cloud Armor for DDoS protection

---

## 🆘 Troubleshooting

### Deployment fails with permission error
```bash
# Check service account has all roles
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:github-actions-deployer@${PROJECT_ID}.iam.gserviceaccount.com"
```

### Database connection fails
```bash
# Test database connection
gcloud run services update zmos-backend \
  --region us-central1 \
  --set-env-vars "DEBUG=prisma:*"

# Check logs
gcloud run services logs read zmos-backend --region us-central1
```

### Service URL not working
```bash
# Check service status
gcloud run services describe zmos-backend --region us-central1

# Test health endpoint
curl $(gcloud run services describe zmos-backend --region us-central1 --format 'value(status.url)')/health
```

---

## 📚 Full Documentation

For complete setup guide with detailed explanations:
- See **CLOUD_RUN_SETUP.md**

For GCP Console UI setup:
- See **CLOUD_RUN_SETUP.md** Step 1-10

---

**Need help?** Check logs first:
```bash
gcloud run services logs tail zmos-backend --region us-central1
```
