import { FieldLabel } from "@/components/admin/field-label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { typographyScale } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const fieldErrorClass =
  "border-destructive ring-2 ring-destructive/20 focus-visible:border-destructive focus-visible:ring-destructive/30";

type FormFieldProps = {
  label: string;
  name: string;
  type?: "text" | "email" | "password" | "number" | "date";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  error?: string;
};

export function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  disabled,
  helperText,
  error,
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <FieldLabel htmlFor={name} required={required}>
        {label}
      </FieldLabel>
      <Input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : helperText ? `${name}-helper` : undefined}
        className={cn(error && fieldErrorClass)}
      />
      {helperText && !error && (
        <p id={`${name}-helper`} className={typographyScale.helper.className}>
          {helperText}
        </p>
      )}
      {error && (
        <p id={`${name}-error`} className={cn(typographyScale.helper.className, "text-destructive")}>
          {error}
        </p>
      )}
    </div>
  );
}

type FormSelectProps = {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  error?: string;
};

export function FormSelect({
  label,
  name,
  value,
  onChange,
  options,
  placeholder = "Select...",
  required,
  disabled,
  helperText,
  error,
}: FormSelectProps) {
  return (
    <div className="space-y-2">
      <FieldLabel htmlFor={name} required={required}>
        {label}
      </FieldLabel>
      <Select
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : helperText ? `${name}-helper` : undefined}
        className={cn(error && fieldErrorClass)}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
      {helperText && !error && (
        <p id={`${name}-helper`} className={typographyScale.helper.className}>
          {helperText}
        </p>
      )}
      {error && (
        <p id={`${name}-error`} className={cn(typographyScale.helper.className, "text-destructive")}>
          {error}
        </p>
      )}
    </div>
  );
}

type FormTextareaProps = {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  helperText?: string;
  error?: string;
  required?: boolean;
};

export function FormTextarea({
  label,
  name,
  value,
  onChange,
  placeholder,
  rows = 3,
  helperText,
  error,
  required,
}: FormTextareaProps) {
  return (
    <div className="space-y-2">
      <FieldLabel htmlFor={name} required={required}>
        {label}
      </FieldLabel>
      <Textarea
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        aria-invalid={!!error}
        className={cn(error && fieldErrorClass)}
      />
      {helperText && !error && (
        <p className={typographyScale.helper.className}>{helperText}</p>
      )}
      {error && (
        <p id={`${name}-error`} className={cn(typographyScale.helper.className, "text-destructive")}>
          {error}
        </p>
      )}
    </div>
  );
}
