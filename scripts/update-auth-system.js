const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Update an existing component to use our new auth adapter
function updateLoginComponent() {
  console.log('Updating login component...');
  
  // Path to the LoginForm component (adjust as needed)
  const loginFormPath = path.join(process.cwd(), 'components', 'auth', 'LoginForm.tsx');
  
  // Check if file exists
  if (fs.existsSync(loginFormPath)) {
    try {
      console.log(`Found login form at ${loginFormPath}`);
      let content = fs.readFileSync(loginFormPath, 'utf8');
      
      // Update API endpoint from '/api/auth/login' to '/api/auth/direct'
      if (content.includes('/api/auth/login')) {
        content = content.replace(/\/api\/auth\/login/g, '/api/auth/direct');
        console.log('Updated API endpoint to use direct authentication');
      } else {
        console.log('API endpoint not found or already updated');
      }
      
      // Write updated content back
      fs.writeFileSync(loginFormPath, content);
      console.log('Login component successfully updated');
    } catch (error) {
      console.error('Error updating login component:', error);
    }
  } else {
    console.log(`Login form not found at ${loginFormPath}, creating a new one...`);
    createLoginForm();
  }
}

// Create a new login form component if it doesn't exist
function createLoginForm() {
  console.log('Creating new login form component...');
  
  // Path to the components/auth directory
  const authDirPath = path.join(process.cwd(), 'components', 'auth');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(authDirPath)) {
    fs.mkdirSync(authDirPath, { recursive: true });
  }
  
  // Path to the new LoginForm component
  const loginFormPath = path.join(authDirPath, 'LoginForm.tsx');
  
  // Login form component content
  const loginFormContent = `"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await axios.post('/api/auth/direct', {
        email,
        password
      });

      const data = response.data;

      if (data.success) {
        setSuccess("Login successful! Redirecting...");
        
        // Store token and user data
        if (rememberMe) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        
        // Always store in session storage
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = data.redirectUrl || '/';
        }, 1000);
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-3 rounded-md bg-green-50 text-green-600 text-sm">
          {success}
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="user@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="remember"
          checked={rememberMe}
          onCheckedChange={(checked) => setRememberMe(checked as boolean)}
        />
        <Label htmlFor="remember" className="text-sm">Remember me</Label>
      </div>
      
      <Button
        type="submit"
        className="w-full"
        disabled={loading}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {loading ? "Logging in..." : "Login"}
      </Button>
    </form>
  );
}
`;

  // Write the new login form component
  fs.writeFileSync(loginFormPath, loginFormContent);
  console.log(`Created new login form at ${loginFormPath}`);
}

// Update the auth utility functions
function updateAuthUtils() {
  console.log('Setting up auth utilities...');
  
  const authUtilsPath = path.join(process.cwd(), 'lib', 'auth-utils.ts');
  
  // Auth utils content
  const authUtilsContent = `// Client-side auth utilities

/**
 * Check if user is logged in by looking for token in storage
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return !!token;
}

/**
 * Get the logged-in user from storage
 */
export function getUser(): any | null {
  if (typeof window === 'undefined') return null;
  
  const userString = localStorage.getItem('user') || sessionStorage.getItem('user');
  if (!userString) return null;
  
  try {
    return JSON.parse(userString);
  } catch (error) {
    console.error('Failed to parse user data:', error);
    return null;
  }
}

/**
 * Get the authentication token from storage
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

/**
 * Log out the user by clearing storage
 */
export function logout(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  
  // Redirect to login page
  window.location.href = '/auth/login';
}
`;

  // Write or update the auth utils file
  fs.writeFileSync(authUtilsPath, authUtilsContent);
  console.log(`Auth utilities saved to ${authUtilsPath}`);
}

// Run the scripts
async function main() {
  console.log('Running auth system update script...');
  
  // Make sure required packages are installed
  console.log('Installing necessary packages...');
  exec('npm install axios zod bcryptjs --save', (error, stdout, stderr) => {
    if (error) {
      console.error(`Package installation error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Package installation stderr: ${stderr}`);
    }
    console.log(`Package installation stdout: ${stdout}`);
    
    // Update components
    updateLoginComponent();
    updateAuthUtils();
    
    console.log('Auth system update completed successfully!');
    console.log('You can now use these components and utilities for authentication:');
    console.log('1. /api/auth/direct - Direct JWT authentication endpoint');
    console.log('2. /auth/test-login - Test page for login functionality');
    console.log('3. components/auth/LoginForm.tsx - Login form component');
    console.log('4. lib/auth-adapter.ts - Authentication adapter');
    console.log('5. lib/auth-utils.ts - Client-side auth utilities');
  });
}

main(); 