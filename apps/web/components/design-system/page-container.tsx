import { cn } from "@/lib/utils";
import { appCanvas, layout, motion } from "@/lib/design-system";

type PageContainerProps = React.ComponentProps<"div"> & {
  canvas?: boolean;
  animate?: boolean;
};

export function PageContainer({
  className,
  canvas = true,
  animate = true,
  children,
  ...props
}: PageContainerProps) {
  return (
    <div
      className={cn(
        layout.page,
        canvas && appCanvas,
        animate && motion.fadeIn,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
