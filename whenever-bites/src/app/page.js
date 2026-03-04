import Button from "@/components/ui/Button";

export default function Home() {
  return (
    <main className="mx-auto max-w-screen-xl space-y-32 px-6 py-16 md:py-24">

      {/* ── Hero: nombre gigante estilo editorial ── */}
      <section className="space-y-10">
        <h1 className="text-6xl font-semibold leading-none md:text-8xl lg:text-9xl">
          Whenever
          <br />
          <span className="text-accent">Bites</span><span className="text-accent-dark">.</span>
        </h1>
        <p className="max-w-xl text-xl leading-relaxed text-text-secondary md:text-2xl">
          La plataforma que conecta clientes, restaurantes y equipos de trabajo
          en una sola experiencia operativa.
        </p>
        <div className="flex flex-wrap gap-4">
          <Button href="/login" variant="secondary">
            Iniciar sesión
          </Button>
        </div>
      </section>

      <section>
        <div className="h-1 w-24 rounded-full bg-accent" />
      </section>

      {/* ── Statement de una línea ── */}
      <section>
        <p className="max-w-4xl text-3xl font-medium leading-snug md:text-4xl">
          Software de delivery pensado para <span className="text-accent">escalar operaciones gastronómicas</span>
          sin perder control, velocidad ni calidad de servicio.
        </p>
      </section>

      {/* ── Métricas / números como ancla visual ── */}
      <section className="grid gap-6 md:grid-cols-3">
        <div className="space-y-2 rounded-lg bg-background-accent p-8">
          <p className="text-5xl font-semibold text-text-contrast md:text-6xl">5</p>
          <p className="text-lg font-medium text-text-contrast">Roles diferenciados</p>
          <p className="text-sm text-text-contrast/80">
            Customer, worker, repartidor, owner y admin — cada uno con flujos
            y permisos propios.
          </p>
        </div>
        <div className="space-y-2 rounded-lg bg-background-accent-dark p-8">
          <p className="text-5xl font-semibold text-text-contrast md:text-6xl">27</p>
          <p className="text-lg font-medium text-text-contrast">Queries operativas</p>
          <p className="text-sm text-text-contrast/80">
            Consultas optimizadas con índices compuestos, multikey, texto
            y geoespaciales.
          </p>
        </div>
        <div className="space-y-2 rounded-lg bg-background-accent-light p-8">
          <p className="text-5xl font-semibold text-text-contrast md:text-6xl">4</p>
          <p className="text-lg font-medium text-text-contrast">Reportes analíticos</p>
          <p className="text-sm text-text-contrast/80">
            Aggregation pipelines para ventas, platillos top, tiempos
            y calificaciones.
          </p>
        </div>
      </section>

      {/* ── A quién está dirigido: lista numerada, no cards ── */}
      <section className="grid gap-16 md:grid-cols-2">
        <div className="space-y-4">
          <p className="text-sm font-medium text-accent">A quién está dirigido</p>
          <h2 className="text-3xl font-semibold leading-snug md:text-4xl">
            Experiencias separadas para cada perfil en la cadena operativa
          </h2>
        </div>
        <div className="space-y-10">
          <div className="space-y-2 border-l-4 border-accent pl-6">
            <p className="text-xs font-semibold text-accent">01</p>
            <h3 className="text-xl font-semibold">Clientes</h3>
            <p className="text-sm text-text-secondary">
              Búsqueda de restaurantes, exploración de menús, pedidos y seguimiento
              en tiempo real.
            </p>
          </div>
          <div className="space-y-2 border-l-4 border-accent-dark pl-6">
            <p className="text-xs font-semibold text-accent-dark">02</p>
            <h3 className="text-xl font-semibold">Restaurantes y empresas</h3>
            <p className="text-sm text-text-secondary">
              Gestión de catálogo, control de sucursales y operación diaria con
              foco en eficiencia.
            </p>
          </div>
          <div className="space-y-2 border-l-4 border-accent-light pl-6">
            <p className="text-xs font-semibold text-accent-light">03</p>
            <h3 className="text-xl font-semibold">Trabajadores y repartidores</h3>
            <p className="text-sm text-text-secondary">
              Flujos simples para cocina y reparto con estados de órdenes
              consistentes y trazables.
            </p>
          </div>
        </div>
      </section>

      {/* ── Restaurantes destacados: tabla limpia, no cards ── */}
  
      {/* ── Bloque full-width con fondo secondary ── */}
      <section className="rounded-lg bg-background-accent px-8 py-16 md:px-12 md:py-20">
        <div className="mx-auto max-w-3xl space-y-8 text-center">
          <h2 className="text-3xl font-semibold text-text-contrast md:text-4xl">
            Operación centralizada, escalable por roles, con datos para decisiones
          </h2>
          <p className="text-lg leading-relaxed text-text-contrast/80">
            Conecta pedidos, cocina, despacho y entrega en una sola plataforma.
            Estructura preparada para reportes de rendimiento por restaurante,
            sucursal y equipo.
          </p>
          <a
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-md border border-text-contrast px-6 text-sm font-medium text-text-contrast transition-colors duration-200 hover:bg-background-primary hover:text-accent"
          >
            Empezar ahora
          </a>
        </div>
      </section>

      {/* ── Capacidades: grid asimétrico 2 cols ── */}
      <section className="space-y-8">
        <h2 className="text-3xl font-semibold md:text-4xl">
          Capacidades del <span className="text-accent">sistema</span>
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3 rounded-lg border-l-4 border-accent bg-background-secondary p-8">
            <p className="text-sm font-semibold text-accent-dark">Catálogo</p>
            <p className="text-lg font-medium text-text-primary">
              CRUD de menú con insertMany y updateMany para gestionar productos
              en volumen.
            </p>
          </div>
          <div className="space-y-3 rounded-lg border-l-4 border-accent-dark p-8">
            <p className="text-sm font-semibold text-accent">Órdenes</p>
            <p className="text-lg font-medium">
              Creación, tracking y cambio de estado con historial embebido
              y flujos transaccionales.
            </p>
          </div>
          <div className="space-y-3 rounded-lg border-l-4 border-accent-light p-8">
            <p className="text-sm font-semibold text-accent">Búsqueda</p>
            <p className="text-lg font-medium">
              Índices de texto, geoespaciales y multikey para filtrar restaurantes
              y platillos al instante.
            </p>
          </div>
          <div className="space-y-3 rounded-lg border-l-4 border-accent bg-background-secondary p-8">
            <p className="text-sm font-semibold text-accent-dark">Reseñas</p>
            <p className="text-lg font-medium text-text-primary">
              Sistema de calificaciones con aggregation pipeline para promedio
              por restaurante.
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer mínimo ── */}
      <footer className="space-y-4 border-t-2 border-accent pt-12">
        <p className="text-2xl font-semibold">
          Whenever <span className="text-accent">Bites</span><span className="text-accent-dark">.</span>
        </p>
        <p className="text-sm text-text-secondary">
          Sistema de comidas — Proyecto de Base de Datos, 2026.
        </p>
      </footer>
    </main>
  );
}
