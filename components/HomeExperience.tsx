'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowDownRight, ArrowRight, ArrowUpRight, Crosshair, Globe2, Layers3, Menu, Radar, X } from 'lucide-react';
import type { LayerId, SceneId } from '@/lib/districts';

const GlobeCanvas = dynamic(() => import('@/components/GlobeCanvas'), { ssr: false });

export default function HomeExperience() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [target, setTarget] = useState<SceneId>('orbit');
  const [layers, setLayers] = useState<LayerId[]>([]);
  const [futureMode, setFutureMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [entering, setEntering] = useState(false);
  const [sceneLabel, setSceneLabel] = useState('ORBITAL VIEW');

  useEffect(() => {
    if (!rootRef.current) return;
    let cleanup = () => {};
    (async () => {
      const gsap = (await import('gsap')).default;
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      gsap.registerPlugin(ScrollTrigger);
      if (!rootRef.current) return;
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const triggers = [
        ScrollTrigger.create({ trigger: '#descent', start: 'top 60%', onEnter: () => { setTarget('downtown'); setSceneLabel('DOWNTOWN DUBAI'); }, onLeaveBack: () => { setTarget('orbit'); setSceneLabel('ORBITAL VIEW'); } }),
        ScrollTrigger.create({ trigger: '#observe', start: 'top 55%', onEnter: () => { setTarget('business-bay'); setLayers([]); setFutureMode(false); setSceneLabel('OBSERVE / BUSINESS BAY'); }, onLeaveBack: () => { setTarget('downtown'); setSceneLabel('DOWNTOWN DUBAI'); } }),
        ScrollTrigger.create({ trigger: '#understand', start: 'top 55%', onEnter: () => { setTarget('al-quoz'); setLayers(['heat', 'vegetation']); setFutureMode(false); setSceneLabel('UNDERSTAND / AL QUOZ'); }, onLeaveBack: () => { setTarget('business-bay'); setLayers([]); setSceneLabel('OBSERVE / BUSINESS BAY'); } }),
        ScrollTrigger.create({ trigger: '#engineer', start: 'top 55%', onEnter: () => { setTarget('expo-city'); setLayers(['solar', 'growth']); setFutureMode(true); setSceneLabel('ENGINEER / EXPO CITY'); }, onLeaveBack: () => { setTarget('al-quoz'); setLayers(['heat', 'vegetation']); setFutureMode(false); setSceneLabel('UNDERSTAND / AL QUOZ'); } }),
      ];
      const tweens = reduced ? [] : gsap.utils.toArray<HTMLElement>('.story-reveal').map((element) => gsap.fromTo(element, { opacity: .22, y: 55 }, { opacity: 1, y: 0, ease: 'none', scrollTrigger: { trigger: element, start: 'top 88%', end: 'top 44%', scrub: 1 } }));
      cleanup = () => { triggers.forEach((item) => item.kill()); tweens.forEach((item) => item.kill()); };
    })();
    return () => cleanup();
  }, []);

  function enterTwin() {
    if (entering) return;
    setEntering(true);
    setTarget('downtown');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.setTimeout(() => router.push('/mission-control'), reduced ? 0 : 1150);
  }

  return <div ref={rootRef} className="site-home">
    <div className="home-globe" aria-hidden={false}><GlobeCanvas target={target} layers={layers} futureMode={futureMode} mode="story" /></div>
    <div className="home-vignette" aria-hidden="true" />
    <div className="global-grid" aria-hidden="true" />
    <header className="site-nav">
      <Link href="/" className="wordmark" aria-label="SpaceSustain home"><span className="logo-glyph">✳</span><span>SPACE<span>SUSTAIN</span></span></Link>
      <nav className={menuOpen ? 'nav-links nav-open' : 'nav-links'} aria-label="Main navigation">
        <a href="#mission" onClick={() => setMenuOpen(false)}>THE MISSION</a>
        <a href="#technology" onClick={() => setMenuOpen(false)}>TECHNOLOGY</a>
        <Link href="/mission-control">MISSION CONTROL</Link>
      </nav>
      <button className="nav-launch" onClick={enterTwin}><span>ENTER THE TWIN</span><ArrowUpRight size={15} /></button>
      <button className="nav-menu" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>
    </header>

    <main>
      <section className="orbital-hero" id="top">
        <div className="hero-topline"><span><i className="live-indicator" /> MISSION 01 / DUBAI</span><span>GEOSPATIAL INTELLIGENCE PLATFORM</span></div>
        <motion.div className="hero-editorial" initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}>
          <div className="micro-label"><span className="micro-rule" /> A DIFFERENT VIEW OF WHAT COMES NEXT</div>
          <p className="hero-title-name">SPACE <span>SUSTAIN</span></p>
          <h1>THE FUTURE OF CITIES,<br /><em>BEFORE THEY&apos;RE BUILT.</em></h1>
          <p className="hero-deck">See Dubai as a living system. Explore real geography, test transparent interventions, and bring the next version of the city into view.</p>
          <div className="hero-buttons"><button className="primary-action" onClick={enterTwin}>{entering ? 'DESCENDING TO DUBAI…' : 'ENTER DUBAI TWIN'}<ArrowUpRight size={17} /></button><a href="#mission" className="secondary-action">EXPLORE THE MISSION<ArrowRight size={16} /></a></div>
        </motion.div>
        <div className="hero-coordinates"><span>25°11′32″ N</span><span>55°16′53″ E</span><span className="coord-line" /><span>{sceneLabel}</span></div>
        <a className="hero-scroll" href="#descent"><span>SCROLL TO DESCEND</span><ArrowDownRight size={19} /></a>
        <div className="hero-index">001 / 006</div>
      </section>

      <section className="descent-section story-section" id="descent">
        <div className="section-eyebrow story-reveal"><span>01 / DESCEND</span><span>CAMERA FLIGHT — DOWNTOWN DUBAI</span></div>
        <div className="descent-content story-reveal"><span className="massive-outline">DUBAI</span><h2>From orbit<br />to <em>possibility.</em></h2><p>Our camera descends to an oblique view of Downtown Dubai. The geography is real; the planning layers that follow are deliberately labeled as concepts.</p><Link href="/mission-control" className="text-link">EXPLORE THE CITY <ArrowUpRight size={16} /></Link></div>
        <div className="section-corner">25.1922° N / 55.2814° E<br />WGS84 / EPSG:4326</div>
      </section>

      <div id="mission" className="narrative-wrap">
        <section className="narrative-panel story-section" id="observe"><div className="narrative-number">02 / 04</div><div className="narrative-copy story-reveal"><div className="section-kicker"><Crosshair size={15} /> THE CITY AS IT IS</div><h2>OBSERVE<span className="punctuation">.</span></h2><p>Navigate mapped districts, real street geography, and OpenStreetMap building footprints. When a Cesium ion token is available, global 3D Buildings can join the scene.</p><div className="narrative-foot"><span>REAL COORDINATES</span><span>OSM BUILDING GEOMETRY</span></div></div></section>
        <section className="narrative-panel story-section" id="understand"><div className="narrative-number">03 / 04</div><div className="narrative-copy story-reveal"><div className="section-kicker"><Radar size={15} /> REVEAL THE UNSEEN</div><h2>UNDERSTAND<span className="punctuation">.</span></h2><p>Switch on illustrative heat and vegetation lenses. See how a spatial interface can direct questions before a planning team commissions detailed measurement.</p><div className="narrative-foot"><span>ILLUSTRATIVE OVERLAYS</span><span>NO OBSERVED IMPACT CLAIMS</span></div></div></section>
        <section className="narrative-panel story-section" id="engineer"><div className="narrative-number">04 / 04</div><div className="narrative-copy story-reveal"><div className="section-kicker"><Layers3 size={15} /> DESIGN THE NEXT STATE</div><h2>ENGINEER<span className="punctuation">.</span></h2><p>Move between baseline and proposed views. Place a visual solar intervention, cool selected roofs, and sketch vegetation and infrastructure ideas without pretending they are measured outcomes.</p><div className="narrative-foot"><span>SCENARIO VISUALIZATION</span><span>TRANSPARENT ASSUMPTIONS</span></div></div></section>
      </div>

      <section className="technology-section story-section" id="technology"><div className="tech-inner"><div className="section-eyebrow story-reveal"><span>05 / THE SYSTEM</span><span>AN INTELLIGENCE PLATFORM IN THE MAKING</span></div><div className="tech-header story-reveal"><span className="section-kicker">THE TECHNOLOGY</span><h2>SEE FARTHER.<br /><em>DECIDE BETTER.</em></h2><p>A coherent geospatial foundation for planners, designers, and operators. Every control in this prototype changes the actual 3D scene.</p></div><div className="capability-grid"><article className="capability story-reveal"><Globe2 size={26} /><span>01 / GEOGRAPHY</span><h3>Earth-scale context</h3><p>CesiumJS, real Dubai coordinates, OpenStreetMap imagery, and optional global 3D Buildings tiles.</p></article><article className="capability story-reveal"><Crosshair size={26} /><span>02 / ANALYSIS</span><h3>Roof intelligence</h3><p>Select a mapped footprint and adjust transparent solar assumptions to explore a concept estimate.</p></article><article className="capability story-reveal"><Layers3 size={26} /><span>03 / DESIGN</span><h3>Future mode</h3><p>Separate baseline geometry from proposed visual interventions with an explicit legend.</p></article></div></div></section>

      <section className="final-section story-section"><div className="final-halo" aria-hidden="true" /><div className="final-content story-reveal"><span className="section-kicker">THE NEXT MISSION STARTS HERE</span><h2>THE CITY IS<br /><em>NOT FINISHED.</em></h2><p>Open the Dubai twin. Choose a district. Change the view. Ask a better question about what comes next.</p><button className="primary-action" onClick={enterTwin}>ENTER MISSION CONTROL <ArrowUpRight size={17} /></button></div><div className="final-telemetry">SPACE SUSTAIN / DUBAI TWIN / 2026</div></section>
    </main>
    <footer className="site-footer"><Link href="/" className="wordmark"><span className="logo-glyph">✳</span><span>SPACE<span>SUSTAIN</span></span></Link><p>Real geography. Illustrative planning layers.<br />© OpenStreetMap contributors · ODbL 1.0</p><div><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">DATA ATTRIBUTION <ArrowUpRight size={13} /></a><a href="https://github.com/tejaswi-raghav/space-sustain" target="_blank" rel="noreferrer">SOURCE CODE <ArrowUpRight size={13} /></a></div></footer>
  </div>;
}
