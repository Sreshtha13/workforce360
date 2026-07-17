import { UserRepository } from "../repositories/user.repository";
import { hashPassword } from "../lib/password";
import type { CreateUserInput, UpdateUserInput } from "../repositories/user.repository";

export class UserService {
  private userRepo: UserRepository;
  
  constructor() {
    this.userRepo = new UserRepository();
  }
  
  async getAllUsers(filters?: {
    departmentId?: string;
    status?: string;
    search?: string;
  }) {
    return this.userRepo.findAllUsers(filters);
  }
  
  async getUserById(id: string) {
    const user = await this.userRepo.findUserById(id);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }
  
  async createUser(data: CreateUserInput & { password?: string }) {
    const { password, ...userData } = data;
    
    let passwordHash: string | undefined;
    if (password) {
      passwordHash = await hashPassword(password);
    }
    
    return this.userRepo.createUser({
      ...userData,
      passwordHash,
    });
  }
  
  async updateUser(id: string, data: UpdateUserInput & { password?: string }) {
    const { password, ...userData } = data;
    
    const existing = await this.userRepo.findUserById(id);
    if (!existing) {
      throw new Error("User not found");
    }
    
    let passwordHash: string | undefined;
    if (password) {
      passwordHash = await hashPassword(password);
    }
    
    return this.userRepo.updateUser(id, {
      ...userData,
      ...(passwordHash && { passwordHash }),
    });
  }
  
  async deleteUser(id: string) {
    const existing = await this.userRepo.findUserById(id);
    if (!existing) {
      throw new Error("User not found");
    }
    return this.userRepo.deleteUser(id);
  }
  
  async assignRole(userId: string, roleId: string, assignedBy?: string) {
    const user = await this.userRepo.findUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    const existingRoles = await this.userRepo.getUserRoles(userId);
    const hasRole = existingRoles.some((ur) => ur.roleId === roleId);
    
    if (hasRole) {
      throw new Error("User already has this role");
    }
    
    return this.userRepo.assignRole(userId, roleId, assignedBy);
  }
  
  async removeRole(userId: string, roleId: string) {
    const user = await this.userRepo.findUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    return this.userRepo.removeRole(userId, roleId);
  }
  
  async getUserRoles(userId: string) {
    return this.userRepo.getUserRoles(userId);
  }
}
