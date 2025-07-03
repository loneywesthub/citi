import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type NotificationType = "success" | "error" | "warning" | "info";

interface NotificationToastProps {
  type: NotificationType;
  title: string;
  message: string;
  isVisible: boolean;
  onClose: () => void;
  autoHide?: boolean;
  duration?: number;
}

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap = {
  success: "border-green-500 bg-green-50",
  error: "border-red-500 bg-red-50",
  warning: "border-yellow-500 bg-yellow-50",
  info: "border-blue-500 bg-blue-50",
};

const iconColorMap = {
  success: "text-green-500",
  error: "text-red-500",
  warning: "text-yellow-500",
  info: "text-blue-500",
};

export function NotificationToast({
  type,
  title,
  message,
  isVisible,
  onClose,
  autoHide = true,
  duration = 5000,
}: NotificationToastProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const Icon = iconMap[type];

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      if (autoHide) {
        const timer = setTimeout(() => {
          onClose();
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      setIsAnimating(false);
    }
  }, [isVisible, autoHide, duration, onClose]);

  if (!isVisible && !isAnimating) return null;

  return (
    <div 
      className={cn(
        "fixed top-4 right-4 z-50 max-w-sm w-full transition-all duration-300 ease-out",
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      )}
    >
      <Alert className={cn("border-l-4", colorMap[type])}>
        <div className="flex items-start">
          <Icon className={cn("h-5 w-5 mr-3 mt-0.5", iconColorMap[type])} />
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900">{title}</h4>
            <AlertDescription className="text-sm text-gray-600 mt-1">
              {message}
            </AlertDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 ml-2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Alert>
    </div>
  );
}
