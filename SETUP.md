# Setup Guide - Smart WhatsApp Bot

## Environment Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

1. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and add your actual values:
   - **GEMINI_API_KEY**: Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Update other settings as needed

### 3. Required Files

Make sure you have the following files in your project directory:

- `techcorp_data.txt` - Your company data file (or update COMPANY_DATA_FILE in .env)

### 4. Run the Bot

```bash
npm start
```

## Configuration Options

### API Settings

- `GEMINI_API_KEY`: Your Google Gemini API key (required)
- `GEMINI_ENDPOINT`: API endpoint (default provided)

### Bot Limits

- `MAX_HISTORY_SIZE`: Messages to keep in user history (default: 10)
- `MAX_USERS`: Maximum users to track (default: 1000)
- `MAX_PROCESSED_MESSAGES`: Memory limit for processed messages (default: 1000)
- `MIN_MESSAGE_INTERVAL`: Minimum time between messages from same user in ms (default: 1000)

### AI Settings

- `AI_TEMPERATURE`: Response creativity 0.0-1.0 (default: 0.7)
- `AI_MAX_OUTPUT_TOKENS`: Maximum response length (default: 2000)

### File Paths

- `COMPANY_DATA_FILE`: Path to your company data file (default: techcorp_data.txt)
- `APP_LOG_FILE`: Application log file name (default: app.log)
- `QUERIES_LOG_FILE`: User queries log file (default: queries.log)

### Logging

- `LOG_MAX_SIZE`: Maximum log file size in bytes (default: 10MB)

### Network Settings

- `FETCH_RETRIES`: Number of retry attempts for API calls (default: 2)
- `FETCH_RETRY_DELAY`: Delay between retries in ms (default: 500)

## Security Notes

- Never commit your `.env` file to version control
- Keep your API keys secure and rotate them regularly
- The `.env` file is already added to `.gitignore`
