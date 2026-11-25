import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ButtonHTMLAttributes } from "react";
// shadcn/ui's local-source Button pattern, themed to the table rather than a component-library default.
const variants = cva("button", {
  variants: {
    variant: {
      default: "",
      primary: "primary",
      quiet: "quiet",
      danger: "danger",
    },
  },
  defaultVariants: { variant: "default" },
});
export function Button({
  className,
  variant = "default",
  asChild = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "quiet" | "danger";
  asChild?: boolean;
}) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={twMerge(clsx(variants({ variant }), className))}
      {...props}
    />
  );
}
