import { Request } from "express";

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: "resident" | "admin";
  flatNumber?: string;
  phone?: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  flatNumber?: string;
  phone?: string;
}

export interface JwtPayload {
  id: number;
  role: string;
}

export interface AuthRequest extends Request {
  user?: User;
}
