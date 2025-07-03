import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, transferSchema } from "@shared/schema";
import { z } from "zod";

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware setup would be here in a real app
  // For now, we'll use a simple in-memory session store
  
  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // In a real app, you'd set up proper session management here
      res.json({ 
        success: true, 
        user: { 
          id: user.id, 
          username: user.username, 
          firstName: user.firstName, 
          lastName: user.lastName 
        } 
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Get user accounts
  app.get("/api/accounts/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const accounts = await storage.getAccountsByUserId(userId);
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch accounts" });
    }
  });

  // Get transactions for an account
  app.get("/api/transactions/:accountId", async (req, res) => {
    try {
      const accountId = parseInt(req.params.accountId);
      const transactions = await storage.getTransactionsByAccountId(accountId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Transfer money
  app.post("/api/transfer", async (req, res) => {
    try {
      const transferData = transferSchema.parse(req.body);
      
      // Get source and destination accounts
      const fromAccount = await storage.getAccountById(transferData.fromAccountId);
      const toAccount = await storage.getAccountById(transferData.toAccountId);
      
      if (!fromAccount || !toAccount) {
        return res.status(404).json({ message: "Account not found" });
      }

      const amount = transferData.amount;
      const fromBalance = parseFloat(fromAccount.balance);

      // Check if source account is fixed and requires service charges
      let serviceCharge = 0;
      let forfeitedReturn = 0;
      
      if (fromAccount.isFixed && fromAccount.fixedUntil && new Date() < fromAccount.fixedUntil) {
        serviceCharge = 1200;
        forfeitedReturn = parseFloat(fromAccount.monthlyReturn || '0');
        
        // Check if user has enough balance including charges
        if (fromBalance < amount + serviceCharge + forfeitedReturn) {
          return res.status(400).json({ 
            message: "Insufficient funds including service charges",
            details: {
              required: amount + serviceCharge + forfeitedReturn,
              available: fromBalance,
              serviceCharge,
              forfeitedReturn
            }
          });
        }
      } else {
        // Regular transfer - check sufficient funds
        if (fromBalance < amount) {
          return res.status(400).json({ message: "Insufficient funds" });
        }
      }

      // Update account balances
      const newFromBalance = fromBalance - amount - serviceCharge - forfeitedReturn;
      const newToBalance = parseFloat(toAccount.balance) + amount;
      
      await storage.updateAccountBalance(transferData.fromAccountId, newFromBalance);
      await storage.updateAccountBalance(transferData.toAccountId, newToBalance);

      // Create transfer record
      const transfer = await storage.createTransfer({
        fromAccountId: transferData.fromAccountId,
        toAccountId: transferData.toAccountId,
        amount: amount.toString(),
        description: transferData.description || `Transfer from ${fromAccount.type} to ${toAccount.type}`,
        serviceCharge: serviceCharge.toString(),
        forfeitedReturn: forfeitedReturn.toString(),
        status: "completed"
      });

      // Create transaction records
      await storage.createTransaction({
        accountId: transferData.fromAccountId,
        amount: (-amount).toString(),
        description: `Transfer to ${toAccount.type}`,
        type: "debit",
        balance: newFromBalance.toString()
      });

      if (serviceCharge > 0) {
        await storage.createTransaction({
          accountId: transferData.fromAccountId,
          amount: (-serviceCharge).toString(),
          description: "Early access service charge",
          type: "debit",
          balance: (newFromBalance + amount - serviceCharge).toString()
        });
      }

      if (forfeitedReturn > 0) {
        await storage.createTransaction({
          accountId: transferData.fromAccountId,
          amount: (-forfeitedReturn).toString(),
          description: "Forfeited monthly return",
          type: "debit",
          balance: (newFromBalance + amount - forfeitedReturn).toString()
        });
      }

      await storage.createTransaction({
        accountId: transferData.toAccountId,
        amount: amount.toString(),
        description: `Transfer from ${fromAccount.type}`,
        type: "credit",
        balance: newToBalance.toString()
      });

      res.json({ 
        success: true, 
        transfer,
        charges: {
          serviceCharge,
          forfeitedReturn,
          totalCharges: serviceCharge + forfeitedReturn
        }
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid transfer data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Transfer failed" });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
