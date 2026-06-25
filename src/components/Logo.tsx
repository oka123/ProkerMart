import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import LogoImage from "../../public/favicon/favicon.svg";

export interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  theme?: "light" | "dark" | "blue" | "white";
  href?: string;
  hideText?: boolean;
}

export function Logo({
  className,
  size = "md",
  theme = "light",
  href = "/",
  hideText = false,
}: LogoProps) {
  // Styles for the image icon size
  const iconSizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };

  const imageDimensions = {
    sm: 24,
    md: 32,
    lg: 40,
  };

  // Applies CSS filters to change image color based on theme

  // Styles for the "ProkerMart" text
  const textSizeClasses = {
    sm: "text-sm",
    md: "text-xl",
    lg: "text-xl",
  };

  const textThemeClasses = {
    light: "text-slate-900",
    dark: "text-white",
    blue: "text-primary-600",
    white: "text-white",
  };

  return (
    <Link
      href={href}
      className={cn(
        `flex items-center ${size === "lg" ? "gap-3" : "gap-2"}`,
        className,
      )}
    >
      <Image
        src={LogoImage}
        alt="Logo ProkerMart"
        width={imageDimensions[size]}
        height={imageDimensions[size]}
        className={cn("shrink-0", iconSizeClasses[size])}
      />
      {!hideText && (
        <span
          className={cn(
            "font-bold truncate",
            textSizeClasses[size],
            textThemeClasses[theme],
          )}
        >
          ProkerMart
        </span>
      )}
    </Link>
  );
}
