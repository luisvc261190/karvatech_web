import { createContext, useContext } from 'react'

export const PANELS = [
  { id: 'inicio', num: '00', nav: 'Inicio', label: 'Portada' },
  { id: 'que-construimos', num: '01', nav: 'Qué construimos', label: 'Roadmap' },
  { id: 'escuchar', num: '02', nav: 'Tu socio técnico', label: 'El escuchar' },
  { id: 'industrias', num: '03', nav: 'Industrias', label: 'Industrias' },
  { id: 'como-trabajamos', num: '04', nav: 'Cómo trabajamos', label: 'Proceso' },
  { id: 'nuestro-trabajo', num: '05', nav: 'Nuestro trabajo', label: 'Clientes' },
  { id: 'nosotros', num: '06', nav: 'Nosotros', label: 'Equipo' },
  { id: 'hablemos', num: '07', nav: 'Hablemos', label: 'Contacto' },
]

export const TALK_INDEX = PANELS.findIndex((p) => p.id === 'hablemos')

const TrackContext = createContext(null)

export const useJourney = () => useContext(TrackContext)

export const TrackProvider = TrackContext.Provider