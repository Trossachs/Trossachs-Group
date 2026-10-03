import React, {useEffect, useMemo, useRef, useState} from "react";
import {createRoot} from "react-dom/client";
import {ArrowUpRight, Menu, X, Sparkles, Layers3, Code2, Bot, Globe2, Mail, Moon, Sun, ChevronRight} from "lucide-react";
import "./styles.css";

type Project = {tag:string; title:string; text:string; accent:string; number:string;};

const projects:Project[] = [
 {tag:"AI COMPANION", title:"Mira", text:"A conversational AI companion experience built around voice, memory, visual presence and a natural interface.", accent:"mira", number:"01"},
 {tag:"AI SOCIAL DISCOVERY", title:"Humara", text:"A human-centered network for discovering capabilities, people, projects and meaningful collaboration.", accent:"humara", number:"02"},
 {tag:"HEALTHCARE", title:"Nnewi Hospital", text:"A sophisticated Nigerian healthcare platform with patient-facing information, appointments and an extensible admin direction.", accent:"hospital", number:"03"},
 {tag:"AGRICULTURE", title:"Umuojinkeyaeme Farms", text:"A modern digital portfolio for a Nigerian poultry business, bringing trust, production and brand story online.", accent:"farm", number:"04"},
 {tag:"BUSINESS", title:"SamIce", text:"A bold local-business experience for ice supply, product presentation and direct ordering.", accent:"ice", number:"05"}
];

const services = [
 ["01","Digital Products","Websites, platforms and polished interfaces designed around real users and real outcomes.",Globe2],
 ["02","AI Experiences","AI-powered products, conversational interfaces and intelligent workflows that feel useful, not gimmicky.",Bot],
 ["03","Web Development","Responsive, performant frontend systems with thoughtful interaction, structure and maintainability.",Code2],
 ["04","Product Direction","Turning rough ideas into clear product structures, visual systems and launch-ready experiences.",Layers3]
];

