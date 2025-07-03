import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import { NotificationToast, type NotificationType } from "@/components/NotificationToast";
import { authService } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";

interface NotificationState {
  isVisible: boolean;
  type: NotificationType;
  title: string;
  message: string;
}

function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [notification, setNotification] = useState<NotificationState>({
    isVisible: false,
    type: "info",
    title: "",
    message: "",
  });

  const showNotification = (type: NotificationType, title: string, message: string) => {
    setNotification({ isVisible: true, type, title, message });
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  };

  const handleLogin = (user: AuthUser) => {
    setUser(user);
    showNotification("success", "Login Successful", "Welcome back to Citigroup Online Banking");
  };

  const handleLoginError = (message: string) => {
    showNotification("error", "Login Failed", message);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    showNotification("info", "Logged Out", "You have been successfully logged out");
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        
        {!user ? (
          <Login onLogin={handleLogin} onError={handleLoginError} />
        ) : (
          <Dashboard user={user} onLogout={handleLogout} />
        )}

        {/* Global Notification Toast */}
        <NotificationToast
          type={notification.type}
          title={notification.title}
          message={notification.message}
          isVisible={notification.isVisible}
          onClose={closeNotification}
        />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
