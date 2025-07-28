# Railway Deployment Guide

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

1. Push your code to GitHub
2. Connect your GitHub repository to Railway
3. Set the environment variables in Railway dashboard
4. Deploy!

⚠️ **Important**: You'll need to scan the QR code from Railway logs to authenticate WhatsApp Web.
