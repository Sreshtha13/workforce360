export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: { id: string; name: string; code?: string }[];
  permissions: string[];
};
