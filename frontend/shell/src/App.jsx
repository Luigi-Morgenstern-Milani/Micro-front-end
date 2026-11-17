import React, { Suspense, lazy, useCallback, useState } from 'react';
import {
  AppBar,
  Box,
  Chip,
  CircularProgress,
  Container,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ThemeProvider,
  Toolbar,
  Tooltip,
  Typography,
  createTheme,
} from '@mui/material';
import ApartmentIcon from '@mui/icons-material/Apartment';
import ChatIcon from '@mui/icons-material/Chat';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import MenuIcon from '@mui/icons-material/Menu';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';

const UsuarioModulo = lazy(() => import('mfeUsuario/UsuarioModulo'));
const RideFeed = lazy(() => import('caronaMfe/RideFeed'));
const ApartmentFeed = lazy(() => import('apartmentMfe/ApartmentFeed'));
const ChatInbox = lazy(() => import('chatMfe/ChatInbox'));

const SIDEBAR_WIDTH = 240;

const theme = createTheme({
  palette: {
    primary: { main: '#0D47A1' },
    secondary: { main: '#00897B' },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
});

const navItems = [
  {
    label: 'Usuario',
    description: 'Cadastro, login e perfil',
    icon: <PersonIcon />,
    value: 0,
    mfe: 'mfe-usuario :3001',
  },
  {
    label: 'Caronas',
    description: 'Buscar e oferecer caronas',
    icon: <DirectionsCarIcon />,
    value: 1,
    mfe: 'mfe-carona :3003',
  },
  {
    label: 'Apartamentos',
    description: 'Buscar e anunciar imoveis',
    icon: <ApartmentIcon />,
    value: 2,
    mfe: 'mfe-apartment :3002',
  },
  {
    label: 'Chat',
    description: 'Conversas 1:1 em tempo real',
    icon: <ChatIcon />,
    value: 3,
    mfe: 'mfe-chat :3004',
  },
];

function LoadingFallback() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 300,
        gap: 2,
      }}
    >
      <CircularProgress size={48} />
      <Typography variant="body2" color="text.secondary">
        Carregando modulo remoto…
      </Typography>
    </Box>
  );
}

function SidebarContent({ activeTab, onSelect, sessionLabel }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{
          px: 2,
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          bgcolor: 'primary.main',
          color: 'white',
        }}
      >
        <SchoolIcon />
        <Box>
          <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
            Campus Connect
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            Shell MFE
          </Typography>
        </Box>
      </Box>

      <Divider />

      <Box sx={{ px: 1, pt: 1.5, flex: 1 }}>
        <Typography
          variant="overline"
          sx={{ px: 1, color: 'text.disabled', fontSize: '0.65rem', display: 'block', mb: 0.5 }}
        >
          Modulos
        </Typography>

        <List disablePadding>
          {navItems.map((item) => {
            const isActive = activeTab === item.value;
            return (
              <ListItem key={item.value} disablePadding sx={{ mb: 0.5 }}>
                <Tooltip title={item.mfe} placement="right" arrow>
                  <ListItemButton
                    selected={isActive}
                    disabled={item.disabled}
                    onClick={() => onSelect(item.value)}
                    sx={{
                      borderRadius: 2,
                      '&.Mui-selected': {
                        bgcolor: 'primary.main',
                        color: 'white',
                        '& .MuiListItemIcon-root': { color: 'white' },
                        '&:hover': { bgcolor: 'primary.dark' },
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 38,
                        color: isActive ? 'white' : 'text.secondary',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      secondary={!isActive ? item.description : null}
                      primaryTypographyProps={{
                        fontWeight: isActive ? 700 : 400,
                        fontSize: '0.9rem',
                      }}
                      secondaryTypographyProps={{ fontSize: '0.72rem' }}
                    />
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            );
          })}
        </List>
      </Box>

      <Divider />

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Typography variant="overline" sx={{ color: 'text.disabled', fontSize: '0.62rem' }}>
          Arquitetura MFE
        </Typography>
        <Chip
          label="Shell (Host) :3000"
          size="small"
          variant="outlined"
          sx={{ justifyContent: 'flex-start' }}
        />
        <Chip
          label="mfe-usuario :3001"
          size="small"
          color="primary"
          variant="outlined"
          sx={{ justifyContent: 'flex-start' }}
        />
        <Chip
          label="mfe-carona :3003"
          size="small"
          color="secondary"
          variant="outlined"
          sx={{ justifyContent: 'flex-start' }}
        />
        <Chip
          label="mfe-apartment :3002"
          size="small"
          color="primary"
          variant="outlined"
          sx={{ justifyContent: 'flex-start' }}
        />
        <Chip
          label="mfe-chat :3004"
          size="small"
          color="secondary"
          variant="outlined"
          sx={{ justifyContent: 'flex-start' }}
        />
        <Chip
          label={sessionLabel}
          size="small"
          color={sessionLabel === 'Convidado' ? 'default' : 'success'}
          variant="outlined"
          sx={{ justifyContent: 'flex-start' }}
        />
      </Box>
    </Box>
  );
}

function AppContent() {
  const [activeTab, setActiveTab] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sessionLabel, setSessionLabel] = useState('Convidado');

  const handleSelect = (value) => {
    setActiveTab(value);
    setMobileOpen(false);
  };

  const handleSessionChange = useCallback((session) => {
    setSessionLabel(session?.autenticado ? session.user.name : 'Convidado');
  }, []);

  const activeItem = navItems[activeTab] ?? navItems[0];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'grey.100' }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          backgroundColor: '#0D47A1',
          boxShadow: 2,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(true)}
            sx={{ mr: 1, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ width: SIDEBAR_WIDTH, display: { xs: 'none', md: 'block' } }} />

          <SchoolIcon sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
            {activeItem.label}
          </Typography>

          <Chip
            label={activeItem.mfe}
            size="small"
            sx={{
              bgcolor: 'rgba(255,255,255,0.15)',
              color: 'white',
              display: { xs: 'none', sm: 'flex' },
            }}
          />
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH,
            boxSizing: 'border-box',
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        <Toolbar />
        <SidebarContent
          activeTab={activeTab}
          onSelect={handleSelect}
          sessionLabel={sessionLabel}
        />
      </Drawer>

      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH },
        }}
      >
        <SidebarContent
          activeTab={activeTab}
          onSelect={handleSelect}
          sessionLabel={sessionLabel}
        />
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: '64px',
          minWidth: 0,
        }}
      >
        <Container maxWidth="xl" sx={{ py: 3 }}>
          <Box sx={{ bgcolor: 'white', borderRadius: 3, boxShadow: 1, overflow: 'hidden' }}>
            <Suspense fallback={<LoadingFallback />}>
              {activeTab === 0 && <UsuarioModulo onSessionChange={handleSessionChange} />}
              {activeTab === 1 && <RideFeed />}
              {activeTab === 2 && <ApartmentFeed />}
              {activeTab === 3 && <ChatInbox />}
            </Suspense>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppContent />
    </ThemeProvider>
  );
}
