import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Snackbar,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import {
  atualizarUsuario,
  buscarUsuario,
  cadastrarUsuario,
  clearSession,
  getStoredToken,
  getStoredUser,
  login,
  logout,
  saveSession,
} from '../api/client';

function TabPanel({ value, index, children }) {
  if (value !== index) return null;
  return <Box sx={{ p: 3 }}>{children}</Box>;
}

/**
 * Microfrontend de usuario: cadastro, login e alteracao de dados.
 * Consome o API Gateway (padrao AULA_ARQSOL_MFE + campusConnect backend).
 */
export default function UsuarioModulo({ onSessionChange }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [token, setToken] = useState(() => getStoredToken());
  const [tab, setTab] = useState(() => (getStoredToken() && getStoredUser() ? 2 : 0));
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, severity: 'success', message: '' });

  const [cadastro, setCadastro] = useState({ name: '', email: '', password: '' });
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [perfil, setPerfil] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});

  const autenticado = Boolean(token && user);

  useEffect(() => {
    onSessionChange?.({ user, token, autenticado });
  }, [user, token, autenticado, onSessionChange]);

  useEffect(() => {
    if (user) {
      setPerfil({ name: user.name || '', email: user.email || '', password: '' });
    }
  }, [user]);

  useEffect(() => {
    if (!autenticado && tab === 2) {
      setTab(0);
    }
  }, [autenticado, tab]);

  const showSnack = (severity, message) => {
    setSnack({ open: true, severity, message });
  };

  const applySession = (accessToken, nextUser) => {
    saveSession(accessToken, nextUser);
    setToken(accessToken);
    setUser(nextUser);
  };

  const dropSession = () => {
    clearSession();
    setToken(null);
    setUser(null);
  };

  const validateCadastro = () => {
    const next = {};
    if (!cadastro.name.trim()) next.name = 'Nome obrigatorio';
    if (!cadastro.email.trim()) next.email = 'E-mail obrigatorio';
    if (!cadastro.password || cadastro.password.length < 8) {
      next.password = 'Senha com no minimo 8 caracteres';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateLogin = () => {
    const next = {};
    if (!loginForm.email.trim()) next.email = 'E-mail obrigatorio';
    if (!loginForm.password) next.password = 'Senha obrigatoria';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validatePerfil = () => {
    const next = {};
    if (!perfil.name.trim()) next.name = 'Nome obrigatorio';
    if (!perfil.email.trim()) next.email = 'E-mail obrigatorio';
    if (perfil.password && perfil.password.length < 8) {
      next.password = 'Nova senha com no minimo 8 caracteres';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleCadastro = async (event) => {
    event.preventDefault();
    if (!validateCadastro()) return;
    setLoading(true);
    try {
      await cadastrarUsuario(cadastro);
      showSnack('success', 'Cadastro realizado. Faca login.');
      setCadastro({ name: '', email: '', password: '' });
      setErrors({});
      setTab(0);
      setLoginForm({ email: cadastro.email, password: '' });
    } catch (err) {
      showSnack('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    if (!validateLogin()) return;
    setLoading(true);
    try {
      const response = await login(loginForm);
      applySession(response.accessToken, response.user);
      showSnack('success', `Bem-vindo, ${response.user.name}!`);
      setLoginForm({ email: '', password: '' });
      setErrors({});
      setTab(2);
    } catch (err) {
      showSnack('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAtualizar = async (event) => {
    event.preventDefault();
    if (!autenticado) {
      showSnack('warning', 'Faca login para alterar seus dados.');
      setTab(0);
      return;
    }
    if (!validatePerfil()) return;
    setLoading(true);
    try {
      const atualizado = await atualizarUsuario(user.id, perfil);
      applySession(token, atualizado);
      setPerfil((prev) => ({ ...prev, password: '' }));
      showSnack('success', 'Dados atualizados.');
      setErrors({});
    } catch (err) {
      showSnack('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      dropSession();
      showSnack('info', 'Sessao encerrada.');
      setTab(0);
    } catch (err) {
      dropSession();
      showSnack('warning', err.message || 'Sessao limpa localmente.');
      setTab(0);
    } finally {
      setLoading(false);
    }
  };

  const handleRecarregarPerfil = async () => {
    if (!autenticado) return;
    setLoading(true);
    try {
      const atual = await buscarUsuario(user.id);
      applySession(token, atual);
      showSnack('success', 'Perfil sincronizado.');
    } catch (err) {
      showSnack('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          mb: 1,
          px: 1,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Conta do estudante
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Cadastro, login e alteracao de dados via gateway
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <Chip label="mfe-usuario :3001" size="small" color="primary" variant="outlined" />
          {autenticado ? (
            <Chip
              icon={<PersonIcon />}
              label={user.name}
              color="success"
              size="small"
              variant="outlined"
            />
          ) : (
            <Chip label="Nao autenticado" size="small" variant="outlined" />
          )}
        </Box>
      </Box>

      <Tabs
        value={tab}
        onChange={(_, value) => {
          setErrors({});
          setTab(value);
        }}
        variant="scrollable"
        allowScrollButtonsMobile
        sx={{ borderBottom: 1, borderColor: 'divider', px: 1 }}
      >
        <Tab icon={<LoginIcon />} iconPosition="start" label="Login" />
        <Tab icon={<HowToRegIcon />} iconPosition="start" label="Cadastro" />
        {autenticado && (
          <Tab icon={<PersonIcon />} iconPosition="start" label="Meus dados" />
        )}
      </Tabs>

      <TabPanel value={tab} index={0}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Entrar
        </Typography>
        <Box
          component="form"
          onSubmit={handleLogin}
          sx={{ display: 'grid', gap: 2, maxWidth: 420 }}
        >
          <TextField
            label="E-mail"
            type="email"
            value={loginForm.email}
            onChange={(e) => setLoginForm((p) => ({ ...p, email: e.target.value }))}
            error={Boolean(errors.email)}
            helperText={errors.email}
            fullWidth
            required
          />
          <TextField
            label="Senha"
            type="password"
            value={loginForm.password}
            onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
            error={Boolean(errors.password)}
            helperText={errors.password}
            fullWidth
            required
          />
          <Button type="submit" variant="contained" disabled={loading} startIcon={<LoginIcon />}>
            {loading ? <CircularProgress size={22} color="inherit" /> : 'Entrar'}
          </Button>
        </Box>
      </TabPanel>

      <TabPanel value={tab} index={1}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Criar conta
        </Typography>
        <Box
          component="form"
          onSubmit={handleCadastro}
          sx={{ display: 'grid', gap: 2, maxWidth: 420 }}
        >
          <TextField
            label="Nome"
            value={cadastro.name}
            onChange={(e) => setCadastro((p) => ({ ...p, name: e.target.value }))}
            error={Boolean(errors.name)}
            helperText={errors.name}
            fullWidth
            required
          />
          <TextField
            label="E-mail"
            type="email"
            value={cadastro.email}
            onChange={(e) => setCadastro((p) => ({ ...p, email: e.target.value }))}
            error={Boolean(errors.email)}
            helperText={errors.email}
            fullWidth
            required
          />
          <TextField
            label="Senha"
            type="password"
            value={cadastro.password}
            onChange={(e) => setCadastro((p) => ({ ...p, password: e.target.value }))}
            error={Boolean(errors.password)}
            helperText={errors.password || 'Minimo 8 caracteres'}
            fullWidth
            required
          />
          <Button type="submit" variant="contained" disabled={loading} startIcon={<HowToRegIcon />}>
            {loading ? <CircularProgress size={22} color="inherit" /> : 'Cadastrar'}
          </Button>
        </Box>
      </TabPanel>

      {autenticado && (
        <TabPanel value={tab} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Meu perfil (id {user.id})
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" onClick={handleRecarregarPerfil} disabled={loading}>
                Sincronizar
              </Button>
              <Button
                size="small"
                color="inherit"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                disabled={loading}
              >
                Sair
              </Button>
            </Box>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Box
            component="form"
            onSubmit={handleAtualizar}
            sx={{ display: 'grid', gap: 2, maxWidth: 420 }}
          >
            <TextField
              label="Nome"
              value={perfil.name}
              onChange={(e) => setPerfil((p) => ({ ...p, name: e.target.value }))}
              error={Boolean(errors.name)}
              helperText={errors.name}
              fullWidth
              required
            />
            <TextField
              label="E-mail"
              type="email"
              value={perfil.email}
              onChange={(e) => setPerfil((p) => ({ ...p, email: e.target.value }))}
              error={Boolean(errors.email)}
              helperText={errors.email}
              fullWidth
              required
            />
            <TextField
              label="Nova senha (opcional)"
              type="password"
              value={perfil.password}
              onChange={(e) => setPerfil((p) => ({ ...p, password: e.target.value }))}
              error={Boolean(errors.password)}
              helperText={errors.password || 'Deixe em branco para manter a senha atual'}
              fullWidth
            />
            <Typography variant="caption" color="text.secondary">
              Criado em:{' '}
              {user.createAt
                ? new Date(user.createAt).toLocaleString('pt-BR')
                : '—'}
            </Typography>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Salvar alteracoes'}
            </Button>
          </Box>
        </TabPanel>
      )}

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snack.severity}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
