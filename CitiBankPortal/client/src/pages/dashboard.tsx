import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Eye, 
  EyeOff, 
  ArrowUpDown, 
  History, 
  Home, 
  Lock,
  TrendingUp,
  CreditCard,
  Info
} from "lucide-react";
import { Header } from "@/components/Header";
import { TransferModal } from "@/components/TransferModal";
import { NotificationToast, type NotificationType } from "@/components/NotificationToast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import type { AuthUser } from "@/lib/auth";
import type { Account, Transaction, TransferData } from "@shared/schema";

interface DashboardProps {
  user: AuthUser;
  onLogout: () => void;
}

interface NotificationState {
  isVisible: boolean;
  type: NotificationType;
  title: string;
  message: string;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [balanceVisibility, setBalanceVisibility] = useState<Record<number, boolean>>({});
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [pendingTransfer, setPendingTransfer] = useState<TransferData | null>(null);
  const [notification, setNotification] = useState<NotificationState>({
    isVisible: false,
    type: "info",
    title: "",
    message: "",
  });

  const queryClient = useQueryClient();

  // Fetch user accounts
  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: [`/api/accounts/${user.id}`],
    enabled: !!user.id,
  });

  // Fetch transactions for savings account (account ID 2)
  const savingsAccount = accounts.find((acc: Account) => acc.type === 'savings');
  const { data: transactions = [] } = useQuery({
    queryKey: [`/api/transactions/${savingsAccount?.id}`],
    enabled: !!savingsAccount?.id,
  });

  // Transfer mutation
  const transferMutation = useMutation({
    mutationFn: async (transferData: TransferData) => {
      const response = await apiRequest("POST", "/api/transfer", transferData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/accounts/${user.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/transactions/${savingsAccount?.id}`] });
      
      const totalCharges = data.charges.totalCharges;
      showNotification(
        totalCharges > 0 ? "warning" : "success",
        "Transfer Completed",
        totalCharges > 0 
          ? `$${pendingTransfer?.amount} transferred. Service charges of $${totalCharges} applied.`
          : `$${pendingTransfer?.amount} transferred successfully.`
      );
      setPendingTransfer(null);
    },
    onError: (error: any) => {
      showNotification("error", "Transfer Failed", error.message || "An error occurred during transfer");
    },
  });

  const showNotification = (type: NotificationType, title: string, message: string) => {
    setNotification({ isVisible: true, type, title, message });
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  };

  const toggleBalanceVisibility = (accountId: number) => {
    setBalanceVisibility(prev => ({
      ...prev,
      [accountId]: !prev[accountId]
    }));
  };

  const handleTransferSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const transferData: TransferData = {
      fromAccountId: parseInt(formData.get('fromAccount') as string),
      toAccountId: parseInt(formData.get('toAccount') as string),
      amount: parseFloat(formData.get('amount') as string),
      description: formData.get('description') as string || undefined,
      routingNumber: formData.get('routingNumber') as string,
      accountNumber: formData.get('accountNumber') as string,
    };

    // Validate form
    if (!transferData.amount || transferData.amount <= 0) {
      showNotification("error", "Invalid Amount", "Please enter a valid transfer amount");
      return;
    }

    if (!transferData.routingNumber || transferData.routingNumber.length !== 9) {
      showNotification("error", "Invalid Routing Number", "Please enter a valid 9-digit routing number");
      return;
    }

    if (!transferData.accountNumber || transferData.accountNumber.length < 4) {
      showNotification("error", "Invalid Account Number", "Please enter a valid account number");
      return;
    }

    const fromAccount = accounts.find((acc: Account) => acc.id === transferData.fromAccountId);
    
    // Check if transferring from fixed investment account
    if (fromAccount?.isFixed && fromAccount.fixedUntil && new Date() < new Date(fromAccount.fixedUntil)) {
      setPendingTransfer(transferData);
      setTransferModalOpen(true);
      return;
    }

    transferMutation.mutate(transferData);
  };

  const proceedWithTransfer = () => {
    if (pendingTransfer) {
      transferMutation.mutate(pendingTransfer);
      setTransferModalOpen(false);
    }
  };

  const investmentAccount = accounts.find((acc: Account) => acc.type === 'investment');

  if (accountsLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={onLogout} />
      
      <Tabs defaultValue="dashboard" className="w-full">
        {/* Navigation Tabs */}
        <nav className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <TabsList className="h-auto p-0 bg-transparent">
              <TabsTrigger 
                value="dashboard" 
                className="nav-tab data-[state=active]:nav-tab-active flex items-center py-4 px-4"
              >
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger 
                value="transfer" 
                className="nav-tab data-[state=active]:nav-tab-active flex items-center py-4 px-4"
              >
                <ArrowUpDown className="w-4 h-4 mr-2" />
                Transfer
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="nav-tab data-[state=active]:nav-tab-active flex items-center py-4 px-4"
              >
                <History className="w-4 h-4 mr-2" />
                Transaction History
              </TabsTrigger>
            </TabsList>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Account Cards */}
              <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Overview</h2>
                
                {/* Investment Account */}
                {investmentAccount && (
                  <Card className="mb-6 border-l-4 border-citi-blue">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg font-semibold">Investment Account</CardTitle>
                          <p className="text-sm text-gray-600">
                            Fixed Term - Available {investmentAccount.fixedUntil ? formatDate(investmentAccount.fixedUntil) : 'Now'}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleBalanceVisibility(investmentAccount.id)}
                            className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                          >
                            {balanceVisibility[investmentAccount.id] ? 
                              <EyeOff className="h-4 w-4" /> : 
                              <Eye className="h-4 w-4" />
                            }
                          </Button>
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            Fixed
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Balance:</span>
                        <span className="font-bold text-2xl text-green-600">
                          {balanceVisibility[investmentAccount.id] ? 
                            '••••••' : 
                            formatCurrency(investmentAccount.balance)
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Monthly Returns:</span>
                        <span className="font-semibold text-green-600 flex items-center">
                          <TrendingUp className="w-4 h-4 mr-1" />
                          +{formatCurrency(investmentAccount.monthlyReturn || 0)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Savings Account */}
                {savingsAccount && (
                  <Card className="border-l-4 border-green-500">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg font-semibold">Savings & Spending</CardTitle>
                          <p className="text-sm text-gray-600">Available for immediate use</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleBalanceVisibility(savingsAccount.id)}
                            className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                          >
                            {balanceVisibility[savingsAccount.id] ? 
                              <EyeOff className="h-4 w-4" /> : 
                              <Eye className="h-4 w-4" />
                            }
                          </Button>
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Active
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Available Balance:</span>
                        <span className="font-bold text-2xl text-blue-600">
                          {balanceVisibility[savingsAccount.id] ? 
                            '••••••' : 
                            formatCurrency(savingsAccount.balance)
                          }
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Quick Actions */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
                
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Transfer Money</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      className="w-full citi-blue hover:citi-dark-blue text-white font-semibold"
                      onClick={() => {
                        const transferTab = document.querySelector('[value="transfer"]') as HTMLElement;
                        transferTab?.click();
                      }}
                    >
                      <ArrowUpDown className="w-4 h-4 mr-2" />
                      Start Transfer
                    </Button>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {transactions.slice(0, 5).map((transaction: Transaction) => (
                        <div key={transaction.id} className="flex justify-between items-center py-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                            <p className="text-xs text-gray-500">{formatDate(transaction.date || new Date())}</p>
                          </div>
                          <span className={`text-sm font-medium ${
                            parseFloat(transaction.amount) < 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {parseFloat(transaction.amount) < 0 ? '-' : '+'}
                            {formatCurrency(Math.abs(parseFloat(transaction.amount)))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="transfer">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Transfer Money</h2>
              
              <Card>
                <CardContent className="p-8">
                  <form onSubmit={handleTransferSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="block text-sm font-medium text-gray-700 mb-2">From Account</Label>
                        <Select name="fromAccount" defaultValue={investmentAccount?.id.toString()}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts.map((account: Account) => (
                              <SelectItem key={account.id} value={account.id.toString()}>
                                {account.type === 'investment' ? 'Investment Account' : 'Savings & Spending'} - {formatCurrency(account.balance)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label className="block text-sm font-medium text-gray-700 mb-2">To Account</Label>
                        <Select name="toAccount" defaultValue={savingsAccount?.id.toString()}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts.map((account: Account) => (
                              <SelectItem key={account.id} value={account.id.toString()}>
                                {account.type === 'investment' ? 'Investment Account' : 'Savings & Spending'} - {formatCurrency(account.balance)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="block text-sm font-medium text-gray-700 mb-2">Transfer Amount</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                        <Input 
                          type="number" 
                          name="amount"
                          className="pl-8"
                          placeholder="0.00" 
                          step="0.01"
                          min="0.01"
                          required
                        />
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Transfer Verification</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label className="block text-sm font-medium text-gray-700 mb-2">Routing Number</Label>
                          <Input 
                            type="text" 
                            name="routingNumber"
                            placeholder="021000089" 
                            maxLength={9}
                            required
                          />
                        </div>
                        
                        <div>
                          <Label className="block text-sm font-medium text-gray-700 mb-2">Account Number</Label>
                          <Input 
                            type="text" 
                            name="accountNumber"
                            placeholder="****7891"
                            minLength={4}
                            required
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</Label>
                      <Input 
                        type="text" 
                        name="description"
                        placeholder="Transfer description" 
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full citi-blue hover:citi-dark-blue text-white py-4 font-semibold"
                      disabled={transferMutation.isPending}
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      {transferMutation.isPending ? "Processing..." : "Secure Transfer"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Transaction History</h2>
            
            <Card>
              <CardHeader className="border-b">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="text-lg font-semibold">Savings & Spending Account</CardTitle>
                  <Select defaultValue="last30">
                    <SelectTrigger className="w-48 mt-4 sm:mt-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="last30">Last 30 Days</SelectItem>
                      <SelectItem value="last90">Last 90 Days</SelectItem>
                      <SelectItem value="last365">Last Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              
              <div className="overflow-x-auto">
                {transactions.length > 0 ? (
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.map((transaction: Transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(transaction.date || new Date())}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction.description}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                            parseFloat(transaction.amount) < 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {parseFloat(transaction.amount) < 0 ? '-' : '+'}
                            {formatCurrency(Math.abs(parseFloat(transaction.amount)))}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(transaction.balance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No transactions found</p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        </main>
      </Tabs>

      {/* Transfer Modal */}
      <TransferModal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        onProceed={proceedWithTransfer}
        amount={pendingTransfer?.amount || 0}
        serviceCharge={1200}
        forfeitedReturn={3000}
      />

      {/* Notification Toast */}
      <NotificationToast
        type={notification.type}
        title={notification.title}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={closeNotification}
      />
    </div>
  );
}
