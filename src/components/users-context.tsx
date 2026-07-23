"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { Role } from "@/lib/team";
import { TeamUser, UserStatus } from "@/lib/users";

const UsersContext = createContext<{ users: TeamUser[]; refreshUsers: () => Promise<void>; updateUser: (id: string, role: Role, status: UserStatus) => Promise<void> }>({ users: [], refreshUsers: async () => undefined, updateUser: async () => undefined });

export function UsersProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<TeamUser[]>([]);
  const refreshUsers = async () => {
    const response = await fetch("/api/users", { cache: "no-store" });
    if (response.ok) setUsers(await response.json());
  };
  const updateUser = async (id: string, role: Role, status: UserStatus) => {
    await fetch("/api/users", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, role, status }) });
    await refreshUsers();
  };
  const value = useMemo(() => ({ users, refreshUsers, updateUser }), [users]);
  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
}

export const useUsers = () => useContext(UsersContext);

