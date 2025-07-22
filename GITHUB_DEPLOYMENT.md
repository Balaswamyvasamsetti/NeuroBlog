# Deploying NeuroBlog to GitHub

This guide explains how to deploy NeuroBlog to GitHub Pages and set up the repository.

## Prerequisites

- GitHub account
- Git installed on your local machine
- Node.js and npm installed

## Step 1: Create a GitHub Repository

1. Log in to your GitHub account
2. Click on the "+" icon in the top right corner and select "New repository"
3. Name your repository "NeuroBlog"
4. Choose public or private visibility as needed
5. Click "Create repository"

## Step 2: Push Your Code to GitHub

```bash
# Initialize git if not already done
git init

# Add the remote repository
git remote add origin https://github.com/yourusername/NeuroBlog.git

# Add all files
git add .

# Commit the changes
git commit -m "Initial commit"

# Push to GitHub
git push -u origin main
```

## Step 3: Configure GitHub Pages

1. Go to your repository on GitHub
2. Click on "Settings"
3. Scroll down to "GitHub Pages" section
4. Select "gh-pages" branch as the source
5. Click "Save"

## Step 4: Update Configuration

1. In `client/package.json`, update the homepage field:
   ```json
   "homepage": "https://yourusername.github.io/NeuroBlog",
   ```

2. If you have a custom domain:
   - Add your domain to the CNAME file in `client/public/CNAME`
   - Configure your domain's DNS settings to point to GitHub Pages

## Step 5: Deploy

The GitHub Actions workflow will automatically deploy your site when you push to the main branch.

To manually deploy:

```bash
# Build the client
cd client
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## Accessing Your Deployed Site

Your site will be available at:
- https://yourusername.github.io/NeuroBlog
- Or your custom domain if configured

## Troubleshooting

- If the site doesn't deploy, check the Actions tab in your GitHub repository for error logs
- Ensure all environment variables are properly set in GitHub repository settings
- For API calls, you may need to update the base URL in your client code to point to your backend server

## Backend Deployment

Note that GitHub Pages only hosts static content. For the backend:
1. Deploy the server to a service like Heroku, Vercel, or Render
2. Update the API base URL in the client code to point to your deployed backend
3. Set up environment variables on your backend hosting service