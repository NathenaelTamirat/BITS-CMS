declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: number;
        email: string;
        role: "admin" | "superadmin";
      };
    }
  }
}

export {};
