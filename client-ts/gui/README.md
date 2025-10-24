# SMS Gateway GUI

A modern, responsive web interface for the SMS Gateway API built with React and TypeScript.

## Features

- **Send SMS Messages**: Send SMS messages to multiple recipients with advanced options
- **Device Management**: View and manage registered devices
- **Webhook Management**: Create, edit, and delete webhooks for event notifications
- **Settings Management**: Configure all SMS Gateway settings through an intuitive interface
- **System Logs**: View and filter system logs with detailed information
- **Health Monitoring**: Monitor system health and performance metrics

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Navigate to the GUI directory:
   ```bash
   cd gui
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

To build the application for production:

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

### Authentication

1. Enter your SMS Gateway login credentials
2. The application will store your credentials securely in localStorage
3. You can logout at any time using the logout button in the sidebar

### Sending SMS Messages

1. Navigate to the "Send SMS" page (default)
2. Enter your message text
3. Add one or more phone numbers
4. Configure optional settings:
   - TTL (Time To Live) in seconds
   - SIM number selection
   - Delivery report preferences
   - Phone validation settings
5. Click "Send Message" to send

### Managing Devices

1. Navigate to the "Devices" page
2. View all registered devices and their status
3. Delete devices if needed
4. Refresh to get the latest device information

### Webhook Management

1. Navigate to the "Webhooks" page
2. Create new webhooks for different event types
3. Edit existing webhooks
4. Delete webhooks you no longer need

### Settings Configuration

1. Navigate to the "Settings" page
2. Configure various settings organized by category:
   - Message settings (limits, intervals, SIM selection)
   - Webhook settings (retry count, signing key)
   - Gateway settings (cloud URL, private token)
   - Encryption settings
   - Logs settings
   - Ping settings
3. Click "Save Settings" to apply changes

### Viewing Logs

1. Navigate to the "Logs" page
2. Use filters to find specific log entries
3. Click on any log entry to view detailed information
4. Use pagination to navigate through large log sets

### Health Monitoring

1. Navigate to the "Health" page
2. View overall system status
3. Check individual health checks
4. Monitor system performance metrics

## Technology Stack

- **React 18**: Modern React with hooks
- **TypeScript**: Type-safe development
- **Material-UI (MUI)**: Modern UI components
- **React Router**: Client-side routing
- **Vite**: Fast build tool and dev server

## API Integration

The GUI integrates with the SMS Gateway API through the included client library. All API calls are made using the configured HTTP client with proper authentication headers.

## Security

- Credentials are stored in localStorage (consider using a more secure storage method for production)
- All API calls include proper authentication headers
- Input validation is performed on the client side

## Browser Support

This application supports all modern browsers including:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development

### Project Structure

```
src/
├── components/          # React components
│   ├── AuthComponent.tsx
│   ├── MainLayout.tsx
│   ├── MessageComponent.tsx
│   ├── DeviceManagement.tsx
│   ├── WebhookManagement.tsx
│   ├── SettingsComponent.tsx
│   ├── LogsComponent.tsx
│   └── HealthComponent.tsx
├── contexts/           # React contexts
│   └── AuthContext.tsx
├── lib/               # SMS Gateway client library
│   ├── client.ts
│   ├── domain.ts
│   └── http.ts
├── App.tsx            # Main application component
└── main.tsx           # Application entry point
```

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the Apache 2.0 License - see the LICENSE file for details.
