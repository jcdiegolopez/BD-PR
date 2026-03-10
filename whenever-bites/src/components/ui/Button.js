export default function Button({
  variant = "primary",
  className = "",
  href,
  children,
  ...props
}) {
  const baseClasses =
    "inline-flex h-12 items-center justify-center rounded-md px-6 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background-primary disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-accent text-text-contrast shadow-[0_12px_24px_-16px_rgba(214,43,66,0.85)] hover:bg-accent-dark",
    secondary:
      "border border-accent/15 bg-background-primary text-text-primary hover:border-accent/25 hover:bg-background-secondary",
    ghost: "bg-transparent text-accent hover:bg-accent/10 hover:text-accent-dark",
  };

  const variantClasses = variants[variant] || variants.primary;
  const classes = `${baseClasses} ${variantClasses} ${className}`.trim();

  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {children}
      </a>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
