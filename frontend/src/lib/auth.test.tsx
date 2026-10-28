import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../lib/auth';
import { ReactNode } from 'react';

const mockUser = {
  id: '1',
  email: 'test@example.com',
  username: 'testuser',
  full_name: 'Test User',
  is_active: true,
  is_verified: true,
  is_superuser: false,
  roles: [],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

jest.mock('../lib/api', () => ({
  api: {
    post: jest.fn(),
    get: jest.fn(),
    patch: jest.fn(),
  },
}));

import { api } from '../lib/api';

const TestComponent = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('provides auth context', () => {
    let contextValue: any;
    const TestChild = () => {
      contextValue = useAuth();
      return null;
    };
    render(<TestComponent><TestChild /></TestComponent>);
    expect(contextValue).toBeDefined();
    expect(contextValue.user).toBeNull();
    expect(contextValue.loading).toBe(true);
  });

  it('initializes user from localStorage', () => {
    localStorage.setItem('access_token', 'test-token');
    localStorage.setItem('user', JSON.stringify(mockUser));

    let contextValue: any;
    const TestChild = () => {
      contextValue = useAuth();
      return null;
    };
    render(<TestComponent><TestChild /></TestComponent>);
    
    expect(contextValue.user).toEqual(mockUser);
    expect(contextValue.isAuthenticated).toBe(true);
  });

  it('login sets user and tokens', async () => {
    (api.post as jest.Mock).mockResolvedValue({
      data: { access_token: 'new-token', refresh_token: 'refresh-token', user: mockUser },
    });

    let contextValue: any;
    const TestChild = () => {
      contextValue = useAuth();
      return null;
    };
    render(<TestComponent><TestChild /></TestComponent>);

    await act(async () => {
      await contextValue.login('test@example.com', 'password123');
    });

    expect(contextValue.user).toEqual(mockUser);
    expect(localStorage.getItem('access_token')).toBe('new-token');
    expect(localStorage.getItem('refresh_token')).toBe('refresh-token');
  });

  it('logout clears user and tokens', async () => {
    localStorage.setItem('access_token', 'test-token');
    localStorage.setItem('user', JSON.stringify(mockUser));

    let contextValue: any;
    const TestChild = () => {
      contextValue = useAuth();
      return null;
    };
    render(<TestComponent><TestChild /></TestComponent>);

    await act(async () => {
      await contextValue.logout();
    });

    expect(contextValue.user).toBeNull();
    expect(localStorage.getItem('access_token')).toBeNull();
  });
});