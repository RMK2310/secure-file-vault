import React from 'react';
import './App.css';
import Register from './components/Register';
import Login from './components/Login';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        
        <h1>Secure File Vault</h1>
        <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
          <Register />
          <Login />
        </div>
      </header>
    </div>
  );
}

export default App;
