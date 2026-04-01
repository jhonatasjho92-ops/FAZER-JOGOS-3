export interface UserProfile {
  id: string;
  email: string;
  role: "user" | "admin";
  vipStatus: "none" | "basic" | "pro" | "ultra";
  createdAt: string;
}

export interface Message {
  role: "user" | "model";
  text: string;
  code?: string;
  timestamp: Date;
}

export interface CharacterResult {
  concept: string;
  code: string;
  integration: string;
}
