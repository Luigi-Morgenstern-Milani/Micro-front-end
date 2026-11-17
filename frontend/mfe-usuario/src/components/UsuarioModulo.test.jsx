import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { saveSession } from '../api/client';
import UsuarioModulo from './UsuarioModulo';

beforeAll(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
});

function render(ui) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(ui);
  });
  return {
    container,
    unmount() {
      act(() => root.unmount());
      container.remove();
    },
  };
}

describe('UsuarioModulo visibilidade pos-login', () => {
  let view;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    view?.unmount();
    view = undefined;
    localStorage.clear();
  });

  it('nao mostra a aba Meus dados nem o perfil sem sessao', () => {
    view = render(<UsuarioModulo />);

    expect(view.container.textContent).toMatch(/Login/);
    expect(view.container.textContent).toMatch(/Cadastro/);
    expect(view.container.textContent).not.toMatch(/Meus dados/);
    expect(view.container.textContent).not.toMatch(/Salvar alteracoes/);
    expect(view.container.textContent).not.toMatch(/Meu perfil/);
  });

  it('mostra Meus dados e o perfil somente com sessao', () => {
    saveSession('token-xyz', { id: 1, name: 'Ana', email: 'ana@teste.com' });

    view = render(<UsuarioModulo />);

    expect(view.container.textContent).toMatch(/Meus dados/);
    expect(view.container.textContent).toMatch(/Meu perfil \(id 1\)/);
    expect(view.container.textContent).toMatch(/Salvar alteracoes/);
    expect(view.container.textContent).toMatch(/Ana/);
  });
});
