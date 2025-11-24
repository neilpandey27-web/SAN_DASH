import React, { useState } from 'react';
import { TextInput, Button, Form, InlineNotification } from '@carbon/react';
import api from '../services/api';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/login/', { username, password });
      // Changed: Check for message instead of status
      if (res.data.message === 'Login successful') {
        onLogin(res.data.is_staff);  // Changed: Use is_staff instead of is_admin
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <h2>Login to Storage Analytics</h2>
      {error && (
        <InlineNotification
          kind="error"
          title="Error"
          subtitle={error}
          onClose={() => setError('')}
          style={{ marginBottom: '20px' }}
        />
      )}
      <Form onSubmit={handleSubmit}>
        <TextInput
          id="username"
          labelText="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={{ marginBottom: '20px' }}
        />
        <TextInput
          id="password"
          type="password"
          labelText="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ marginBottom: '20px' }}
        />
        <Button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </Button>
      </Form>
      <p style={{ marginTop: '20px', fontSize: '14px', color: '#888' }}>
        Default credentials: admin / admin (create superuser first)
      </p>
    </div>
  );
};

export default Login;
