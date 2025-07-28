# Railway Deployment Guide

## 🚀 Web Interface for WhatsApp Authentication

Your bot now includes a beautiful web interface for QR code scanning! After deployment, you can access it at your Railway app URL.

## Environment Variables to Set in Railway Dashboard

Set these environment variables in your Railway project dashboard:

### Required Variables:

```
GEMINI_API_KEY=your_actual_gemini_api_key
GEMINI_ENDPOINT=https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent
```

### Optional Variables (with defaults):

```
COMPANY_DATA_FILE=techcorp_data.txt
APP_LOG_FILE=app.log
QUERIES_LOG_FILE=queries.log
LOG_MAX_SIZE=10485760
MAX_HISTORY_SIZE=10
MAX_USERS=1000
MAX_PROCESSED_MESSAGES=1000
MIN_MESSAGE_INTERVAL=1000
AI_TEMPERATURE=0.7
AI_MAX_OUTPUT_TOKENS=2000
FETCH_RETRIES=2
FETCH_RETRY_DELAY=500
NODE_ENV=production
```

## Deployment Steps:

1. **Install Express dependency locally (if testing)**:

   ```bash
   npm install express
   ```

2. **Push your code to GitHub**:

   ```bash
   git add .
   git commit -m "Add web interface for WhatsApp authentication"
   git push origin main
   ```

3. **Deploy on Railway**:

   - Connect your GitHub repository to Railway
   - Set the environment variables in Railway dashboard
   - Deploy!

4. **Access Web Interface**:
   - After deployment, Railway will provide you with a URL (e.g., `your-app-name.up.railway.app`)
   - Visit that URL in your browser
   - You'll see a beautiful interface with the QR code
   - Scan the QR code with WhatsApp on your phone
   - The interface will show real-time status updates

## ✨ Features of the Web Interface:

- 🎨 **Beautiful UI** - Modern, responsive design
- 📱 **Clear QR Code** - No more distorted terminal QR codes
- 📊 **Real-time Status** - Live updates on connection status
- 📋 **System Logs** - Monitor bot activity
- ✅ **Success Confirmation** - Clear indication when connected
- 📱 **Mobile Friendly** - Works perfectly on phones and tablets

## 🔧 How It Works:

1. **Initialization** - Bot starts and shows "Initializing..." status
2. **QR Generation** - When ready, displays a clear QR code
3. **Scanning** - Instructions guide you through WhatsApp linking
4. **Authentication** - Real-time feedback when you scan
5. **Success** - Confirmation screen when bot is online
6. **Monitoring** - Ongoing logs and status updates

## 📱 WhatsApp Linking Steps:

1. Open WhatsApp on your phone
2. Go to Settings → Linked Devices (or tap ⋮ menu → Linked Devices)
3. Tap "Link a Device"
4. Scan the QR code shown on the web interface
5. Wait for confirmation - the interface will update automatically!

## 🚨 Important Notes:

- The web interface URL will be shown in Railway deployment logs
- Keep the web page open while scanning the QR code
- The session will be saved, so you won't need to re-scan unless you restart the bot
- If QR code expires, refresh the page to get a new one

## 🎉 After Successful Connection:

Once connected, your bot will:

- ✅ Show "Connected Successfully" on the web interface
- ✅ Display connection time and status
- ✅ Start responding to WhatsApp messages automatically
- ✅ Log all activities in the web interface

Your WhatsApp bot is now ready with a professional web interface! 🤖
