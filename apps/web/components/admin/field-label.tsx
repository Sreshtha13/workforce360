import { cn } from "@/lib/utils";

function RequiredMark() {
  return (
    <span className="ml-0.5 text-destructive" aria-hidden>
      *
    </span>
  );
}

type FieldLabelProps = React.ComponentProps<"label"> & {
  required?: boolean;
};

export function FieldLabel({ className, required, children, ...props }: FieldLabelProps) {
  return (
    <label
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className,
      )}
      {...props}
    >
      {children}
      {required && <RequiredMark />}
    </label>
  );
}

export { RequiredMark };
