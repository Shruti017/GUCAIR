import Link from 'next/link';
import { ArrowRight, ArrowUpRight, BrainCircuit, Building2, ChartNoAxesCombined, Compass, ShieldCheck, Sparkles } from 'lucide-react';

const pillars = [
  { icon: BrainCircuit, title: 'Measure institutional readiness', text: 'Assess the capabilities, policies and resources that shape responsible AI adoption.' },
  { icon: ChartNoAxesCombined, title: 'Turn evidence into insight', text: 'Translate structured responses into weighted scores, dimension-level findings and priorities.' },
  { icon: Building2, title: 'Understand the landscape', text: 'Explore university profiles and compare published readiness results across institutions.' },
  { icon: ShieldCheck, title: 'Support responsible progress', text: 'Identify gaps in governance, people, infrastructure, teaching and research.' }
];

const dimensions = [
  'Infrastructure', 'AI education', 'Faculty capability', 'Student capability',
  'Research & innovation', 'Governance & ethics', 'Industry collaboration', 'Digital transformation'
];

export default function Home() {
  return (
    <main>
      <section className="hero">
        <div className="hero-glow" />
        <div className="hero-inner">
          <div className="hero-copy">
            <div className="eyebrow"><span /> A GLOBAL FRAMEWORK FOR HIGHER EDUCATION</div>
            <h1>Building the next generation of <em>AI-ready</em> universities.</h1>
            <p className="hero-lead">GUCAIR helps higher education institutions understand their AI readiness, identify capability gaps and plan responsible transformation with evidence.</p>
            <div className="hero-actions">
              <Link className="hero-primary" href="/universities">Explore universities <ArrowUpRight size={17} /></Link>
              <Link className="hero-secondary" href="/assessment">Discover the assessment <ArrowRight size={16} /></Link>
            </div>
            <div className="hero-proof">
              <span><Sparkles size={15}/> Structured assessment framework</span>
              <span><ShieldCheck size={15}/> Evidence-led insights</span>
            </div>
          </div>
          <div className="hero-visual" aria-label="Illustration of university AI readiness dimensions">
            <div className="orbit orbit-one" /><div className="orbit orbit-two" />
            <div className="visual-core"><span>G</span><small>AI READINESS</small></div>
            <div className="float-card float-top"><BrainCircuit size={17}/><span><b>8 dimensions</b><small>One connected framework</small></span></div>
            <div className="float-card float-bottom"><ChartNoAxesCombined size={17}/><span><b>Evidence to action</b><small>Measure · Compare · Improve</small></span></div>
            <div className="visual-dot dot-one" /><div className="visual-dot dot-two" /><div className="visual-dot dot-three" />
          </div>
        </div>
        <div className="hero-bottom"><span>GLOBAL UNIVERSITY CONSORTIUM FOR AI READINESS</span><span>ASSESS <b>·</b> UNDERSTAND <b>·</b> ADVANCE</span></div>
      </section>

      <section className="section-wrap">
        <div className="section-heading">
          <div className="eyebrow dark">THE GUCAIR APPROACH</div>
          <h2>AI readiness is an institutional journey.</h2>
          <p>It takes more than technology. It requires leadership, governance, skilled people, strong infrastructure and a culture of responsible innovation.</p>
        </div>
        <div className="pillar-grid">
          {pillars.map(({icon: Icon, title, text}, index) => (
            <article className="pillar-card" key={title}>
              <div className="pillar-icon"><Icon size={22}/></div>
              <span className="pillar-number">0{index + 1}</span>
              <h3>{title}</h3><p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="dimensions-section">
        <div className="dimensions-inner">
          <div className="dimensions-copy">
            <div className="eyebrow light">A HOLISTIC VIEW</div>
            <h2>Eight dimensions.<br/><em>One clearer picture.</em></h2>
            <p>The assessment framework looks across the institutional foundations needed to adopt AI meaningfully and responsibly.</p>
            <Link href="/assessment" className="dimension-link">Explore the framework <ArrowUpRight size={16}/></Link>
          </div>
          <div className="dimension-list">
            {dimensions.map((d, i) => <div className="dimension-item" key={d}><span>{String(i+1).padStart(2,'0')}</span>{d}<ArrowUpRight size={15}/></div>)}
          </div>
        </div>
      </section>

      <section className="closing-section">
        <div className="closing-card">
          <div><div className="eyebrow dark">START EXPLORING</div><h2>Move from AI ambition to institutional action.</h2><p>Explore the university landscape, review the assessment framework and discover where your institution can grow.</p></div>
          <Link className="hero-primary" href="/register">Join GUCAIR <ArrowUpRight size={17}/></Link>
        </div>
      </section>
    </main>
  );
}
