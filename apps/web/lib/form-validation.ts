import { ApiClientError } from "@/lib/api-client";

type ZodFlattened = {
  fieldErrors?: Record<string, string[]>;
  formErrors?: string[];
};

export function parseApiFieldErrors(details: unknown): Record<string, string> {
  if (!details || typeof details !== "object") return {};

  const flattened = details as ZodFlattened;
  const errors: Record<string, string> = {};

  for (const [field, messages] of Object.entries(flattened.fieldErrors ?? {})) {
    if (messages?.[0]) {
      errors[field] = messages[0];
    }
  }

  return errors;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiClientError) {
    return error.message || fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

export function scrollToFirstFieldError(errors: Record<string, string>): void {
  const firstField = Object.keys(errors)[0];
  if (!firstField) return;

  const element =
    document.getElementById(firstField) ??
    document.querySelector<HTMLElement>(`[name="${firstField}"]`);

  if (!element) return;

  element.scrollIntoView({ behavior: "smooth", block: "center" });
  if ("focus" in element && typeof element.focus === "function") {
    element.focus({ preventScroll: true });
  }
}
