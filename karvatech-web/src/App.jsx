import Track from './components/Track'
import HeroPanel from './components/panels/HeroPanel'
import RoadmapPanel from './components/panels/RoadmapPanel'
import ListenPanel from './components/panels/ListenPanel'
import IndustriesPanel from './components/panels/IndustriesPanel'
import HowPanel from './components/panels/HowPanel'
import WorkPanel from './components/panels/WorkPanel'
import AboutPanel from './components/panels/AboutPanel'
import TalkPanel from './components/panels/TalkPanel'
import WhatsAppButton from './components/WhatsAppButton'

function App() {
  return (
    <>
      <Track>
        <HeroPanel />
        <RoadmapPanel />
        <ListenPanel />
        <IndustriesPanel />
        <HowPanel />
        <WorkPanel />
        <AboutPanel />
        <TalkPanel />
      </Track>
      <WhatsAppButton />
    </>
  )
}

export default App