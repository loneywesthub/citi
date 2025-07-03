import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Info } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
  amount: number;
  serviceCharge: number;
  forfeitedReturn: number;
}

export function TransferModal({
  isOpen,
  onClose,
  onProceed,
  amount,
  serviceCharge,
  forfeitedReturn,
}: TransferModalProps) {
  const totalCost = serviceCharge + forfeitedReturn;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
            <AlertTriangle className="text-red-600 w-8 h-8" />
          </div>
          <DialogTitle className="text-center">Transfer Restricted</DialogTitle>
          <DialogDescription className="text-center">
            Your investment account has early access restrictions
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-gray-700">
            Your investment account is fixed until <strong>August 23rd</strong>.
          </p>
          <p className="text-gray-700">
            To access funds early, you will forfeit this month's return of{" "}
            <strong>{formatCurrency(forfeitedReturn)}</strong> and pay a service charge of{" "}
            <strong>{formatCurrency(serviceCharge)}</strong>.
          </p>
          
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Total cost: <strong>{formatCurrency(totalCost)}</strong> ({formatCurrency(forfeitedReturn)} forfeited return + {formatCurrency(serviceCharge)} service fee)
            </AlertDescription>
          </Alert>
        </div>
        
        <DialogFooter className="flex space-x-3 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel Transfer
          </Button>
          <Button 
            variant="destructive" 
            onClick={onProceed} 
            className="flex-1"
          >
            Pay & Transfer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
