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

  function permissionMeta(resource: string): { module: string; feature: string } {
    const orgResources = new Set([
      "department",
      "team",
      "designation",
      "office",
      "employee_type",
      "employment_status",
    ]);
    const adminResources = new Set(["user", "role", "permission"]);
    const recruitmentResources = new Set([
      "job",
      "candidate",
      "application",
      "interview",
      "assessment",
      "offer",
    ]);
    const hrResources = new Set(["employee", "policy", "asset", "hr", "ticket"]);
    const portalResources = new Set(["portal"]);
    const label = resource
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

    if (orgResources.has(resource)) {
      return { module: "Organization", feature: label };
    }
    if (adminResources.has(resource)) {
      return { module: "Administration", feature: label };
    }
    if (resource === "dashboard") {
      return { module: "Administration", feature: "Dashboard" };
    }
    if (recruitmentResources.has(resource)) {
      return { module: "Recruitment", feature: label };
    }
    if (hrResources.has(resource)) {
      return { module: "HR", feature: label };
    }
    if (portalResources.has(resource)) {
      return { module: "Employee Portal", feature: label };
    }
    return { module: "General", feature: label };
  }
  
  const permissions = [
    { name: "Read Users", code: "user.read", resource: "user", action: "read" },
    { name: "Create Users", code: "user.create", resource: "user", action: "create" },
    { name: "Update Users", code: "user.update", resource: "user", action: "update" },
    { name: "Delete Users", code: "user.delete", resource: "user", action: "delete" },
    { name: "Assign Role", code: "user.assign_role", resource: "user", action: "assign_role" },

    { name: "Admin Dashboard", code: "dashboard.read", resource: "dashboard", action: "read" },
    
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

    { name: "Read Jobs", code: "job.read", resource: "job", action: "read" },
    { name: "Create Jobs", code: "job.create", resource: "job", action: "create" },
    { name: "Update Jobs", code: "job.update", resource: "job", action: "update" },
    { name: "Delete Jobs", code: "job.delete", resource: "job", action: "delete" },

    { name: "Read Candidates", code: "candidate.read", resource: "candidate", action: "read" },
    { name: "Update Candidates", code: "candidate.update", resource: "candidate", action: "update" },

    { name: "Read Applications", code: "application.read", resource: "application", action: "read" },
    { name: "Update Applications", code: "application.update", resource: "application", action: "update" },
    { name: "Override Pipeline Stage", code: "application.override_stage", resource: "application", action: "override_stage" },

    { name: "Read Interviews", code: "interview.read", resource: "interview", action: "read" },
    { name: "Create Interviews", code: "interview.create", resource: "interview", action: "create" },

    { name: "Create Assessments", code: "assessment.create", resource: "assessment", action: "create" },

    { name: "Read Offers", code: "offer.read", resource: "offer", action: "read" },
    { name: "Create Offers", code: "offer.create", resource: "offer", action: "create" },
    { name: "Update Offers", code: "offer.update", resource: "offer", action: "update" },

    { name: "Read Employees", code: "employee.read", resource: "employee", action: "read" },
    { name: "Update Employees", code: "employee.update", resource: "employee", action: "update" },

    { name: "HR Dashboard", code: "hr.dashboard.read", resource: "hr", action: "read" },

    { name: "Read Policies", code: "policy.read", resource: "policy", action: "read" },
    { name: "Create Policies", code: "policy.create", resource: "policy", action: "create" },
    { name: "Update Policies", code: "policy.update", resource: "policy", action: "update" },

    { name: "Read Assets", code: "asset.read", resource: "asset", action: "read" },
    { name: "Create Assets", code: "asset.create", resource: "asset", action: "create" },
    { name: "Update Assets", code: "asset.update", resource: "asset", action: "update" },

    { name: "Read Support Tickets", code: "ticket.read", resource: "ticket", action: "read" },
    { name: "Create Support Tickets", code: "ticket.create", resource: "ticket", action: "create" },
    { name: "Manage Support Tickets", code: "ticket.manage", resource: "ticket", action: "manage" },

    { name: "Portal Read", code: "portal.read", resource: "portal", action: "read" },
    { name: "Portal Update", code: "portal.update", resource: "portal", action: "update" },
  ];
  
  const createdPermissions = [];
  for (const perm of permissions) {
    const meta = permissionMeta(perm.resource);
    const created = await prisma.permission.upsert({
      where: { code: perm.code },
      update: {
        module: meta.module,
        feature: meta.feature,
      },
      create: {
        ...perm,
        module: meta.module,
        feature: meta.feature,
      },
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

  const candidateRole = await prisma.role.upsert({
    where: { code: "candidate" },
    update: {},
    create: {
      name: "Candidate",
      code: "candidate",
      description: "Job applicant with candidate portal access",
      isSystem: true,
    },
  });

  const developerRole = await prisma.role.upsert({
    where: { code: "developer" },
    update: {
      name: "Developer",
      description:
        "Engineering contributor with portal access and team-scoped employee visibility",
      isSystem: true,
    },
    create: {
      name: "Developer",
      code: "developer",
      description:
        "Engineering contributor with portal access and team-scoped employee visibility",
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
    [
      "user",
      "department",
      "team",
      "designation",
      "office",
      "employee_type",
      "employment_status",
      "job",
      "candidate",
      "application",
      "interview",
      "assessment",
      "offer",
      "employee",
      "hr",
      "policy",
      "asset",
      "ticket",
    ].includes(p.resource),
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

  const adminPermissions = createdPermissions.filter((p) => {
    if (p.resource === "role" || p.resource === "permission") {
      return p.action === "read";
    }
    return true;
  });

  await prisma.rolePermission.deleteMany({
    where: { roleId: adminRole.id },
  });

  for (const permission of adminPermissions) {
    await prisma.rolePermission.create({
      data: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  const employeePermissions = createdPermissions.filter(
    (p) => ["portal"].includes(p.resource) || p.code === "ticket.create",
  );
  for (const permission of employeePermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: employeeRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: employeeRole.id,
        permissionId: permission.id,
      },
    });
  }

  /** Developer: portal + read-only org context + scoped people lists + tickets. No HR/admin writes. */
  const developerPermissionCodes = new Set([
    "portal.read",
    "portal.update",
    "user.read",
    "employee.read",
    "team.read",
    "department.read",
    "designation.read",
    "ticket.create",
  ]);
  const developerPermissions = createdPermissions.filter((p) =>
    developerPermissionCodes.has(p.code),
  );

  await prisma.rolePermission.deleteMany({
    where: { roleId: developerRole.id },
  });
  for (const permission of developerPermissions) {
    await prisma.rolePermission.create({
      data: {
        roleId: developerRole.id,
        permissionId: permission.id,
      },
    });
  }

  const candidatePermissions = createdPermissions.filter((p) =>
    p.code === "portal.read" || p.code === "portal.update",
  );
  for (const permission of candidatePermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: candidateRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: candidateRole.id,
        permissionId: permission.id,
      },
    });
  }
  
  console.log("✅ Role permissions assigned");
  
  const employeeTypes = [
    { name: "Full Time", code: "FT" },
    { name: "Part Time", code: "PT" },
    { name: "Contract", code: "CNT" },
    { name: "Intern", code: "INT" },
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
    { name: "Active", code: "active", description: "Currently working" },
    { name: "On Probation", code: "probation", description: "Within probation period" },
    { name: "On Leave", code: "on_leave", description: "Temporarily away" },
    { name: "Notice Period", code: "notice", description: "Serving notice" },
    { name: "Suspended", code: "suspended", description: "Temporarily suspended" },
    { name: "Terminated", code: "terminated", description: "Employment ended" },
  ];

  // Rename legacy type-like statuses first so new status names do not collide on unique `name`.
  for (const legacy of [
    { code: "full_time", name: "Legacy Full Time (use Employee Type)" },
    { code: "part_time", name: "Legacy Part Time (use Employee Type)" },
    { code: "contract", name: "Legacy Contract (use Employee Type)" },
    { code: "intern", name: "Legacy Intern (use Employee Type)" },
    { code: "consultant", name: "Legacy Consultant (use Employee Type)" },
  ]) {
    await prisma.employmentStatus.updateMany({
      where: { code: legacy.code },
      data: { name: legacy.name, isActive: false },
    });
  }

  for (const status of employmentStatuses) {
    const existingByCode = await prisma.employmentStatus.findUnique({ where: { code: status.code } });
    if (existingByCode) {
      await prisma.employmentStatus.update({
        where: { id: existingByCode.id },
        data: { name: status.name, description: status.description, isActive: true },
      });
      continue;
    }
    const existingByName = await prisma.employmentStatus.findUnique({ where: { name: status.name } });
    if (existingByName) {
      await prisma.employmentStatus.update({
        where: { id: existingByName.id },
        data: { code: status.code, description: status.description, isActive: true },
      });
      continue;
    }
    await prisma.employmentStatus.create({ data: status });
  }

  // Soft-disable any remaining legacy employment status codes that duplicated employee types
  for (const legacyCode of ["full_time", "part_time", "contract", "intern", "consultant"]) {
    await prisma.employmentStatus.updateMany({
      where: { code: legacyCode, deletedAt: null },
      data: { isActive: false },
    });
  }
  
  console.log("✅ Employment statuses created");

  const hrDepartment = await prisma.department.upsert({
    where: { companyId_code: { companyId: company.id, code: "HR" } },
    update: { name: "Human Resources", isActive: true },
    create: {
      companyId: company.id,
      name: "Human Resources",
      code: "HR",
      description: "Human Resources department",
      isActive: true,
    },
  });

  console.log("✅ HR department created");
  
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

  await prisma.employee.upsert({
    where: { userId: superAdminUser.id },
    update: { employeeCode: superAdminUser.employeeId ?? "EMP001", lifecycleState: "ACTIVE" },
    create: {
      userId: superAdminUser.id,
      employeeCode: superAdminUser.employeeId ?? "EMP001",
      lifecycleState: "ACTIVE",
      hiredAt: new Date(),
    },
  });

  const hrUserEmail = "hr@workforce360.com";
  const activeEmploymentStatus = await prisma.employmentStatus.findUnique({
    where: { code: "active" },
  });
  const fullTimeType = await prisma.employeeType.findUnique({ where: { code: "FT" } });

  let hrUser = await prisma.user.findUnique({ where: { email: hrUserEmail } });
  if (!hrUser) {
    hrUser = await prisma.user.create({
      data: {
        email: hrUserEmail,
        passwordHash: await bcrypt.hash("Hr@123456", 12),
        firstName: "HR",
        lastName: "Manager",
        status: "active",
        employeeId: "EMP002",
        emailVerified: true,
        departmentId: hrDepartment.id,
        employeeTypeId: fullTimeType?.id,
        employmentStatusId: activeEmploymentStatus?.id,
        dateOfJoining: new Date(),
      },
    });
  } else {
    const nextEmployeeId =
      hrUser.employeeId ??
      (await prisma.user.findFirst({
        where: { employeeId: "EMP002" },
        select: { id: true },
      })
        ? undefined
        : "EMP002");

    hrUser = await prisma.user.update({
      where: { id: hrUser.id },
      data: {
        departmentId: hrDepartment.id,
        ...(nextEmployeeId ? { employeeId: nextEmployeeId } : {}),
        employeeTypeId: hrUser.employeeTypeId ?? fullTimeType?.id,
        employmentStatusId: hrUser.employmentStatusId ?? activeEmploymentStatus?.id,
      },
    });
  }
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: hrUser.id, roleId: hrRole.id } },
    update: {},
    create: { userId: hrUser.id, roleId: hrRole.id },
  });

  // Ensure Employee master record exists for HR user
  await prisma.employee.upsert({
    where: { userId: hrUser.id },
    update: { lifecycleState: "ACTIVE" },
    create: {
      userId: hrUser.id,
      employeeCode: hrUser.employeeId ?? "EMP002",
      lifecycleState: "ACTIVE",
      hiredAt: new Date(),
    },
  });

  await prisma.jobPosting.upsert({
    where: { slug: "senior-software-engineer" },
    update: { status: "PUBLISHED", publishedAt: new Date() },
    create: {
      title: "Senior Software Engineer",
      slug: "senior-software-engineer",
      description:
        "Build modular ERP features across our Next.js and Node.js stack. You will own recruitment and HR modules end-to-end.",
      requirements: "5+ years TypeScript, React, Node.js, PostgreSQL. Experience with RBAC and SaaS products.",
      location: "San Francisco, CA (Hybrid)",
      employmentType: "Full Time",
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });

  await prisma.jobPosting.upsert({
    where: { slug: "hr-coordinator" },
    update: { status: "PUBLISHED", publishedAt: new Date() },
    create: {
      title: "HR Coordinator",
      slug: "hr-coordinator",
      description:
        "Support recruitment pipeline operations, onboarding, and employee lifecycle tracking.",
      requirements: "2+ years HR operations. Familiarity with ATS and onboarding workflows.",
      location: "Remote",
      employmentType: "Full Time",
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });

  console.log(`📧 HR user: ${hrUserEmail} / Hr@123456`);
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
