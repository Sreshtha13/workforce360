import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");
  
  const company = await prisma.company.upsert({
    where: { id: "default-company" },
    update: {},
    create: {
      id: "default-company",
      name: "Workforce 360",
      legalName: "Workforce 360 Private Limited",
      email: "admin@workforce360.com",
      phone: "+1-234-567-8900",
      address: "123 Business St",
      city: "San Francisco",
      state: "CA",
      country: "USA",
      postalCode: "94102",
    },
  });
  
  console.log("✅ Company created");
  
  const permissions = [
    { name: "Read Users", code: "user.read", resource: "user", action: "read" },
    { name: "Create Users", code: "user.create", resource: "user", action: "create" },
    { name: "Update Users", code: "user.update", resource: "user", action: "update" },
    { name: "Delete Users", code: "user.delete", resource: "user", action: "delete" },
    { name: "Assign Role", code: "user.assign_role", resource: "user", action: "assign_role" },
    
    { name: "Read Roles", code: "role.read", resource: "role", action: "read" },
    { name: "Create Roles", code: "role.create", resource: "role", action: "create" },
    { name: "Update Roles", code: "role.update", resource: "role", action: "update" },
    { name: "Delete Roles", code: "role.delete", resource: "role", action: "delete" },
    
    { name: "Read Permissions", code: "permission.read", resource: "permission", action: "read" },
    { name: "Create Permissions", code: "permission.create", resource: "permission", action: "create" },
    { name: "Update Permissions", code: "permission.update", resource: "permission", action: "update" },
    { name: "Delete Permissions", code: "permission.delete", resource: "permission", action: "delete" },
    
    { name: "Read Departments", code: "department.read", resource: "department", action: "read" },
    { name: "Create Departments", code: "department.create", resource: "department", action: "create" },
    { name: "Update Departments", code: "department.update", resource: "department", action: "update" },
    { name: "Delete Departments", code: "department.delete", resource: "department", action: "delete" },
    
    { name: "Read Teams", code: "team.read", resource: "team", action: "read" },
    { name: "Create Teams", code: "team.create", resource: "team", action: "create" },
    { name: "Update Teams", code: "team.update", resource: "team", action: "update" },
    { name: "Delete Teams", code: "team.delete", resource: "team", action: "delete" },
    
    { name: "Read Designations", code: "designation.read", resource: "designation", action: "read" },
    { name: "Create Designations", code: "designation.create", resource: "designation", action: "create" },
    { name: "Update Designations", code: "designation.update", resource: "designation", action: "update" },
    { name: "Delete Designations", code: "designation.delete", resource: "designation", action: "delete" },
    
    { name: "Read Offices", code: "office.read", resource: "office", action: "read" },
    { name: "Create Offices", code: "office.create", resource: "office", action: "create" },
    { name: "Update Offices", code: "office.update", resource: "office", action: "update" },
    { name: "Delete Offices", code: "office.delete", resource: "office", action: "delete" },
    
    { name: "Read Employee Types", code: "employee_type.read", resource: "employee_type", action: "read" },
    { name: "Create Employee Types", code: "employee_type.create", resource: "employee_type", action: "create" },
    { name: "Update Employee Types", code: "employee_type.update", resource: "employee_type", action: "update" },
    { name: "Delete Employee Types", code: "employee_type.delete", resource: "employee_type", action: "delete" },
    
    { name: "Read Employment Statuses", code: "employment_status.read", resource: "employment_status", action: "read" },
    { name: "Create Employment Statuses", code: "employment_status.create", resource: "employment_status", action: "create" },
    { name: "Update Employment Statuses", code: "employment_status.update", resource: "employment_status", action: "update" },
    { name: "Delete Employment Statuses", code: "employment_status.delete", resource: "employment_status", action: "delete" },
  ];
  
  const createdPermissions = [];
  for (const perm of permissions) {
    const created = await prisma.permission.upsert({
      where: { code: perm.code },
      update: {},
      create: perm,
    });
    createdPermissions.push(created);
  }
  
  console.log(`✅ ${createdPermissions.length} permissions created`);
  
  const superAdminRole = await prisma.role.upsert({
    where: { code: "super_admin" },
    update: {},
    create: {
      name: "Super Administrator",
      code: "super_admin",
      description: "Full system access with all permissions",
      isSystem: true,
    },
  });
  
  const adminRole = await prisma.role.upsert({
    where: { code: "admin" },
    update: {},
    create: {
      name: "Administrator",
      code: "admin",
      description: "Administrative access to most features",
      isSystem: true,
    },
  });
  
  const hrRole = await prisma.role.upsert({
    where: { code: "hr" },
    update: {},
    create: {
      name: "HR Team",
      code: "hr",
      description: "HR team member with employee management access",
      isSystem: true,
    },
  });
  
  const employeeRole = await prisma.role.upsert({
    where: { code: "employee" },
    update: {},
    create: {
      name: "Employee",
      code: "employee",
      description: "Standard employee with basic access",
      isSystem: true,
    },
  });
  
  console.log("✅ Roles created");
  
  await prisma.rolePermission.deleteMany({
    where: { roleId: superAdminRole.id },
  });
  
  for (const permission of createdPermissions) {
    await prisma.rolePermission.create({
      data: {
        roleId: superAdminRole.id,
        permissionId: permission.id,
      },
    });
  }
  
  const hrPermissions = createdPermissions.filter((p) =>
    ["user", "department", "team", "designation", "office", "employee_type", "employment_status"].includes(p.resource),
  );
  
  for (const permission of hrPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: hrRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: hrRole.id,
        permissionId: permission.id,
      },
    });
  }
  
  console.log("✅ Role permissions assigned");
  
  const employeeTypes = [
    { name: "Full-Time", code: "full_time" },
    { name: "Part-Time", code: "part_time" },
    { name: "Contract", code: "contract" },
    { name: "Intern", code: "intern" },
    { name: "Consultant", code: "consultant" },
  ];
  
  for (const type of employeeTypes) {
    await prisma.employeeType.upsert({
      where: { code: type.code },
      update: {},
      create: type,
    });
  }
  
  console.log("✅ Employee types created");
  
  const employmentStatuses = [
    { name: "Active", code: "active" },
    { name: "On Leave", code: "on_leave" },
    { name: "Notice Period", code: "notice_period" },
    { name: "Terminated", code: "terminated" },
    { name: "Resigned", code: "resigned" },
  ];
  
  for (const status of employmentStatuses) {
    await prisma.employmentStatus.upsert({
      where: { code: status.code },
      update: {},
      create: status,
    });
  }
  
  console.log("✅ Employment statuses created");
  
  const superAdminEmail = "admin@workforce360.com";
  const superAdminPassword = "Admin@123";
  const passwordHash = await bcrypt.hash(superAdminPassword, 12);
  
  const superAdminUser = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {},
    create: {
      email: superAdminEmail,
      passwordHash,
      firstName: "Super",
      lastName: "Admin",
      status: "active",
      employeeId: "EMP001",
      emailVerified: true,
    },
  });
  
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: superAdminUser.id,
        roleId: superAdminRole.id,
      },
    },
    update: {},
    create: {
      userId: superAdminUser.id,
      roleId: superAdminRole.id,
    },
  });
  
  console.log("✅ Super admin user created");
  console.log(`📧 Email: ${superAdminEmail}`);
  console.log(`🔑 Password: ${superAdminPassword}`);
  console.log("");
  console.log("🎉 Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
