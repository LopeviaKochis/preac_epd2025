import React, { useState } from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Tab,
  Tabs,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  IconButton,
  CircularProgress
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  Agriculture as AgricultureIcon,
  Phone as PhoneIcon 
} from '@mui/icons-material';
import { authService } from '../services/authService';

const Login = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, register } = useAuth();

  // Estados para login
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  // Estados para registro
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setError('');
  };

  const handleLoginChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegisterChange = (e) => {
    setRegisterData({
      ...registerData,
      [e.target.name]: e.target.value
    });
  };

  const handlePhoneChange = (e) => {
    let value = e.target.value;
    // Auto-formatear número peruano
    if (!value.startsWith('+51') && value.startsWith('9')) {
      value = '+51 ' + value;
    }
    setRegisterData({
      ...registerData,
      phone: value
    });
  };

  const validateForm = () => {
    if (tabValue === 0) {
      // Validar login
      if (!loginData.email || !loginData.password) {
        setError('Por favor complete todos los campos');
        return false;
      }
    } else {
      // Validar registro
      if (!registerData.name || !registerData.email || !registerData.phone || 
          !registerData.password || !registerData.confirmPassword) {
        setError('Por favor complete todos los campos');
        return false;
      }

      if (registerData.password !== registerData.confirmPassword) {
        setError('Las contraseñas no coinciden');
        return false;
      }

      if (registerData.password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres');
        return false;
      }

      if (!authService.validatePeruvianPhone(registerData.phone)) {
        setError('Por favor ingrese un número de teléfono móvil válido de Perú (9XX XXX XXX)');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (tabValue === 0) {
        // Login
        await login(loginData);
      } else {
        // Registro
        const formattedData = {
          ...registerData,
          phone: authService.formatPeruvianPhone(registerData.phone)
        };
        await register(formattedData);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%', borderRadius: 2 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <AgricultureIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography component="h1" variant="h4" color="primary" gutterBottom>
              PREAC
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Agricultura Inteligente
            </Typography>
          </Box>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              variant="fullWidth"
              aria-label="login register tabs"
            >
              <Tab label="Iniciar Sesión" />
              <Tab label="Registrarse" />
            </Tabs>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Forms */}
          <Box component="form" onSubmit={handleSubmit}>
            {tabValue === 0 ? (
              // Login Form
              <>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Correo Electrónico"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  value={loginData.email}
                  onChange={handleLoginChange}
                  type="email"
                />
                <FormControl variant="outlined" fullWidth margin="normal" required>
                  <InputLabel htmlFor="password">Contraseña</InputLabel>
                  <OutlinedInput
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={loginData.password}
                    onChange={handleLoginChange}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    }
                    label="Contraseña"
                  />
                </FormControl>
              </>
            ) : (
              // Register Form
              <>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="name"
                  label="Nombre Completo"
                  name="name"
                  autoComplete="name"
                  autoFocus
                  value={registerData.name}
                  onChange={handleRegisterChange}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Correo Electrónico"
                  name="email"
                  autoComplete="email"
                  type="email"
                  value={registerData.email}
                  onChange={handleRegisterChange}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="phone"
                  label="Teléfono Móvil"
                  name="phone"
                  placeholder="+51 9XX XXX XXX"
                  value={registerData.phone}
                  onChange={handlePhoneChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon />
                      </InputAdornment>
                    ),
                  }}
                  helperText="Formato: +51 9XX XXX XXX (números móviles de Perú)"
                />
                <FormControl variant="outlined" fullWidth margin="normal" required>
                  <InputLabel htmlFor="register-password">Contraseña</InputLabel>
                  <OutlinedInput
                    id="register-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={registerData.password}
                    onChange={handleRegisterChange}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    }
                    label="Contraseña"
                  />
                </FormControl>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="confirmPassword"
                  label="Confirmar Contraseña"
                  name="confirmPassword"
                  type="password"
                  value={registerData.confirmPassword}
                  onChange={handleRegisterChange}
                />
              </>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} />
              ) : (
                tabValue === 0 ? 'Iniciar Sesión' : 'Registrarse'
              )}
            </Button>
          </Box>

          {/* Footer */}
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {tabValue === 0 
                ? '¿No tienes una cuenta? Usa la pestaña "Registrarse"'
                : '¿Ya tienes una cuenta? Usa la pestaña "Iniciar Sesión"'
              }
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;