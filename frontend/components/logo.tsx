import Link from "next/link";

interface LogoProps {
  href?: string;
  className?: string;
}

export function Logo({ href = "/", className = "" }: LogoProps) {
  const logoContent = (
    <span className={`text-2xl font-bold ${className}`}>
      PER<span className="text-primary">MEM</span>
    </span>
  );

  if (href) {
    return <Link href={href}>{logoContent}</Link>;
  }

  return logoContent;
}
