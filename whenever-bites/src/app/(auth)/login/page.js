import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "Iniciar sesión — Whenever Bites",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-semibold md:text-5xl">
            Whenever<span className="text-accent">Bites</span>
            <span className="text-accent-dark">.</span>
          </h1>
          <p className="text-text-secondary">
            Inicia sesión para continuar
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-lg bg-background-secondary p-8">
          <LoginForm />
        </div>

        <p className="text-center text-sm text-text-secondary">
          ¿No tienes cuenta?{" "}
          <a
            href="/"
            className="font-medium text-accent transition-colors duration-200 hover:text-accent-dark"
          >
            Volver al inicio
          </a>
        </p>
      </div>
    </main>
  );
}
