import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('vex_token'));
  const [username, setUsername] = useState(localStorage.getItem('vex_user'));

  const login = (token, username) => {
    localStorage.setItem('vex_token', token);
    localStorage.setItem('vex_user', username);
    setToken(token);
    setUsername(username);
  };

  const logout = () => {
    localStorage.removeItem('vex_token');
    localStorage.removeItem('vex_user');
    setToken(null);
    setUsername(null);
  };

  return (
    <AuthContext.Provider value={{ token, username, login, logout, isAuth: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
