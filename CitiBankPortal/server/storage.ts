import { 
  users, accounts, transactions, transfers,
  type User, type InsertUser, type Account, type InsertAccount,
  type Transaction, type InsertTransaction, type Transfer, type InsertTransfer
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Account operations
  getAccountsByUserId(userId: number): Promise<Account[]>;
  getAccountById(id: number): Promise<Account | undefined>;
  updateAccountBalance(id: number, balance: number): Promise<void>;
  
  // Transaction operations
  getTransactionsByAccountId(accountId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  
  // Transfer operations
  createTransfer(transfer: InsertTransfer): Promise<Transfer>;
  getTransfersByUserId(userId: number): Promise<Transfer[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private accounts: Map<number, Account>;
  private transactions: Map<number, Transaction>;
  private transfers: Map<number, Transfer>;
  private currentUserId: number;
  private currentAccountId: number;
  private currentTransactionId: number;
  private currentTransferId: number;

  constructor() {
    this.users = new Map();
    this.accounts = new Map();
    this.transactions = new Map();
    this.transfers = new Map();
    this.currentUserId = 1;
    this.currentAccountId = 1;
    this.currentTransactionId = 1;
    this.currentTransferId = 1;
    
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create CARUBY user
    const user: User = {
      id: 1,
      username: 'CARUBY',
      password: 'RUBY123#',
      firstName: 'CA',
      lastName: 'RUBY'
    };
    this.users.set(1, user);

    // Create investment account
    const investmentAccount: Account = {
      id: 1,
      userId: 1,
      type: 'investment',
      balance: '23503.00',
      routingNumber: '021000089',
      accountNumber: '****7891',
      isFixed: true,
      fixedUntil: new Date('2025-08-23'),
      monthlyReturn: '3000.00'
    };
    this.accounts.set(1, investmentAccount);

    // Create savings account
    const savingsAccount: Account = {
      id: 2,
      userId: 1,
      type: 'savings',
      balance: '53.00',
      routingNumber: '021000089',
      accountNumber: '****7892',
      isFixed: false,
      fixedUntil: null,
      monthlyReturn: null
    };
    this.accounts.set(2, savingsAccount);

    // Generate transaction history for savings account
    this.generateTransactionHistory();

    this.currentUserId = 2;
    this.currentAccountId = 3;
  }

  private generateTransactionHistory() {
    const categories = [
      'Grocery Store', 'Gas Station', 'Restaurant', 'Coffee Shop', 'Retail Store',
      'Online Purchase', 'ATM Withdrawal', 'Utility Payment', 'Subscription', 'Pharmacy'
    ];

    const today = new Date();
    let runningBalance = 53;
    let transactionId = 1;

    // Generate transactions for the last 30 days
    for (let i = 30; i >= 1; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Generate 1-3 transactions per day
      const numTransactions = Math.floor(Math.random() * 3) + 1;
      
      for (let j = 0; j < numTransactions; j++) {
        const amount = -(Math.random() * 12 + 0.50); // Max $12 spending
        const category = categories[Math.floor(Math.random() * categories.length)];
        
        runningBalance -= amount;
        
        const transaction: Transaction = {
          id: transactionId++,
          accountId: 2, // Savings account
          amount: Math.round(amount * 100) / 100,
          description: category,
          type: 'debit',
          date: date,
          balance: Math.round(runningBalance * 100) / 100
        };
        
        this.transactions.set(transaction.id, transaction);
      }
    }

    this.currentTransactionId = transactionId;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAccountsByUserId(userId: number): Promise<Account[]> {
    return Array.from(this.accounts.values()).filter(account => account.userId === userId);
  }

  async getAccountById(id: number): Promise<Account | undefined> {
    return this.accounts.get(id);
  }

  async updateAccountBalance(id: number, balance: number): Promise<void> {
    const account = this.accounts.get(id);
    if (account) {
      account.balance = balance.toFixed(2);
      this.accounts.set(id, account);
    }
  }

  async getTransactionsByAccountId(accountId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(transaction => transaction.accountId === accountId)
      .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      date: new Date(),
      balance: parseFloat(insertTransaction.balance)
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async createTransfer(insertTransfer: InsertTransfer): Promise<Transfer> {
    const id = this.currentTransferId++;
    const transfer: Transfer = {
      ...insertTransfer,
      id,
      date: new Date(),
      amount: parseFloat(insertTransfer.amount),
      serviceCharge: parseFloat(insertTransfer.serviceCharge || '0'),
      forfeitedReturn: parseFloat(insertTransfer.forfeitedReturn || '0')
    };
    this.transfers.set(id, transfer);
    return transfer;
  }

  async getTransfersByUserId(userId: number): Promise<Transfer[]> {
    // Get user's accounts first
    const userAccounts = await this.getAccountsByUserId(userId);
    const accountIds = userAccounts.map(account => account.id);
    
    return Array.from(this.transfers.values())
      .filter(transfer => 
        accountIds.includes(transfer.fromAccountId) || 
        accountIds.includes(transfer.toAccountId)
      )
      .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());
  }
}

export const storage = new MemStorage();
