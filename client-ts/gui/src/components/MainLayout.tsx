import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CssBaseline,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Send as SendIcon,
  Devices as DevicesIcon,
  Webhook as WebhookIcon,
  WebhookOutlined as InboundWebhookIcon,
  Settings as SettingsIcon,
  Assessment as LogsIcon,
  HealthAndSafety as HealthIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import MessageComponent from './MessageComponent';
import DeviceManagement from './DeviceManagement';
import WebhookManagement from './WebhookManagement';
import InboundWebhooks from './InboundWebhooks';
import SettingsComponent from './SettingsComponent';
import LogsComponent from './LogsComponent';
import HealthComponent from './HealthComponent';

const drawerWidth = 240;

const getMenuItems = (cloudMode: boolean, showInboundWebhook: boolean) => [
  { text: 'Send SMS', icon: <SendIcon />, path: '/' },
  { text: 'Devices', icon: <DevicesIcon />, path: '/devices' },
  { text: 'Outbound Webhooks', icon: <WebhookIcon />, path: '/webhooks' },
  ...(showInboundWebhook ? [{ text: 'Inbound Webhooks', icon: <InboundWebhookIcon />, path: '/inbound-webhooks' }] : [{ text: 'Inbound Webhooks', icon: <InboundWebhookIcon />, path: '/inbound-webhooks', disabled: true, comingSoon: true }]),
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ...(cloudMode ? [] : [{ text: 'Logs', icon: <LogsIcon />, path: '/logs' }]),
  { text: 'Health', icon: <HealthIcon />, path: '/health' },
];

interface MainLayoutProps {
  cloudMode?: boolean;
  showInboundWebhook?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({ cloudMode = false, showInboundWebhook = true }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const menuItems = getMenuItems(cloudMode, showInboundWebhook);

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          SMS Gateway
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => !item.disabled && handleNavigation(item.path)}
              disabled={item.disabled}
              sx={{
                opacity: item.disabled ? 0.5 : 1,
                cursor: item.disabled ? 'not-allowed' : 'pointer'
              }}
            >
              <ListItemIcon sx={{ opacity: item.disabled ? 0.5 : 1 }}>{item.icon}</ListItemIcon>
              <ListItemText 
                primary={item.text} 
                secondary={item.comingSoon ? 'Coming Soon!' : undefined}
                sx={{ opacity: item.disabled ? 0.5 : 1 }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={logout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            SMS Gateway Dashboard
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <Routes>
          <Route path="/" element={<MessageComponent />} />
          <Route path="/devices" element={<DeviceManagement />} />
          <Route path="/webhooks" element={<WebhookManagement />} />
          <Route path="/inbound-webhooks" element={<InboundWebhooks />} />
          <Route path="/settings" element={<SettingsComponent />} />
          {!cloudMode && <Route path="/logs" element={<LogsComponent />} />}
          <Route path="/health" element={<HealthComponent />} />
        </Routes>
      </Box>
    </Box>
  );
};

export default MainLayout;
