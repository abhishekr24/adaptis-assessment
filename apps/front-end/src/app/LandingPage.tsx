import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Field } from '@ark-ui/react/field';

export default function LandingPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) {
      navigate({ to: '/media' });
    }
  };

  return (
    <main className="landing-page-main">
      <div className="login-container">
        <h1 className="login-title">Login</h1>
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
            Login
          </button>
        </form>
      </div>
    </main>
  );
}