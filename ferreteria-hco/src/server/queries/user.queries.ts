import { cache } from "react";
import type { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type UserFilters = {
  search?: string;
  role?: Role;
  storeId?: string;
  onlyActive?: boolean;
};

export const getUsers = cache(async (filters: UserFilters = {}) => {
  return prisma.user.findMany({
    where: {
      ...(filters.role && { role: filters.role }),
      ...(filters.storeId && { storeId: filters.storeId }),
      ...(filters.onlyActive && { isActive: true }),
      ...(filters.search && {
        OR: [
          { lastNameP: { contains: filters.search.toLowerCase() } },
          { lastNameM: { contains: filters.search.toLowerCase() } },
          { firstName: { contains: filters.search.toLowerCase() } },
          { documentNumber: { contains: filters.search.toUpperCase() } },
        ],
      }),
    },
    orderBy: [{ isActive: "desc" }, { lastNameP: "asc" }, { lastNameM: "asc" }],
    select: {
      id: true,
      documentType: true,
      documentNumber: true,
      lastNameP: true,
      lastNameM: true,
      firstName: true,
      phone: true,
      email: true,
      birthDate: true,
      address: true,
      gender: true,
      role: true,
      storeId: true,
      isActive: true,
      createdAt: true,
      store: { select: { id: true, code: true, name: true } },
    },
  });
});

export type UserListItem = Awaited<ReturnType<typeof getUsers>>[number];

export const getUserById = cache(async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      documentType: true,
      documentNumber: true,
      lastNameP: true,
      lastNameM: true,
      firstName: true,
      phone: true,
      email: true,
      birthDate: true,
      address: true,
      gender: true,
      role: true,
      storeId: true,
      isActive: true,
    },
  });
});
