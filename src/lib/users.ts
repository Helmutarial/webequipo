import { Role } from "@/lib/team";

export type UserStatus = "PENDING" | "APPROVED" | "REJECTED";

export type TeamUser = {
  id: string;
  email: string;
  name: string;
  playerId: string;
  playerName?: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
};

