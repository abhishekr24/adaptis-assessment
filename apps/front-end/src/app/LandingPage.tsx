import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Field } from '@ark-ui/react/field';
import { useAuth } from './context/auth.context';

export default function LandingPage() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<String>('')
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const handleIsRegistration = () => {
    setUsername('');
    setPassword('');
    setIsRegistering(!isRegistering)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) {
      const result = isRegistering
        ? await register(username, password)
        : await login(username, password);

      if (result.success) navigate({ to: '/media', search: { page: 1 } });
      setErrorMessage(result.error || 'Invalid Credential');
    }
  };

  return (
    <main className="landing-page-main">
      <div className="login-container">
        <h1 className="login-title">{isRegistering ? "Register" : "Login"}</h1>
        <form onSubmit={handleSubmit} className="login-form">
          <Field.Root className="form-field">
            <Field.Label>Username</Field.Label>
            <Field.Input
              value={username}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
              required
            />
          </Field.Root>

          <Field.Root className="form-field">
            <Field.Label>Password</Field.Label>
            <Field.Input
              type="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
            />
          </Field.Root>

          <button type="submit" className="login-button">
            {isRegistering ? 'Register' : 'Login'}
          </button>
        </form>
        <br />
        <button
          className="toggle-auth-mode-button"
          onClick={handleIsRegistration}
        >
          {isRegistering ? 'Already have an account? Login' : 'New user? Register'}
        </button>
        {errorMessage && (
          <p style={{ color: 'red' }}>{errorMessage}</p>
        )}
      </div>
    </main>
  );
}
