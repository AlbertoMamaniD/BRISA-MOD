<script lang="ts">
  import { onMount } from 'svelte';
  import { authService } from '$lib/services/auth.js';
  import type { LoginRequest } from '$lib/types/api.js';

  let credentials: LoginRequest = {
    usuario: '',
    password: ''
  };

  let loading = false;
  let error = '';
  let showPassword = false;

  onMount(() => {
    if (authService.isAuthenticated()) {
      window.location.href = '/esquelas';
    }
  });

  async function handleLogin(e: Event) {
    e.preventDefault();
    
    if (!credentials.usuario.trim() || !credentials.password.trim()) {
      error = 'Por favor complete todos los campos';
      return;
    }

    try {
      loading = true;
      error = '';

      await authService.login(credentials);
      window.location.href = '/esquelas';
    } catch (err: any) {
      console.error('Error en login:', err);
      error = err.message || 'Usuario o contraseña incorrectos';
    } finally {
      loading = false;
    }
  }

  function togglePasswordVisibility() {
    showPassword = !showPassword;
  }
</script>

<svelte:head>
  <title>Login - BRISA</title>
</svelte:head>

<div class="login-container">
  <div class="login-card">
    <div class="login-header">
      <h1 class="login-title">BRISA</h1>
      <p class="login-subtitle">Sistema de Gestión de Esquelas</p>
    </div>

    {#if error}
      <div class="error-message">
        ⚠️ {error}
      </div>
    {/if}

    <form on:submit={handleLogin} class="login-form">
      <div class="form-group">
        <label for="usuario">Usuario</label>
        <div class="input-wrapper">
          <input
            id="usuario"
            type="text"
            bind:value={credentials.usuario}
            placeholder="Ingrese su usuario"
            disabled={loading}
            autocomplete="username"
            required
          />
        </div>
      </div>

      <div class="form-group">
        <label for="password">Contraseña</label>
        <div class="input-wrapper">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            bind:value={credentials.password}
            placeholder="Ingrese su contraseña"
            disabled={loading}
            autocomplete="current-password"
            required
          />
          <button
            type="button"
            class="toggle-password"
            on:click={togglePasswordVisibility}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>
      </div>

      <button type="submit" class="btn-login" disabled={loading}>
        {#if loading}
          <div class="spinner-small"></div>
          <span>Iniciando sesión...</span>
        {:else}
          <span>Iniciar Sesión</span>
        {/if}
      </button>
    </form>

    <div class="login-footer">
      <p>Sistema de Esquelas y Reconocimientos Estudiantiles</p>
    </div>
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
  }

  .login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 1rem;
  }

  .login-card {
    background: white;
    border-radius: 20px;
    padding: 3rem 2.5rem;
    width: 100%;
    max-width: 450px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  .login-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .login-title {
    font-size: 3rem;
    font-weight: 700;
    color: #667eea;
    margin: 0 0 0.5rem 0;
  }

  .login-subtitle {
    color: #64748b;
    font-size: 0.95rem;
    margin: 0;
  }

  .error-message {
    background: #fef2f2;
    border: 2px solid #fca5a5;
    color: #dc2626;
    padding: 0.875rem 1rem;
    border-radius: 10px;
    margin-bottom: 1.5rem;
    font-size: 0.9rem;
  }

  .login-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-group label {
    color: #475569;
    font-weight: 600;
    font-size: 0.9rem;
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .input-wrapper input {
    width: 100%;
    padding: 0.875rem 1rem;
    border: 2px solid #e2e8f0;
    border-radius: 10px;
    font-size: 0.95rem;
    transition: all 0.2s;
  }

  .input-wrapper input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  .input-wrapper input:disabled {
    background: #f8fafc;
    cursor: not-allowed;
  }

  .toggle-password {
    position: absolute;
    right: 1rem;
    background: none;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
    padding: 0.25rem;
    transition: opacity 0.2s;
  }

  .toggle-password:hover {
    opacity: 0.7;
  }

  .btn-login {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 1rem;
    border-radius: 10px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .btn-login:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
  }

  .btn-login:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .spinner-small {
    width: 18px;
    height: 18px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top: 3px solid white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .login-footer {
    margin-top: 2rem;
    text-align: center;
  }

  .login-footer p {
    color: #94a3b8;
    font-size: 0.85rem;
    margin: 0;
  }

  @media (max-width: 500px) {
    .login-card {
      padding: 2rem 1.5rem;
    }

    .login-title {
      font-size: 2.5rem;
    }
  }
</style>
