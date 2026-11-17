import React from 'react';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import UsuarioModulo from './components/UsuarioModulo';

const theme = createTheme({
  palette: {
    primary: { main: '#0D47A1' },
    secondary: { main: '#00897B' },
  },
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <UsuarioModulo />
    </ThemeProvider>
  );
}
