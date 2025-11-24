import React, { useState } from 'react';
import { Theme } from '@carbon/react';
import { Content, Header, HeaderName } from '@carbon/react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Upload from './components/Upload';
import './styles/index.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const handleLogin = (admin) => {
    setIsLoggedIn(true);
    setIsAdmin(admin);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsAdmin(false);
  };

  return (
    <Theme theme="g100">
      <Header aria-label="Storage Analytics">
        <HeaderName href="#" prefix="POC">
          Storage Analytics Dashboard
        </HeaderName>
      </Header>
      <Content>
        {!isLoggedIn ? (
          <Login onLogin={handleLogin} />
        ) : (
          <>
            {isAdmin && <Upload />}
            <Dashboard isAdmin={isAdmin} onLogout={handleLogout} />
          </>
        )}
      </Content>
    </Theme>
  );
}

export default App;
