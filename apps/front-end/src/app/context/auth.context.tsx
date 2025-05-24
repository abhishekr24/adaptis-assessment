import React, { createContext, ReactNode, useContext, useState } from 'react';
import { loginUser, registerUser } from '../services/loginServices';

type AuthContextType = {
    user: string | null;
    token: string | null;
    login: (username: string, password: string) => Promise<boolean>;
    register: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);


export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);

    const login = async (username: string, password: string): Promise<boolean> => {
        try {
            const jwt = await loginUser(username, password);
            setUser(username);
            setToken(jwt);
            localStorage.setItem('token', jwt);
            return true;
          } catch (error) {
            console.error('Login failed:', error);
            return false;
          }
    };

    const register = async (username: string, password: string): Promise<boolean> => {
        try {
            const jwt = await registerUser(username, password);
            setUser(username);
            setToken(jwt);
            localStorage.setItem('token', jwt);
            return true;
          } catch (error) {
            console.error('Registration failed:', error);
            return false;
          }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value= {{ user, token, login, register, logout }}>
            { children }
            </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
      throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
  }