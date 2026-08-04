import logoSrc from "@/assets/logo.png";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  alt?: string;
}

/** Satyavadi AI brand mark — transparent PNG, aspect ratio preserved, retina-sharp. */
const Logo = ({ className, alt = "Satyavadi AI logo" }: LogoProps) => (
  <img
    src={logoSrc}
    alt={alt}
    decoding="async"
    className={cn("w-auto object-contain select-none", className)}
  />
);

export default Logo;
