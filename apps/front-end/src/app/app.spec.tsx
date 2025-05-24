import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './app';

vi.mock('@tanstack/router-devtools', () => ({
  TanStackRouterDevtools: () => null,
}));

vi.mock('../app/services/loginServices', () => ({
  isAuthenticated: () => true,
}));


describe('App', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<BrowserRouter><App /></BrowserRouter>);
    expect(baseElement).toBeTruthy();
  });

  it('should have a greeting as the title', () => {
    const { getByText, getByRole } = render(<BrowserRouter><App /></BrowserRouter>);
    expect(getByText('Username')).not.toBeNull();
    expect(getByText('Password')).not.toBeNull();
    const loginButton = getByRole('button', { name: /login/i });
    expect(loginButton).not.toBeNull();
    expect(getByText('New user? Register')).not.toBeNull();
  });
});
