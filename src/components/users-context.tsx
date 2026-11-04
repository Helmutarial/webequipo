"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { TeamUser } from "@/lib/users";

const UsersContext = createContext<{ users: TeamUser[]; refreshUsers: () => Promise<void> }>({ users: [], refreshUsers: async () => undefined });

export function UsersProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<TeamUser[]>([]);
  const refreshUsers = async () => {
    const response = await fetch("/api/users", { cache: "no-store" });
    if (response.ok) setUsers(await response.json());
  };
  const value = useMemo(() => ({ users, refreshUsers }), [users]);
  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
}

export const useUsers = () => useContext(UsersContext);

