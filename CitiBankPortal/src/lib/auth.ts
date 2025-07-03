import { apiRequest } from "./queryClient";
import type { LoginData, User } from "@shared/schema";

export interface AuthUser {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
}

class AuthService {
  private user: AuthUser | null = null;

  async login(credentials: LoginData): Promise<AuthUser> {
    const response = await apiRequest("POST", "/api/auth/login", credentials);
    const data = await response.json();
    
    if (data.success) {
      this.user = data.user;
      return data.user;
    }
    
    throw new Error("Login failed");
  }

  logout(): void {
    this.user = null;
  }

  getCurrentUser(): AuthUser | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return this.user !== null;
  }
}

export const authService = new AuthService();
