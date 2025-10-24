# SMS Gateway GUI v2

A modern, web-based GUI for the SMS Gateway service with React, TypeScript, and Material-UI. This application provides a user-friendly interface for managing SMS operations, devices, webhooks, and settings.

## 🚀 Features

- **Send SMS Messages** - Send SMS to multiple recipients with delivery reports
- **Device Management** - View and manage registered SMS devices
- **Outbound Webhooks** - Configure webhooks to receive SMS event notifications
- **Settings Management** - Update device settings and configurations
- **Health Monitoring** - Check SMS gateway health status
- **Logs Viewing** - View system logs (can be disabled in cloud mode)
- **Auto-login Support** - Environment-based authentication
- **Cloud Mode** - Hide sensitive features for cloud deployments

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Library**: Material-UI (MUI)
- **Backend**: Node.js + Express
- **Database**: SQLite (for inbound webhooks)
- **Authentication**: Basic Auth with environment support

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- SMS Gateway API credentials

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Meir553/sms-gate-gui.git
cd sms-gateway-v2
```

### 2. Install Dependencies

```bash
npm run install-all
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
PORT=3003
SMS_GATEWAY_BASE_URL=https://api.sms-gate.app/3rdparty/v1

# SMS Gateway Credentials (Optional - for auto-login)
SMS_GATEWAY_USERNAME=your_username
SMS_GATEWAY_PASSWORD=your_password

# Feature Flags
CLOUD_MODE=false
SHOW_INBOUND_WEBHOOK=true
```

### 4. Start the Application

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm start
```

The application will be available at `http://localhost:3003`

## 📁 Project Structure

```
sms-gateway-v2/
├── client-ts/gui/          # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   ├── lib/           # Client library
│   │   └── App.tsx        # Main app component
│   ├── package.json
│   └── vite.config.ts
├── server.js              # Express backend server
├── database.js            # SQLite database operations
├── package.json           # Root package.json
├── .env.example          # Environment variables template
└── README.md
```

## 🔧 Configuration Options

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | `3003` | No |
| `SMS_GATEWAY_BASE_URL` | SMS Gateway API URL | `https://api.sms-gate.app/3rdparty/v1` | No |
| `SMS_GATEWAY_USERNAME` | Username for auto-login | - | No |
| `SMS_GATEWAY_PASSWORD` | Password for auto-login | - | No |
| `CLOUD_MODE` | Hide logs for security | `false` | No |
| `SHOW_INBOUND_WEBHOOK` | Show inbound webhooks | `true` | No |

### Authentication Modes

#### Option A: Manual Login
- Leave `SMS_GATEWAY_USERNAME` and `SMS_GATEWAY_PASSWORD` empty
- Users will see a login form
- Credentials are stored in browser localStorage

#### Option B: Auto-login
- Set `SMS_GATEWAY_USERNAME` and `SMS_GATEWAY_PASSWORD` in `.env`
- Users are automatically logged in
- No login form is shown

## 🎯 Available Scripts

```bash
# Install all dependencies
npm run install-all

# Start development server
npm run dev

# Build frontend for production
npm run build-gui

# Start production server
npm start

# Development with frontend build
npm run dev-full
```

## 🔌 API Endpoints

### Frontend Routes
- `/` - Send SMS interface
- `/devices` - Device management
- `/webhooks` - Outbound webhook management
- `/settings` - Device settings
- `/health` - Health status
- `/logs` - System logs (hidden in cloud mode)

### Backend API
- `GET /api/config` - Get configuration
- `GET /api/env-credentials` - Get environment credentials
- `GET /api/*` - Proxy to SMS Gateway API
- `GET/POST /webhook/:id` - Inbound webhook endpoints

## 🗄️ Database

The application uses SQLite for storing inbound webhook configurations:

- **webhooks** - Webhook configurations
- **webhook_logs** - Incoming webhook requests

Database file: `webhooks.db` (created automatically)

## 🔒 Security Features

- **CORS Protection** - Configured for localhost development
- **Rate Limiting** - Built-in request rate limiting
- **Helmet Security** - Security headers
- **Cloud Mode** - Hide sensitive features in production
- **Environment-based Auth** - Secure credential management

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm run build-gui
npm start
```

### Docker (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build-gui
EXPOSE 3003
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

**"Failed to fetch" errors**
- Ensure the backend server is running
- Check if the SMS Gateway API is accessible
- Verify your credentials

**"Invalid URL" errors**
- Check your `SMS_GATEWAY_BASE_URL` in `.env`
- Ensure the URL includes the protocol (`https://`)

**Database errors**
- Delete `webhooks.db` to reset the database
- Check file permissions in the project directory

**Build errors**
- Run `npm run install-all` to ensure all dependencies are installed
- Check Node.js version (requires 18+)

### Getting Help

1. Check the [Issues](https://github.com/Meir553/sms-gate-gui/issues) page
2. Review the logs in the browser console and server terminal
3. Ensure all environment variables are set correctly

## 🎉 Acknowledgments

- Built with [React](https://reactjs.org/)
- UI components from [Material-UI](https://mui.com/)
- Backend powered by [Express.js](https://expressjs.com/)
- Database: [SQLite](https://www.sqlite.org/)

---

**Happy SMS-ing! 📱✨**
