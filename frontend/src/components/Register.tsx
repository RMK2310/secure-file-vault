import React, { useState } from 'react';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, recoveryEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
      } else {
        setMessage('Registered successfully!');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:&nbsp;</label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label>Recovery Email:&nbsp;</label>
          <input
            type="email"
            value={recoveryEmail}
            onChange={e => setRecoveryEmail(e.target.value)}
          />
        </div>
        <div>
          <label>Password:&nbsp;</label>
          <input
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>

      {message && <p style={{ color: 'lightgreen' }}>{message}</p>}
      {error && <p style={{ color: 'salmon' }}>{error}</p>}
    </div>
  );
};

export default Register;
