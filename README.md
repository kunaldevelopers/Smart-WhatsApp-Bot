# 🤖 Smart WhatsApp Bot - AI-Powered Business Assistant

<div align="center">

![WhatsApp](https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![GitHub last commit](https://img.shields.io/github/last-commit/kunaldevelopers/Smart-WhatsApp-Bot)](https://github.com/kunaldevelopers/Smart-WhatsApp-Bot)

_An intelligent WhatsApp chatbot powered by Google Gemini AI for automated customer support and business interactions_

[🚀 Features](#-features) • [📦 Installation](#-installation) • [⚙️ Configuration](#️-configuration) • [🔧 Usage](#-usage) • [📖 Documentation](#-documentation)

</div>

---

## 🌟 Overview

Smart WhatsApp Bot is an advanced AI-powered chatbot designed for businesses to automate customer interactions on WhatsApp. Built with **Node.js** and integrated with **Google Gemini AI**, it provides intelligent responses based on your company data while maintaining conversation context and user history.

### ✨ Key Highlights

- 🧠 **AI-Powered Responses** - Leverages Google Gemini for intelligent conversations
- 💬 **WhatsApp Integration** - Seamless connection via WhatsApp Web
- 📊 **Context Awareness** - Maintains conversation history and user context
- 🔒 **Session Management** - Robust session handling with automatic recovery
- 📝 **Logging System** - Comprehensive logging for monitoring and analytics
- ⚡ **Rate Limiting** - Built-in protection against spam and abuse
- 🎨 **Rich Formatting** - WhatsApp-styled messages with emojis and formatting

---

## 🚀 Features

### 🤖 **AI & Automation**

- **Google Gemini Integration** - Advanced AI responses using company-specific data
- **Context-Aware Conversations** - Remembers previous interactions for better responses
- **Intelligent Greeting System** - Automated welcome messages for new users
- **Custom Response Formatting** - WhatsApp-optimized message formatting

### 🛡️ **Security & Reliability**

- **Environment Variable Protection** - Secure API key and configuration management
- **Session Recovery** - Automatic QR code regeneration on session failures
- **Rate Limiting** - Prevents spam and ensures fair usage
- **Error Handling** - Comprehensive error recovery and logging

### 📊 **Monitoring & Analytics**

- **Dual Logging System** - Separate logs for application events and user queries
- **Real-time Console Output** - Colorful, informative console feedback
- **Performance Metrics** - Response time tracking and statistics
- **User Activity Tracking** - Monitor user interactions and patterns

### ⚙️ **Configuration & Customization**

- **Environment-Based Configuration** - Easy setup via `.env` files
- **Configurable Limits** - Adjustable user limits, history size, and timeouts
- **Custom Company Data** - Load your own business information for AI responses
- **Flexible Deployment** - Supports various hosting environments

---

## 📦 Installation

### Prerequisites

- **Node.js** (v16.0.0 or higher)
- **npm** or **yarn** package manager
- **Google Gemini API Key** ([Get it here](https://makersuite.google.com/app/apikey))
- **WhatsApp Account** for bot connection

### Quick Start

1. **Clone the Repository**

   ```bash
   git clone https://github.com/kunaldevelopers/Smart-WhatsApp-Bot.git
   cd Smart-WhatsApp-Bot
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   cp .env.example .env
   ```

4. **Configure Your Bot**

   - Edit `.env` file with your API keys and settings
   - Add your company data to `techcorp_data.txt`

5. **Launch the Bot**

   ```bash
   npm start
   ```

6. **Scan QR Code**
   - Scan the displayed QR code with WhatsApp
   - Bot will be ready to receive messages!

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory with the following configuration:

```env
# 🔑 API Configuration
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_ENDPOINT=https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent

# 📁 File Paths
COMPANY_DATA_FILE=techcorp_data.txt
APP_LOG_FILE=app.log
QUERIES_LOG_FILE=queries.log

# 🎛️ Bot Configuration
MAX_HISTORY_SIZE=10
MAX_USERS=1000
MAX_PROCESSED_MESSAGES=1000
MIN_MESSAGE_INTERVAL=1000

# 🤖 AI Settings
AI_TEMPERATURE=0.7
AI_MAX_OUTPUT_TOKENS=2000

# 🔧 Advanced Settings
LOG_MAX_SIZE=10485760
FETCH_RETRIES=2
FETCH_RETRY_DELAY=500
```

### Company Data Setup

1. **Edit Company Data File**

   ```bash
   nano techcorp_data.txt
   ```

2. **Add Your Business Information**
   ```text
   Company: Your Company Name
   Services: List your services here
   Contact: Your contact information
   Pricing: Your pricing details
   FAQ: Frequently asked questions
   ```

---

## 🔧 Usage

### Starting the Bot

```bash
# Development
npm start

# With process manager (recommended for production)
pm2 start server.js --name "whatsapp-bot"

# With auto-restart on file changes
nodemon server.js
```

### Bot Commands & Interactions

| Trigger               | Response            | Description                              |
| --------------------- | ------------------- | ---------------------------------------- |
| `hi`, `hello`, `hey`  | Welcome message     | Automated greeting with company info     |
| Any business question | AI-powered response | Contextual answers based on company data |
| Unrelated queries     | Polite redirect     | Redirects to business-related topics     |

### Console Output

The bot provides real-time colored console output:

- 🟢 **Green**: Successful operations
- 🔵 **Blue**: Information and status updates
- 🟡 **Yellow**: Warnings and retries
- 🔴 **Red**: Errors and failures
- 🟣 **Magenta**: AI processing steps

---

## 📖 Documentation

### Project Structure

```
Smart-WhatsApp-Bot/
├── 📄 server.js              # Main application file
├── 📄 package.json           # Dependencies and scripts
├── 📄 .env                   # Environment configuration (create from .env.example)
├── 📄 .env.example           # Environment template
├── 📄 techcorp_data.txt      # Company data for AI responses
├── 📄 SETUP.md              # Detailed setup instructions
├── 📄 README.md             # This file
├── 📁 .wwebjs_auth/         # WhatsApp session data (auto-generated)
├── 📁 node_modules/         # Dependencies
├── 📄 app.log               # Application logs
└── 📄 queries.log           # User interaction logs
```

### API Integration

The bot integrates with:

- **WhatsApp Web.js**: For WhatsApp connectivity
- **Google Gemini AI**: For intelligent responses
- **Winston**: For comprehensive logging
- **Chalk**: For colorful console output

### Session Management

- **Automatic Recovery**: Bot recovers from session failures
- **QR Code Regeneration**: New QR codes when sessions expire
- **Connection Monitoring**: Real-time connection status tracking

---

## 🛠️ Development

### Local Development

```bash
# Install dependencies
npm install

# Start in development mode
npm start

# Check logs
tail -f app.log
tail -f queries.log
```

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Debug Mode

Enable detailed logging by modifying the Winston configuration in `server.js`:

```javascript
const logger = winston.createLogger({
  level: "debug", // Change from "info" to "debug"
  // ... rest of configuration
});
```

---

## 🚀 Deployment

### Production Deployment

1. **Using PM2 (Recommended)**

   ```bash
   npm install -g pm2
   pm2 start server.js --name "whatsapp-bot"
   pm2 startup
   pm2 save
   ```

2. **Using Docker**

   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install --production
   COPY . .
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

3. **Environment Variables**
   - Set up production environment variables
   - Configure proper logging paths
   - Set up monitoring and alerting

### Hosting Platforms

- ✅ **VPS/Dedicated Servers** (Recommended)
- ✅ **Heroku** (with persistent storage add-ons)
- ✅ **DigitalOcean Droplets**
- ✅ **AWS EC2**
- ⚠️ **Serverless platforms** (session persistence issues)

---

## 📊 Monitoring & Analytics

### Log Analysis

```bash
# View recent application logs
tail -n 100 app.log

# Monitor user queries
tail -f queries.log | jq '.'

# Search for specific errors
grep "ERROR" app.log
```

### Performance Metrics

The bot tracks:

- Response times for AI API calls
- Message processing statistics
- User interaction patterns
- Error rates and recovery times

---

## 🔒 Security & Privacy

### Security Features

- **Environment Variable Protection**: Sensitive data stored in `.env`
- **Rate Limiting**: Prevents abuse and spam
- **Input Validation**: Sanitizes user inputs
- **Error Handling**: Prevents information leakage

### Privacy Considerations

- **Data Retention**: Configure log retention policies
- **User Data**: Minimal user data collection
- **Compliance**: Ensure GDPR/privacy law compliance
- **Session Security**: Secure session storage

---

## 🐛 Troubleshooting

### Common Issues

| Issue                 | Solution                                        |
| --------------------- | ----------------------------------------------- |
| QR Code not appearing | Check terminal size, install QR scanner app     |
| Bot not responding    | Verify `.env` configuration and API keys        |
| Session expired       | Bot will automatically regenerate QR code       |
| High memory usage     | Adjust `MAX_USERS` and `MAX_PROCESSED_MESSAGES` |
| API rate limits       | Implement delays or upgrade API plan            |

### Getting Help

1. Check the [Issues](https://github.com/kunaldevelopers/Smart-WhatsApp-Bot/issues) page
2. Review the `SETUP.md` file for detailed configuration
3. Check application logs for error details
4. Contact developer for support

---

## 📈 Roadmap

### Upcoming Features

- [ ] 🌐 **Multi-language Support** - Support for multiple languages
- [ ] 📊 **Analytics Dashboard** - Web-based analytics interface
- [ ] 🗄️ **Database Integration** - PostgreSQL/MongoDB support
- [ ] 🔔 **Webhook Support** - Integration with external services
- [ ] 📱 **Mobile App** - Companion mobile application
- [ ] 🤖 **Custom AI Models** - Support for custom trained models
- [ ] 🎨 **Rich Media Support** - Images, documents, and media handling
- [ ] 🔐 **User Authentication** - Advanced user management system

### Version History

- **v1.0.0** - Initial release with basic AI integration
- **v1.1.0** - Enhanced session management and error handling
- **v1.2.0** - Environment-based configuration system

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Developer

<div align="center">

### **Kunal Kumar Pandit**

_Full Stack Developer & AI Enthusiast_

[![Email](https://img.shields.io/badge/Email-kunalkprnc@gmail.com-red?style=flat-square&logo=gmail)](mailto:kunalkprnc@gmail.com)
[![WhatsApp](https://img.shields.io/badge/WhatsApp-+91%209471376362-25D366?style=flat-square&logo=whatsapp)](https://wa.me/919471376362)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Kunal%20Kumar%20Pandit-0077B5?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/kunalkumarpandit/)
[![Website](https://img.shields.io/badge/Website-www.cyberkunal.com-000000?style=flat-square&logo=google-chrome)](https://www.cyberkunal.com)
[![GitHub](https://img.shields.io/badge/GitHub-@kunaldevelopers-181717?style=flat-square&logo=github)](https://github.com/kunaldevelopers)

</div>

---

## 🤝 Support

If you find this project helpful, please consider:

- ⭐ **Starring** the repository
- 🐛 **Reporting bugs** or suggesting features
- 🔧 **Contributing** to the project
- 📢 **Sharing** with others who might benefit

---

## 📞 Contact & Support

- **Technical Issues**: [GitHub Issues](https://github.com/kunaldevelopers/Smart-WhatsApp-Bot/issues)
- **Business Inquiries**: [kunalkprnc@gmail.com](mailto:kunalkprnc@gmail.com)
- **WhatsApp Support**: [+91 9471376362](https://wa.me/919471376362)
- **Professional Network**: [LinkedIn](https://www.linkedin.com/in/kunalkumarpandit/)

---

<div align="center">

**Made with ❤️ by [Kunal Kumar Pandit](https://www.cyberkunal.com)**

_Empowering businesses with intelligent automation_

</div>
