export type UserFormValues = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  employeeId: string;
  status: string;
  departmentId: string;
  designationId: string;
  officeId: string;
  employeeTypeId: string;
  employmentStatusId: string;
};

export function validateUserForm(
  form: UserFormValues,
  options: { isEdit: boolean },
): Record<string, string> {
  const errors: Record<string, string> = {};

  const email = form.email.trim();
  if (!email) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Invalid email address";
  }

  if (!form.firstName.trim()) {
    errors.firstName = "First name is required";
  }

  if (!form.lastName.trim()) {
    errors.lastName = "Last name is required";
  }

  if (!options.isEdit) {
    if (!form.password) {
      errors.password = "Password is required";
    } else if (form.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    if (!form.employeeId.trim()) {
      errors.employeeId = "Employee ID is required";
    }
  } else if (form.password && form.password.length < 8) {
    errors.password = "Password must be at least 8 characters";
  }

  return errors;
}
