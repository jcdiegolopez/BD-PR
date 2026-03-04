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
    primary: "bg-accent text-text-contrast hover:bg-accent-dark",
    secondary:
      "border border-text-secondary/20 bg-background-secondary text-text-primary hover:bg-background-primary",
    ghost: "bg-transparent text-accent hover:bg-background-secondary hover:text-accent-dark",
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
