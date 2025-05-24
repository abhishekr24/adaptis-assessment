import { API_BASE_URL } from "./types";

export async function loginUser(username: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({username, password})
      });
    
      if (!response.ok) {
        throw new Error('Invalid credential');
      }

      const data = await response.json()
      return data.token;
}

export async function registerUser(username: string, password: string): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
  
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }
  
    const data = await response.json();
    return data.token;
  }

  export const isAuthenticated = () => {
    return !!localStorage.getItem('token');
  };