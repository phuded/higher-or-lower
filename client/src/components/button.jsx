import React from "react";
import {cva} from "class-variance-authority";
import {cn} from "../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400",
  {
    variants: {
      variant: {
        default: "bg-slate-950 text-white hover:bg-slate-800",
        secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        ghost: "hover:bg-slate-100"
      },
      size: {
        default: "h-10 px-4 py-2",
        icon: "size-9"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export function Button({className, variant, size, ...props}) {
  return <button className={cn(buttonVariants({variant, size}), className)} {...props} />;
}
