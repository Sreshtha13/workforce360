"use client";

import { Suspense } from "react";
import LoginForm from "./login-form";
import { AuthLayout } from "@/components/design-system/auth-layout";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout title="Welcome to Workforce 360" subtitle="Loading sign-in...">
          <p className="text-sm text-muted-foreground">Please wait...</p>
        </AuthLayout>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
