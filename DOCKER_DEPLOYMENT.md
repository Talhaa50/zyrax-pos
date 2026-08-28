# Docker Deployment Guide - Test Locally First!

## Prerequisites

1. **Install Docker Desktop** from https://www.docker.com/products/docker-desktop
2. Make sure Docker is running (you'll see the whale icon in your taskbar)

## Quick Start - Test Locally

### Option 1: Using Docker Compose (Easiest)

```bash
# Navigate to project root
cd /home/talha/zyrax-pos

# Build and run the container
docker-compose up --build

# Wait for the build to complete (1-2 minutes first time)
# Once you see: "Retailer API running on port 3001"
# Open: http://localhost:3001 in your browser
```

**To stop:** Press `Ctrl+C` in the terminal

**To view logs again:**
```bash
docker-compose logs -f
```

**Clean up:**
```bash
docker-compose down
```

---

### Option 2: Manual Docker Commands

```bash
# Build the image
docker build -t zyrax-pos:latest .

# Run the container
docker run -d \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e AUTH_SECRET=your_secret_here \
  -e RETAILER_ADMIN_PASSWORD=admin123 \
  -e RETAILER_CASHIER_PASSWORD=cashier123 \
  -v $(pwd)/server/data:/app/server/data \
  -v $(pwd)/server/public/uploads:/app/server/public/uploads \
  --name zyrax-pos \
  zyrax-pos:latest

# View logs
docker logs -f zyrax-pos

# Stop the container
docker stop zyrax-pos

# Remove the container
docker rm zyrax-pos
```

---

## Testing

Once running, test these endpoints:

```bash
# Health check
curl http://localhost:3001/api/health

# Login (should work!)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@retailer.com","password":"admin123"}'

# Open frontend
open http://localhost:3001
```

---

## Environment Variables

For testing locally with Docker, create a `.env.docker` file:

```
AUTH_SECRET=your_random_secret_here_at_least_32_chars
RETAILER_ADMIN_PASSWORD=admin123
RETAILER_CASHIER_PASSWORD=cashier123
BARCODE_API_KEY=
```

Then run:
```bash
docker-compose --env-file .env.docker up --build
```

---

## What Gets Tested?

✅ **Complete Production Setup:**
- Frontend builds correctly
- Backend serves frontend + API on same port
- Database initializes with default users
- Login works
- File uploads work
- Everything in a single Docker container

This is **exactly** what will run on Render, Railway, Heroku, DigitalOcean, or any cloud platform!

---

## Common Issues & Solutions

### Port 3001 Already in Use?
```bash
# Kill the process using port 3001
# On Mac/Linux:
lsof -i :3001 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Then try docker-compose up again
```

### Build Takes Too Long?
Docker caches layers, so next builds are faster. First build installs all dependencies.

### Container Exits Immediately?
```bash
docker logs zyrax-pos
# Check the error output
```

### Database Issues?
```bash
# Clear database and start fresh
rm -rf server/data/pos_data.db*
docker-compose up --build
```

---

## Deploying After Testing

Once you confirm everything works in Docker locally:

1. **Render:** Push the repo, Render auto-detects Dockerfile
2. **Railway:** Same - auto-detects Dockerfile  
3. **DigitalOcean App Platform:** Point to your GitHub repo
4. **AWS/Azure/GCP:** Push to container registry

All support Docker out of the box!

---

## Monitoring Locally

```bash
# View real-time logs
docker-compose logs -f

# Check container stats
docker stats

# Access container shell
docker exec -it zyrax-pos sh
```

---

That's it! Docker gives you peace of mind before production deployment.
