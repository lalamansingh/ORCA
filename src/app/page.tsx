import Link from "next/link";
import { Waves, ArrowUpRight, ShieldCheck, Map, Satellite } from "lucide-react";
import "./landing.css";

export default function Home() {
  return <main className="orca-landing">
    <nav><Link href="/" className="landing-brand"><Waves /> ORCA</Link><Link href="/login">Sign in <ArrowUpRight size={16}/></Link></nav>
    <section className="landing-hero"><div><p className="landing-kicker">OCEAN INTELLIGENCE · EXPLAINABLE DECISIONS</p>
      <h1>Ask the Ocean.<br/><em>Understand the Risk.</em></h1>
      <p className="landing-intro">Marine EcOsystem Reasoning with Collaborative Agents</p>
      <p>Satellite, oceanographic, weather and geospatial context coordinated through specialized agents for safer marine decision support.</p>
      <div className="landing-actions"><Link href="/register">Explore ORCA <ArrowUpRight size={18}/></Link><Link href="/dashboard">Open command center</Link><Link href="/mobile" style={{ background: "rgba(2, 132, 199, 0.2)", borderColor: "#38bdf8", color: "#38bdf8" }}>📱 Launch Android App</Link></div>
      <p className="landing-note">A prototype for the ISRO disaster-management problem context. No agency endorsement or operational certification is implied.</p>
    </div><aside className="ocean-orbit" aria-label="ORCA connects environmental evidence and deterministic risk assessment"><div className="orbit-ring"/><div className="orbit-center"><Waves size={42}/><strong>ORCA</strong><span>Question → Evidence → Decision support</span></div><span className="orbit-label orbit-one">Ocean conditions</span><span className="orbit-label orbit-two">Geospatial context</span><span className="orbit-label orbit-three">Deterministic risk</span></aside></section>
    <section className="landing-capabilities">{[{icon:<Satellite/>,title:"Understand the environment",text:"Explore forecasts, PFZ advisories and clearly labelled ocean-product context."},{icon:<ShieldCheck/>,title:"Keep safety explainable",text:"Risk rules and maritime constraints stay deterministic. Missing data stays visible."},{icon:<Map/>,title:"See the evidence",text:"Connect marine questions to locations, sources, timestamps and geospatial layers."}].map(item=><article key={item.title}>{item.icon}<h2>{item.title}</h2><p>{item.text}</p></article>)}</section>
    <footer><strong>ORCA Prototype · 0.1.0-hackathon</strong><p>ORCA is a decision-support prototype using available environmental and geospatial data. It is not a certified navigation system or official maritime clearance.</p><p>Data sources include Open-Meteo, IMD CAP and INCOIS PFZ where available. Ocean-product fixtures and route demonstrations are labelled DEMO DATA.</p></footer>
  </main>;
}