function App(){
 const [dark,setDark]=useState(true);
 const [open,setOpen]=useState(false);
 const [active,setActive]=useState<Project|null>(null);
 const [sent,setSent]=useState(false);
 const [mouse,setMouse]=useState({x:0,y:0});
 const heroRef=useRef<HTMLDivElement>(null);

 useEffect(()=>{
   const fn=(e:MouseEvent)=>setMouse({x:(e.clientX/window.innerWidth-.5)*2,y:(e.clientY/window.innerHeight-.5)*2});
   window.addEventListener("mousemove",fn);
   return()=>window.removeEventListener("mousemove",fn);
 },[]);

 useEffect(()=>{document.documentElement.dataset.theme=dark?"dark":"light"},[dark]);

 const scroll=(id:string)=>{document.getElementById(id)?.scrollIntoView({behavior:"smooth"});setOpen(false)};
 const year=new Date().getFullYear();

 return <div className="site">
  <header className="nav-wrap">
   <nav className="nav glass">
    <button className="brand" onClick={()=>scroll("home")} aria-label="Trossachs Group home">
      <span className="brand-mark"><span></span><span></span><span></span></span>
      <span>TROSSACHS <b>GROUP</b></span>
    </button>
    <div className={"nav-links "+(open?"show":"")}>
      {["about","services","work","process","contact"].map(x=><button key={x} onClick={()=>scroll(x)}>{x}</button>)}
      <button className="admin-link" onClick={()=>alert("Admin CMS is intentionally not exposed in the browser. Connect a real authenticated CMS before production.")}>Admin</button>
    </div>
    <div className="nav-actions">
      <button className="icon-btn" onClick={()=>setDark(!dark)} aria-label="Toggle theme">{dark?<Sun size={17}/>:<Moon size={17}/>}</button>
      <button className="menu-btn" onClick={()=>setOpen(!open)} aria-label="Menu">{open?<X/>:<Menu/>}</button>
    </div>
   </nav>
  </header>

  <main>
   <section id="home" className="hero" ref={heroRef}>
    <div className="hero-grid"></div>
    <div className="hero-copy">
      <div className="eyebrow"><span className="pulse"></span> INDEPENDENT DIGITAL STUDIO</div>
      <h1>We build <em>digital experiences</em> that move ideas forward.</h1>
      <p>Websites, AI experiences and digital products built with clarity, character and purpose.</p>
      <div className="hero-actions">
        <button className="primary" onClick={()=>scroll("work")}>Explore our work <ArrowUpRight size={17}/></button>
        <button className="secondary" onClick={()=>scroll("contact")}>Start a project <ChevronRight size={17}/></button>
      </div>
      <div className="hero-meta"><span>01</span><i></i><span>BUILD / CREATE / SHIP</span></div>
    </div>
    <div className="hero-art" style={{transform:`translate3d(${mouse.x*8}px,${mouse.y*6}px,0)`}}>
      <div className="orb-shell"><div className="orb-core"></div><div className="orb-ring ring-a"></div><div className="orb-ring ring-b"></div><div className="orb-ring ring-c"></div><div className="orb-dot dot-a"></div><div className="orb-dot dot-b"></div></div>
      <div className="art-caption"><span>TR / 01</span><span>IDEA → EXPERIENCE</span></div>
    </div>
   </section>

   <section id="about" className="section about">
    <div className="section-head"><span>02 — ABOUT</span><i></i><span>HOW WE THINK</span></div>
    <div className="about-grid">
      <h2>Technology should feel <em>human.</em></h2>
      <div><p className="lead">Trossachs Group is a digital studio focused on creating useful, memorable and beautifully considered experiences.</p><p>We combine product thinking, web development and emerging AI to turn ambitious ideas into things people can actually use.</p><button className="text-link" onClick={()=>scroll("contact")}>Tell us what you're building <ArrowUpRight size={16}/></button></div>
    </div>
    <div className="principles"><div><strong>01</strong><span>CLARITY</span><p>Remove the noise. Make the important thing obvious.</p></div><div><strong>02</strong><span>CHARACTER</span><p>Design should have a point of view, not just a template.</p></div><div><strong>03</strong><span>USEFULNESS</span><p>Every interaction should earn its place.</p></div></div>
   </section>

   <section id="services" className="section">
    <div className="section-head"><span>03 — SERVICES</span><i></i><span>WHAT WE BUILD</span></div>
    <div className="services">{services.map(([n,title,text,Icon])=><article className="service" key={n}><div className="service-top"><span>{n}</span><Icon size={22}/></div><h3>{title}</h3><p>{text}</p><span className="service-arrow"><ArrowUpRight size={18}/></span></article>)}</div>
   </section>

   <section id="work" className="section work">
    <div className="section-head"><span>04 — SELECTED WORK</span><i></i><span>PROJECTS</span></div>
    <div className="project-list">{projects.map(p=><button className={"project "+p.accent} key={p.title} onClick={()=>setActive(p)}><div className="project-visual"><div className="project-shape"></div><span>{p.number}</span></div><div className="project-info"><small>{p.tag}</small><h3>{p.title}</h3><p>{p.text}</p><span className="open-project">View project <ArrowUpRight size={16}/></span></div></button>)}</div>
   </section>

   <section id="process" className="section process">
    <div className="section-head"><span>05 — PROCESS</span><i></i><span>FROM IDEA TO LAUNCH</span></div>
    <div className="process-grid">{[["01","DISCOVER","We clarify the problem, audience and opportunity."],["02","DEFINE","We shape the product, structure and visual direction."],["03","BUILD","We turn the direction into a responsive, working experience."],["04","REFINE","We test, polish and prepare the work for the real world."]].map(x=><div className="step" key={x[0]}><span>{x[0]}</span><h3>{x[1]}</h3><p>{x[2]}</p></div>)}</div>
   </section>

   <section id="contact" className="section contact">
    <div className="contact-card">
      <div><div className="eyebrow"><Sparkles size={15}/> HAVE AN IDEA?</div><h2>Let's make something <em>worth remembering.</em></h2><p>Tell us what you're thinking. The first conversation is about understanding the idea, not selling you something.</p></div>
      <form onSubmit={e=>{e.preventDefault();setSent(true)}}>{sent?<div className="success"><strong>Message received.</strong><span>This demo form is connected to the interface only. Add your preferred email/API provider for live submissions.</span><button type="button" className="secondary" onClick={()=>setSent(false)}>Send another</button></div>:<><label>Name<input required placeholder="Your name"/></label><label>Email<input required type="email" placeholder="you@example.com"/></label><label>What are you building?<textarea required placeholder="A website, AI product, platform..."></textarea></label><button className="primary" type="submit">Send project brief <ArrowUpRight size={17}/></button></>}</form>
    </div>
   </section>
  </main>

  <footer><div className="footer-brand"><span className="brand-mark"><span></span><span></span><span></span></span><strong>TROSSACHS GROUP</strong><p>Digital experiences with purpose.</p></div><div className="footer-links"><button onClick={()=>scroll("work")}>Work</button><button onClick={()=>scroll("services")}>Services</button><button onClick={()=>scroll("contact")}>Contact</button></div><div className="footer-bottom"><span>© {year} Trossachs Group</span><span>BUILT WITH INTENT.</span></div></footer>

  {active&&<div className="modal-backdrop" onClick={()=>setActive(null)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setActive(null)}><X/></button><div className={"modal-art "+active.accent}><div className="project-shape"></div></div><small>{active.tag}</small><h2>{active.title}</h2><p>{active.text}</p><div className="modal-note">Project showcase — detailed case-study content can be connected through the future admin CMS.</div></div></div>}
 </div>
}
createRoot(document.getElementById("root")!).render(<App/>);
