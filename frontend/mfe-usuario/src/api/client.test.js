import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearSession,
  getStoredToken,
  getStoredUser,
  login,
  saveSession,
} from './client';

describe('client session', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('salva e recupera sessao', () => {
    saveSession('token-xyz', { id: 1, name: 'Ana', email: 'ana@teste.com' });

    expect(getStoredToken()).toBe('token-xyz');
    expect(getStoredUser()).toEqual({
      id: 1,
      name: 'Ana',
      email: 'ana@teste.com',
    });
  });

  it('clearSession remove token e usuario', () => {
    saveSession('token-xyz', { id: 1, name: 'Ana', email: 'ana@teste.com' });
    clearSession();

    expect(getStoredToken()).toBeNull();
    expect(getStoredUser()).toBeNull();
  });

  it('getStoredUser retorna null para JSON invalido', () => {
    localStorage.setItem('cc_user', '{invalido');
    expect(getStoredUser()).toBeNull();
  });

  it('login chama o gateway e devolve o payload', async () => {
    const payload = {
      accessToken: 'jwt-usuario',
      user: { id: 3, name: 'Diego', email: 'diego@teste.com' },
    };

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => payload,
      }),
    );

    const result = await login({ email: 'diego@teste.com', password: 'senha' });

    expect(result).toEqual(payload);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8090/api/v1/auth/login',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
