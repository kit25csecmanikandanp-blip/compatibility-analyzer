/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProfile } from '../../types/api';

const USERS_STORAGE_KEY = 'api_compat_analyzer_users_v1';
const CURRENT_USER_KEY = 'api_compat_analyzer_active_session_v1';

interface StoredUser extends UserProfile {
  passwordHash: string; // Base64 pseudo-hash for safe client demo storage
}

// Simple deterministic hash for demo client credentials
function hashPassword(pass: string): string {
  let hash = 0;
  for (let i = 0; i < pass.length; i++) {
    const char = pass.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return btoa(`salt_${hash}_compat`);
}

function getStoredUsers(): StoredUser[] {
  try {
    const data = localStorage.getItem(USERS_STORAGE_KEY);
    if (!data) {
      // Seed initial demo developer account
      const seed: StoredUser = {
        id: 'usr_demo_developer',
        email: 'developer@example.com',
        name: 'Alex Rivera',
        createdAt: new Date().toISOString(),
        passwordHash: hashPassword('DemoPass123!')
      };
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([seed]));
      return [seed];
    }
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed reading users:', err);
    return [];
  }
}

function saveStoredUsers(users: StoredUser[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed saving users:', err);
  }
}

export function getCurrentUser(): UserProfile | null {
  try {
    const data = localStorage.getItem(CURRENT_USER_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch (err) {
    return null;
  }
}

export function setCurrentUser(user: UserProfile | null): void {
  try {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
    window.dispatchEvent(new Event('auth-state-change'));
  } catch (err) {
    console.error('Failed updating session:', err);
  }
}

export async function loginWithEmail(email: string, pass: string): Promise<UserProfile> {
  const cleanEmail = email.trim().toLowerCase();
  const users = getStoredUsers();
  const user = users.find(u => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    throw new Error('No account found with this email address.');
  }

  const passHash = hashPassword(pass);
  if (user.passwordHash !== passHash) {
    throw new Error('Incorrect password. Please verify your credentials.');
  }

  const profile: UserProfile = {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt
  };

  setCurrentUser(profile);
  return profile;
}

export async function createAccount(name: string, email: string, pass: string): Promise<UserProfile> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();

  if (!cleanName || cleanName.length < 2) {
    throw new Error('Please enter a valid display name (at least 2 characters).');
  }
  if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    throw new Error('Please enter a valid email address.');
  }
  if (!pass || pass.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  const users = getStoredUsers();
  const existing = users.find(u => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    throw new Error('An account with this email address already exists. Please log in.');
  }

  const newUser: StoredUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    email: cleanEmail,
    name: cleanName,
    createdAt: new Date().toISOString(),
    passwordHash: hashPassword(pass)
  };

  users.push(newUser);
  saveStoredUsers(users);

  const profile: UserProfile = {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    createdAt: newUser.createdAt
  };

  setCurrentUser(profile);
  return profile;
}

export function logout(): void {
  setCurrentUser(null);
}

export function requestPasswordReset(email: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const cleanEmail = email.trim().toLowerCase();
    const users = getStoredUsers();
    const exists = users.some(u => u.email.toLowerCase() === cleanEmail);
    if (!exists) {
      reject(new Error('No registered account found with this email address.'));
      return;
    }
    // Return friendly simulated recovery token
    setTimeout(() => {
      resolve(`Password reset instructions have been dispatched to ${cleanEmail}. Check your inbox.`);
    }, 600);
  });
}
