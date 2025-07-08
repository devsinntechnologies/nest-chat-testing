// @ts-nocheck
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { jwtDecode } from 'jwt-decode';
import { DecodedToken } from "./types"; 


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const decodeToken = (token: string): DecodedToken | null => {
  try {
    // Decode the token
    
    const decoded = jwtDecode<DecodedToken>(token);

    // Check token expiration
    // if (isTokenExpired(decoded)) {
    //   return null;
    // }

    return decoded;
  } catch (error) {
    return error;
  }
};
export const getInitials = (name?: string) => {
  if (!name) return "A";
  const parts = name.trim().split(" ");
  const initials = parts.slice(0, 2).map(part => part[0]?.toUpperCase());
  return initials.join(" ");
};