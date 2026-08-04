import logoAsset from "@/assets/logo.png.asset.json";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  alt?: string;
}

/** Satyavadi AI brand mark — transparent PNG, aspect ratio preserved. */
const Logo = ({ className, alt = "Satyavadi AI logo" }: LogoProps) => (
  <img
    src={logoAsset.url}
    alt={alt}
    width={512}
    height={512}
    decoding="async"
    className={cn("w-auto object-contain select-none", className)}
    style={{ imageRendering: "auto" }}
  />
);

export default Logo;
