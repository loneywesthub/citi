import { Button } from "@/components/ui/button";
import { Building2, LogOut } from "lucide-react";
import type { AuthUser } from "@/lib/auth";

interface HeaderProps {
  user: AuthUser;
  onLogout: () => void;
}

export function Header({ user, onLogout }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="w-10 h-10 citi-blue rounded-lg flex items-center justify-center mr-3">
              <Building2 className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Citigroup</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              Welcome, <span className="font-semibold">{user.username}</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onLogout}
              className="text-gray-500 hover:text-gray-700"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
