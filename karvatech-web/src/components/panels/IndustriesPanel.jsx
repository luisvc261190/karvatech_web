import { useState } from 'react'
import {
  Truck,
  HardHat,
  GraduationCap,
  Mountain,
  Stethoscope,
  Briefcase,
  Landmark,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react'
import { useJourney } from '../../journey'

const INDUSTRIES = [
  {
    id: 'transporte',
    label: 'Transporte y logística',
    icon: Truck,
    reto: 'La operación logística pierde tiempo y dinero con hojas de ruta en papel, GPS aislado y comunicación por llamadas. La dependencia del Excel frena el crecimiento y pone en riesgo la calidad del servicio.',
    soluciones: [
      'Digitalizamos hojas de ruta y partes diarios con app móvil y firma digital.',
      'Centralizamos rutas, incidencias y entregas en un panel de control en tiempo real.',
      'Conectamos GPS y telefonía (VOIP) a tu operación para gestionar unidades al instante.',
      'Estructuramos información que ya posees y la convertimos en reportes gerenciales.',
    ],
    desarrollos: [
      'App de despacho y seguimiento de entregas para repartidores.',
      'CRM + WMS para tu almacén o flota.',
      'Panel de indicadores: entregas a tiempo, costos por ruta y utilización de flota.',
    ],
  },
  {
    id: 'construccion',
    label: 'Construcción',
    icon: HardHat,
    reto: 'La información de obra descansa en cabinas, WhatsApp y planillas sueltas. Sin trazabilidad ni indicadores, los sobrecostos y retrasos aparecen cuando ya no se pueden corregir.',
    soluciones: [
      'Registramos avance de obra, valorizaciones y documentos desde el celular en el campo.',
      'Damos trazabilidad a fotos, anexos y actas sin depender de hojas sueltas.',
      'Conectamos avances con una línea base para alertar a tiempo sobre desviaciones.',
      'Ordenamos la data para el área técnica, financiera y la gerencia.',
    ],
    desarrollos: [
      'App de reporte de avance de obra con registro de evidencias.',
      'Control de valorizaciones y certificaciones por proyecto.',
      'Dashboard de programación: S-curve, atrasos y proyecciones.',
    ],
  },
  {
    id: 'educacion',
    label: 'Educación',
    icon: GraduationCap,
    reto: 'Matrículas, pagos y comunicaciones siguen manuales. Los padres no ven el avance de sus hijos y el equipo administrativo pierde el día resolviendo trámites repetitivos.',
    soluciones: [
      'Automatizamos matrículas, pagos y comunicaciones con el apoderado.',
      'Damos a docentes un canal único para registrar notas, asistencia y avances.',
      'Publicamos avances a los padres desde un portal o app segura.',
      'Reducimos trámites administrativos para que el equipo se enfoque en los estudiantes.',
    ],
    desarrollos: [
      'Sistema de matrícula y control de pagos (CRM educativo).',
      'Portal de padres con notas, asistencia y comunicados.',
      'App móvil de colegio: boletines y mensajería interna.',
    ],
  },
  {
    id: 'mineria',
    label: 'Minería e industria',
    icon: Mountain,
    reto: 'La operación genera datos críticos en el campo que llegan tarde, mal escritos o perdidos. Los informes de cumplimiento y seguridad se arman a mano y las auditorías exigen registros íntegros.',
    soluciones: [
      'Capturamos datos en campo con formularios digitales que funcionan sin señal.',
      'Eliminamos doble digitación: el dato se registra una sola vez y viaja completo.',
      'Ordenamos los registros para cumplimiento, seguridad y auditoría.',
      'Diseñamos a medida: cada proceso del rubro tiene su propia regla de negocio.',
    ],
    desarrollos: [
      'Sistema de reportes de operación y mantenimiento (checklists digitales).',
      'Gestión de permisos de trabajo y cumplimiento normativo.',
      'Dashboards de indicadores operativos y de seguridad (AR, HRA).',
    ],
  },
  {
    id: 'salud',
    label: 'Salud y veterinaria',
    icon: Stethoscope,
    reto: 'Historias clínicas en papel, citas por WhatsApp y stocks de medicamentos sin control. El tiempo que se pierde organizando info es tiempo que no se dedica a los pacientes.',
    soluciones: [
      'Digitalizamos historias clínicas, citas y recetas en un solo lugar.',
      'Recuperamos el control del stock de medicamentos e insumos.',
      'Agilizamos la atención con recordatorios y ficha digital del paciente.',
      'Cuidamos la confidencialidad: accesos y respaldo seguro de la información.',
    ],
    desarrollos: [
      'Historia clínica electrónica personalizada.',
      'Agenda de citas con recordatorios por WhatsApp.',
      'Control de farmacia: inventario, vencimientos y compras.',
    ],
  },
  {
    id: 'servicios',
    label: 'Servicios y pymes',
    icon: Briefcase,
    reto: 'El negocio vive entre Excel, mensajes y cuadernos. El dueño no sabe cuánto gana por servicio ni quién está pendiente de facturar, y la escalabilidad depende de una sola persona.',
    soluciones: [
      'Centralizamos clientes, servicios y pagos en un sistema simple de usar.',
      'Recuperamos el control de la facturación y de lo que queda por cobrar.',
      'Automatizamos seguimiento y recordatorios para no perder ventas.',
      'Creamos paneles claros para que el dueño decida con datos, no con intuición.',
    ],
    desarrollos: [
      'CRM de clientes con presupuestos y facturación.',
      'App para coordinar servicios y técnicos en campo.',
      'Dashboard de ventas, cobros y rentabilidad por servicio.',
    ],
  },
  {
    id: 'gobierno',
    label: 'Gobierno',
    icon: Landmark,
    reto: 'Los trámites manuales alargan plazos, generan colas y facilitan los errores. La ciudadanía reclama atención más rápida y el equipo interno necesita control real sobre su trabajo diario.',
    soluciones: [
      'Llevamos ventanillas, expedientes y seguimientos a un sistema institucional.',
      'Reducimos plazos con flujos aprobados y trazabilidad de cada trámite.',
      'Publicamos estados e indicadores claros para la gestión y la rendición de cuentas.',
      'Cuidamos la seguridad y la normatividad de los datos públicos.',
    ],
    desarrollos: [
      'Gestor de trámites documentarios (mesa de partes digital).',
      'Ventanilla virtual y seguimiento ciudadano por web o app.',
      'Tableros de gestión con indicadores operativos institucionales.',
    ],
  },
]

export default function IndustriesPanel() {
  const { goTo } = useJourney()
  const [activeId, setActiveId] = useState(INDUSTRIES[0].id)
  const active = INDUSTRIES.find((i) => i.id === activeId)

  return (
    <section className="ix-panel ix-industries" id="industrias">
      <div className="ix-pad ix-industries-wrap">
        <header className="ix-industries-head">
          <p className="ix-eyebrow">
            <span aria-hidden="true" />
            INDUSTRIAS
          </p>
          <h2 className="ix-title">
            Soluciones para
            <span>tu industria.</span>
          </h2>
          <p className="ix-lede">
            Cada sector tiene su propia operación. Escoge el tuyo y mira qué
            sistema le construiría KARVATECH y cómo le ayudaría.
          </p>
        </header>

        <div className="ix-industries-grid">
          <nav className="ix-industries-nav" aria-label="Selecciona tu industria">
            {INDUSTRIES.map((ind) => {
              const Icon = ind.icon
              return (
                <button
                  key={ind.id}
                  type="button"
                  className={`ix-ind-btn${activeId === ind.id ? ' active' : ''}`}
                  onClick={() => setActiveId(ind.id)}
                >
                  <span className="ix-ind-icon">
                    <Icon size={18} strokeWidth={2.2} />
                  </span>
                  <span>{ind.label}</span>
                </button>
              )
            })}
          </nav>

          <article className="ix-ind-card" key={activeId}>
            <header className="ix-ind-head">
              <span className="ix-ind-chip">
                {(() => {
                  const Icon = active.icon
                  return <Icon size={18} strokeWidth={2.2} />
                })()}
                {active.label}
              </span>
            </header>

            <div className="ix-ind-block">
              <h4>
                <span>El reto</span> de tu sector
              </h4>
              <p>{active.reto}</p>
            </div>

            <div className="ix-ind-block">
              <h4>Cómo lo resolvemos</h4>
              <ul>
                {active.soluciones.map((s) => (
                  <li key={s}>
                    <CheckCircle2 size={16} />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="ix-ind-block">
              <h4>Qué desarrollaríamos para ti</h4>
              <ul className="ix-ind-dev">
                {active.desarrollos.map((d) => (
                  <li key={d}>
                    <span className="ix-ind-bullet">{active.id.slice(0, 1).toUpperCase()}</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button className="ix-text-link" onClick={() => goTo(7)}>
              <span>Agenda un diagnóstico para tu empresa</span>
              <ArrowUpRight size={17} />
            </button>
          </article>
        </div>
      </div>
    </section>
  )
}