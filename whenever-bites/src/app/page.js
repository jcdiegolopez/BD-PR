import Button from "@/components/ui/Button";

export default function Home() {
  return (
    <main className="mx-auto max-w-7xl space-y-24 px-6 py-16 md:py-32">
      {/* ── Hero: nombre gigante + descripción ── */}
      <section className="space-y-8">
        <h1 className="text-7xl font-bold leading-tight md:text-8xl lg:text-9xl">
          Whenever
          <br />
          <span className="text-accent">Bites</span><span className="text-accent">.</span>
        </h1>
        <p className="max-w-2xl text-xl leading-relaxed text-text-secondary md:text-2xl">
          La plataforma que conecta clientes, restaurantes y equipos de trabajo
          en una sola experiencia operativa.
        </p>
        <div className="flex flex-wrap gap-4">
          <Button href="/login" variant="primary">
            Iniciar sesión
          </Button>
          <a
            href="#features"
            className="inline-flex h-12 items-center justify-center rounded-md border-2 border-accent px-6 text-sm font-semibold text-accent transition-all hover:bg-accent hover:text-text-contrast"
          >
            Conocer más
          </a>
        </div>
      </section>

      <section>
        <div className="h-1 w-32 rounded-full bg-accent" />
      </section>

      
      {/* ── Statement principal ── */}
      <section>
        <p className="max-w-4xl text-3xl font-semibold leading-snug md:text-4xl">
          Software de delivery pensado para <span className="text-accent">escalar operaciones gastronómicas</span>
          sin perder control, velocidad ni calidad de servicio.
        </p>
      </section>

      {/* ── Métricas / números ── */}
      <section id="features" className="grid gap-6 md:grid-cols-3">
        <div className="space-y-4 rounded-xl border-2 border-accent/30 bg-background-accent/5 p-8">
          <p className="text-6xl font-bold text-accent md:text-7xl">5</p>
          <p className="text-lg font-semibold text-text-primary">Roles diferenciados</p>
          <p className="text-sm leading-relaxed text-text-secondary">
            Customer, worker, repartidor, owner y admin — cada uno con flujos
            y permisos propios.
          </p>
        </div>
        <div className="space-y-4 rounded-xl border-2 border-accent/30 bg-background-accent/5 p-8">
          <p className="text-6xl font-bold text-accent md:text-7xl">27</p>
          <p className="text-lg font-semibold text-text-primary">Queries operativas</p>
          <p className="text-sm leading-relaxed text-text-secondary">
            Consultas optimizadas con índices compuestos, multikey, texto
            y geoespaciales.
          </p>
        </div>
        <div className="space-y-4 rounded-xl border-2 border-accent/30 bg-background-accent/5 p-8">
          <p className="text-6xl font-bold text-accent md:text-7xl">4</p>
          <p className="text-lg font-semibold text-text-primary">Reportes analíticos</p>
          <p className="text-sm leading-relaxed text-text-secondary">
            Aggregation pipelines para ventas, platillos top, tiempos
            y calificaciones.
          </p>
        </div>
      </section>

      {/* ── A quién está dirigido ── */}
      <section className="grid gap-16 md:grid-cols-2">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">A quién está dirigido</p>
          <h2 className="text-4xl font-bold leading-snug md:text-5xl">
            Experiencias separadas para cada perfil en la cadena operativa
          </h2>
        </div>
        <div className="space-y-8">
          <div className="space-y-3 rounded-xl border-l-4 border-accent bg-background-primary p-6">
            <p className="text-xs font-bold uppercase text-accent">01 • Clientes</p>
            <h3 className="text-2xl font-bold">Explora y ordena</h3>
            <p className="text-sm leading-relaxed text-text-secondary">
              Búsqueda de restaurantes, exploración de menús, pedidos y seguimiento
              en tiempo real.
            </p>
          </div>
          <div className="space-y-3 rounded-xl border-l-4 border-accent bg-background-primary p-6">
            <p className="text-xs font-bold uppercase text-accent">02 • Restaurantes</p>
            <h3 className="text-2xl font-bold">Gestiona operaciones</h3>
            <p className="text-sm leading-relaxed text-text-secondary">
              Gestión de catálogo, control de sucursales y operación diaria con
              foco en eficiencia.
            </p>
          </div>
          <div className="space-y-3 rounded-xl border-l-4 border-accent bg-background-primary p-6">
            <p className="text-xs font-bold uppercase text-accent">03 • Operaciones</p>
            <h3 className="text-2xl font-bold">Cocina y reparto</h3>
            <p className="text-sm leading-relaxed text-text-secondary">
              Flujos simples para cocina y reparto con estados de órdenes
              consistentes y trazables.
            </p>
          </div>
        </div>
      </section>

      {/* ── Bloque rojo con CTA ── */}
      <section className="rounded-2xl bg-background-accent px-8 py-16 md:px-12 md:py-20">
        <div className="mx-auto max-w-3xl space-y-8 text-center">
          <h2 className="text-4xl font-bold text-text-contrast md:text-5xl">
            Operación centralizada, escalable por roles
          </h2>
          <p className="text-lg leading-relaxed text-text-contrast/90">
            Conecta pedidos, cocina, despacho y entrega en una sola plataforma.
            Estructura preparada para reportes de rendimiento por restaurante,
            sucursal y equipo.
          </p>
          <a
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-text-contrast px-8 text-sm font-semibold text-accent transition-all hover:shadow-lg hover:scale-105"
          >
            Empezar ahora
          </a>
        </div>
      </section>

      {/* ── Capacidades del sistema ── */}
      <section className="space-y-8">
        <h2 className="text-4xl font-bold md:text-5xl">
          Capacidades del <span className="text-accent">sistema</span>
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3 rounded-xl border-2 border-accent/30 bg-background-secondary p-8 transition-all hover:border-accent">
            <p className="text-sm font-bold uppercase text-accent">Catálogo</p>
            <p className="text-lg font-semibold text-text-primary">
              CRUD de menú con insertMany y updateMany para gestionar productos
              en volumen.
            </p>
          </div>
          <div className="space-y-3 rounded-xl border-2 border-accent/30 bg-background-secondary p-8 transition-all hover:border-accent">
            <p className="text-sm font-bold uppercase text-accent">Órdenes</p>
            <p className="text-lg font-semibold text-text-primary">
              Creación, tracking y cambio de estado con historial embebido
              y flujos transaccionales.
            </p>
          </div>
          <div className="space-y-3 rounded-xl border-2 border-accent/30 bg-background-secondary p-8 transition-all hover:border-accent">
            <p className="text-sm font-bold uppercase text-accent">Búsqueda</p>
            <p className="text-lg font-semibold text-text-primary">
              Índices de texto, geoespaciales y multikey para filtrar restaurantes
              y platillos al instante.
            </p>
          </div>
          <div className="space-y-3 rounded-xl border-2 border-accent/30 bg-background-secondary p-8 transition-all hover:border-accent">
            <p className="text-sm font-bold uppercase text-accent">Reseñas</p>
            <p className="text-lg font-semibold text-text-primary">
              Sistema de calificaciones con aggregation pipeline para promedio
              por restaurante.
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t-2 border-accent pt-12 space-y-6">
        <div>
          <p className="text-3xl font-bold">
            Whenever <span className="text-accent">Bites</span>
          </p>
        </div>
        <p className="text-sm text-text-secondary">
          Sistema de comidas — Proyecto de Base de Datos, 2026.
        </p>
      </footer>
    </main>
  );
}

