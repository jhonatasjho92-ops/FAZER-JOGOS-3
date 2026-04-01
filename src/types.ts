export type UserRole = "user" | "admin";
export type VIPStatus = "none" | "basic" | "pro" | "ultra";

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  vipStatus: VIPStatus;
  createdAt: string;
}

export interface GameProject {
  id: string;
  userId: string;
  name: string;
  prompt: string;
  code: string;
  isPublic: boolean;
  plays: number;
  rating: number;
  createdAt: string;
}

export interface CharacterAsset {
  id: string;
  userId: string;
  concept: string;
  code: string;
  createdAt: string;
}

export interface MapAsset {
  id: string;
  userId: string;
  concept: string;
  code: string;
  createdAt: string;
}

export interface Message {
  role: "user" | "model";
  text: string;
  code?: string;
  timestamp: Date;
}

export interface CharacterResult {
  code: string;
}

export type MainTab = "chat" | "create" | "run" | "character" | "map" | "community" | "admin" | "editor";
