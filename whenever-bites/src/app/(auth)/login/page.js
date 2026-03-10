import LoginForm from "@/components/auth/LoginForm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ROLE_HOME, getSessionUser } from "@/lib/permissions";

export const metadata = {
  title: "Iniciar sesión — Whenever Bites",
};

export default async function LoginPage() {
  const user = await getSessionUser();

  if (user) {
    redirect(ROLE_HOME[user.rol] || "/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background-accent px-4 py-8">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-semibold text-text-contrast md:text-5xl">
            Whenever<span className="text-background-primary">Bites</span>
            <span className="text-background-secondary">.</span>
          </h1>
          <p className="text-text-contrast/85">Inicia sesión para continuar</p>
        </div>

        <div className="rounded-lg bg-background-secondary p-8">
          <LoginForm />
        </div>

        <p className="text-center text-sm text-text-contrast/85">
          ¿No tienes cuenta?{" "}
          <Link
            href="/"
            className="font-medium text-background-primary transition-colors duration-200 hover:text-text-contrast"
          >
            Volver al inicio
          </Link>
        </p>
      </div>
    </main>
  );
}
