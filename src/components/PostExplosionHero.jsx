import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { soundManager } from '../audio';

export default function PostExplosionHero({
  onReplay,
  soundOn = false,
  onToggleSound,
}) {
  // Active states
  const [activeCardIndex, setActiveCardIndex] = useState(2); // Card 03 (AI Solutions) default
  const [hoveredCardIndex, setHoveredCardIndex] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [showWorkModal, setShowWorkModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);

  // DOM Refs for GSAP Entry Sequence
  const containerRef = useRef(null);
  const navRef = useRef(null);
  const headlineIdeasRef = useRef(null);
  const headlineToRef = useRef(null);
  const headlineExpRef = useRef(null);
  const cardsContainerRef = useRef(null);
  const ctaBtnRef = useRef(null);
  const leftSideNavRef = useRef(null);
  const bottomBarRef = useRef(null);
  const progressFillRef = useRef(null);

  // Service data matching requirements
  const services = [
    {
      id: '01',
      title: 'UI/UX DESIGN',
      subtitle: 'Digital Product Experiences',
      desc: 'Crafting intuitive, emotion-driven digital interfaces and design systems engineered for conversion and brand distinction.',
      deliverables: ['Design Systems', 'Micro-interactions', 'User Research', 'Interactive Prototypes', 'Mobile & Web UI'],
      tech: ['Figma', 'Principle', 'Design Tokens', 'Accessibility WCAG AAA'],
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="service-card-icon">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <path d="M3 9h18M9 21V9" />
        </svg>
      ),
    },
    {
      id: '02',
      title: 'WEB & APP DEVELOPMENT',
      subtitle: 'High-Performance Full-Stack',
      desc: 'Building lightning-fast web and native applications with modern front-end architectures, WebGL, and scalable cloud systems.',
      deliverables: ['Headless Platforms', 'Jamstack Web Apps', 'Native iOS/Android', 'API Architecture', 'Edge Deployments'],
      tech: ['React', 'Next.js', 'TypeScript', 'Node.js', 'WebGL', 'Tailwind'],
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="service-card-icon">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
          <line x1="14" y1="4" x2="10" y2="20" />
        </svg>
      ),
    },
    {
      id: '03',
      title: 'AI SOLUTIONS',
      subtitle: 'Next-Gen Cognitive Engines',
      desc: 'Integrating state-of-the-art multimodal AI, autonomous agent workflows, and intelligent predictive algorithms into core products.',
      deliverables: ['Custom LLM Fine-Tuning', 'Agentic Automation', 'Predictive Analytics', 'Semantic Search', 'Computer Vision'],
      tech: ['Gemini API', 'PyTorch', 'Vector DBs', 'LangChain', 'OpenAI'],
      isFeatured: true,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="service-card-icon">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
    },
    {
      id: '04',
      title: '3D / AR / VR EXPERIENCES',
      subtitle: 'Spatial Computing & WebGL',
      desc: 'Pioneering immersive 3D digital worlds, interactive web experiences, and spatial computing interfaces that captivate audiences.',
      deliverables: ['Real-time 3D WebGL', 'Product Configurators', 'Vision Pro & Quest Apps', 'WebXR', 'Shader Artistry'],
      tech: ['Three.js', 'React Three Fiber', 'GLSL Shaders', 'WebXR', 'Blender'],
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="service-card-icon">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      ),
    },
    {
      id: '05',
      title: 'PRODUCT DESIGN',
      subtitle: 'End-to-End Venture Strategy',
      desc: 'From initial seed ideation to scaled market release, we engineer defensible products with high user retention and revenue growth.',
      deliverables: ['Product Market Fit Strategy', 'Roadmapping', 'GTM Execution', 'Unit Economics', 'Growth Loops'],
      tech: ['Product Ops', 'Analytics', 'A/B Testing', 'Growth Engineering'],
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="service-card-icon">
          <circle cx="12" cy="12" r="10" />
          <polygon points="12 8 8 12 12 16 16 12 12 8" />
        </svg>
      ),
    },
  ];

  // Featured Work Projects
  const portfolioProjects = [
    {
      title: 'AURA AI ENGINE',
      category: 'Autonomous Multi-Agent Platform',
      year: '2026',
      impact: '+420% workflow acceleration',
      desc: 'A decentralized multimodal AI architecture enabling real-time streaming reasoning across enterprise databases with zero latency.',
      tag: 'AI SOLUTIONS',
    },
    {
      title: 'CHRONOS SPATIAL OS',
      category: 'Spatial Computing WebXR Experience',
      year: '2026',
      impact: '1.2M+ active sessions',
      desc: 'An award-winning WebGL interactive 3D universe for luxury chronographs with real-time raytraced caustic reflections.',
      tag: '3D / AR / VR',
    },
    {
      title: 'VERVE HIGH-FREQUENCY FINTECH',
      category: 'Global Trading Terminal & Platform',
      year: '2025',
      impact: '$4.8B volume traded daily',
      desc: 'Institutional-grade dark mode trading dashboard with micro-second tick renders and interactive WebGL order books.',
      tag: 'UI/UX & WEB',
    },
  ];

  // =========================================================================
  // CINEMATIC ENTRY ANIMATION (GSAP Timeline)
  // =========================================================================
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Initial states
      gsap.set(navRef.current, { opacity: 0, y: -24 });
      gsap.set([headlineIdeasRef.current, headlineToRef.current, headlineExpRef.current], {
        opacity: 0,
        y: 80,
        rotateX: -25,
      });
      gsap.set('.service-card-item', { opacity: 0, y: 70, scale: 0.92 });
      gsap.set(leftSideNavRef.current, { opacity: 0, x: -25 });
      gsap.set(ctaBtnRef.current, { opacity: 0, scale: 0.85, y: 30 });
      gsap.set(bottomBarRef.current, { opacity: 0, y: 25 });

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // 1. Navigation fades in
      tl.to(navRef.current, { opacity: 1, y: 0, duration: 0.8 }, 0.2);

      // 2. Headline reveals via vertical staggered clipping mask
      tl.to(
        [headlineIdeasRef.current, headlineToRef.current, headlineExpRef.current],
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 1.2,
          stagger: 0.12,
          ease: 'power4.out',
        },
        0.4
      );

      // 3. Technical side interface slides into place
      tl.to(
        leftSideNavRef.current,
        {
          opacity: 1,
          x: 0,
          duration: 0.9,
        },
        0.7
      );

      // 4. Floating Service Cards rise from beneath the golden ribbons
      tl.to(
        '.service-card-item',
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1.1,
          stagger: 0.08,
          ease: 'back.out(1.2)',
        },
        0.8
      );

      // 5. Primary CTA emerges with golden glow
      tl.to(
        ctaBtnRef.current,
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.9,
          ease: 'back.out(1.4)',
        },
        1.1
      );

      // 6. Bottom Progress Bar & Indicator animates to 100%
      tl.to(bottomBarRef.current, { opacity: 1, y: 0, duration: 0.8 }, 1.0)
        .fromTo(
          progressFillRef.current,
          { width: '0%' },
          {
            width: '100%',
            duration: 1.6,
            ease: 'power2.inOut',
            onUpdate: function () {
              setProgressPercent(Math.round(this.progress() * 100));
            },
          },
          1.1
        );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Card Mouse Hover 3D Tilt calculation
  const handleCardMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    const rotX = -(y / (rect.height / 2)) * 12;
    const rotY = (x / (rect.width / 2)) * 12;

    gsap.to(card, {
      rotateX: rotX,
      rotateY: rotY,
      transformPerspective: 900,
      duration: 0.25,
      ease: 'power1.out',
      overwrite: 'auto',
    });
  };

  const handleCardMouseLeave = (e) => {
    const card = e.currentTarget;
    gsap.to(card, {
      rotateX: 0,
      rotateY: 0,
      duration: 0.6,
      ease: 'power2.out',
    });
  };

  return (
    <div
      className="post-explosion-landing"
      ref={containerRef}
      aria-label="Tesh Media — Post-Explosion Dynamic Landing Page"
    >
      {/* Fine Architectural Grid & Minimal Crosshairs */}
      <div className="post-exp-grid-overlay" aria-hidden="true" />
      <span className="post-crosshair post-crosshair-tl" aria-hidden="true">+</span>
      <span className="post-crosshair post-crosshair-tr" aria-hidden="true">+</span>
      <span className="post-crosshair post-crosshair-bl" aria-hidden="true">+</span>
      <span className="post-crosshair post-crosshair-br" aria-hidden="true">+</span>

      {/* ===================================================================
          1. TOP NAVIGATION
          =================================================================== */}
      <header className="post-exp-nav" ref={navRef}>
        <div className="post-brand-wrapper">
          <span className="post-brand-icon">✦</span>
          <span className="post-brand-name">TESH MEDIA</span>
          <span className="post-brand-pill">SYSTEM V2</span>
        </div>

        <nav className="post-nav-links" aria-label="Main Navigation">
          <button
            type="button"
            className="post-nav-link"
            onClick={() => {
              if (soundOn) soundManager.playHoverTick();
              setShowWorkModal(true);
            }}
          >
            [WORK]
          </button>
          <button
            type="button"
            className="post-nav-link"
            onClick={() => {
              if (soundOn) soundManager.playHoverTick();
              setSelectedService(services[2]); // Open featured AI service
            }}
          >
            [SERVICES]
          </button>
          <button
            type="button"
            className="post-nav-link"
            onClick={() => {
              if (soundOn) soundManager.playHoverTick();
              setShowContactModal(true);
            }}
          >
            [CONTACT]
          </button>
          <button
            type="button"
            className="post-nav-link post-replay-btn"
            onClick={() => {
              if (soundOn) soundManager.playToggleChime(false);
              onReplay?.();
            }}
            title="Replay from Intro and Golden Sphere"
            aria-label="Replay experience"
          >
            [↺ REPLAY]
          </button>
        </nav>
      </header>

      {/* ===================================================================
          2. TECHNICAL SIDE INTERFACES
          =================================================================== */}
      {/* Left Side: Numbered Service Navigation 01 - 05 */}
      <aside className="post-left-sidebar" ref={leftSideNavRef} aria-label="Service index">
        <div className="vertical-bracket-top" />
        <div className="vertical-numbers-list">
          {services.map((s, idx) => {
            const isActive = (hoveredCardIndex !== null ? hoveredCardIndex : activeCardIndex) === idx;
            return (
              <button
                key={s.id}
                type="button"
                className={`vertical-num-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setActiveCardIndex(idx);
                  setSelectedService(s);
                  if (soundOn) soundManager.playHoverTick();
                }}
                onMouseEnter={() => {
                  setHoveredCardIndex(idx);
                  if (soundOn) soundManager.playHoverTick();
                }}
                onMouseLeave={() => setHoveredCardIndex(null)}
                aria-label={`Jump to service ${s.title}`}
              >
                <span className="num-tick">{s.id}</span>
                <span className="num-indicator-bar" />
              </button>
            );
          })}
        </div>
        <div className="vertical-bracket-bottom" />
      </aside>

      {/* ===================================================================
          3. MAIN STAGE: HERO HEADLINE & FLOATING 3D SERVICE CARDS
          =================================================================== */}
      <main className="post-main-stage">
        {/* Main Hero Headline: IDEAS TO EXPERIENCES */}
        <section className="post-headline-container" aria-label="Main headline">
          <h1 className="post-hero-headline">
            <span className="headline-word-mask">
              <span className="headline-word" ref={headlineIdeasRef}>
                IDEAS
              </span>
            </span>
            <span className="headline-word-mask">
              <span className="headline-word headline-word-to" ref={headlineToRef}>
                TO
              </span>
            </span>
            <span className="headline-word-mask">
              <span className="headline-word headline-experiences" ref={headlineExpRef}>
                EXPERIENCES
              </span>
            </span>
          </h1>
        </section>

        {/* Floating 3D Service Cards */}
        <section className="post-cards-section" ref={cardsContainerRef} aria-label="Services showcase">
          <div className="cards-flex-track">
            {services.map((srv, idx) => {
              const isHovered = hoveredCardIndex === idx;
              const isCenter = idx === 2; // AI Solutions is prominent
              const isNeighborLeft = hoveredCardIndex !== null && idx === hoveredCardIndex - 1;
              const isNeighborRight = hoveredCardIndex !== null && idx === hoveredCardIndex + 1;

              return (
                <article
                  key={srv.id}
                  className={`service-card-item ${isCenter ? 'card-featured' : ''} ${isHovered ? 'hovered' : ''} ${
                    isNeighborLeft ? 'neighbor-left' : ''
                  } ${isNeighborRight ? 'neighbor-right' : ''}`}
                  onMouseMove={handleCardMouseMove}
                  onMouseLeave={(e) => {
                    handleCardMouseLeave(e);
                    setHoveredCardIndex(null);
                  }}
                  onMouseEnter={() => {
                    setHoveredCardIndex(idx);
                    setActiveCardIndex(idx);
                    if (soundOn) soundManager.playHoverTick();
                  }}
                  onClick={() => {
                    setSelectedService(srv);
                    if (soundOn) soundManager.playToggleChime(true);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedService(srv);
                    }
                  }}
                  aria-label={`${srv.title}: ${srv.subtitle}. Click to explore capabilities.`}
                >
                  <div className="card-glass-glow" aria-hidden="true" />
                  <div className="card-inner-content">
                    <div className="card-top-row">
                      <span className="card-id-badge">{srv.id}</span>
                      <div className="card-icon-container">{srv.icon}</div>
                      {srv.isFeatured && <span className="card-featured-pill">FEATURED</span>}
                    </div>

                    <div className="card-body">
                      <h3 className="card-title">{srv.title}</h3>
                      <p className="card-subtitle">{srv.subtitle}</p>
                      <p className="card-peek-desc">{srv.desc}</p>
                    </div>

                    <div className="card-bottom-row">
                      <span className="card-explore-hint">EXPLORE CAPABILITIES</span>
                      <span className="card-arrow-icon">→</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Primary Call To Action Button */}
        <section className="post-cta-section" ref={ctaBtnRef}>
          <button
            type="button"
            className="primary-cta-pill"
            onClick={() => {
              if (soundOn) soundManager.playToggleChime(true);
              setShowWorkModal(true);
            }}
            aria-label="Explore our work and featured projects"
          >
            <span className="cta-light-sweep" aria-hidden="true" />
            <span className="cta-bracket">[</span>
            <span className="cta-text">EXPLORE OUR WORK</span>
            <span className="cta-arrow">→</span>
            <span className="cta-bracket">]</span>
          </button>
        </section>
      </main>

      {/* ===================================================================
          4. BOTTOM PROGRESS INDICATOR & SOUND TOGGLE
          =================================================================== */}
      <footer className="post-bottom-bar" ref={bottomBarRef}>
        <div className="bottom-meta-col">
          <span className="bottom-prompt-text">ARE YOU READY TO BUILD WHAT'S NEXT?</span>
          <div className="bottom-progress-track">
            <div
              className="bottom-progress-fill"
              ref={progressFillRef}
              style={{ width: `${progressPercent}%` }}
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin="0"
              aria-valuemax="100"
            />
          </div>
        </div>

        <div className="bottom-right-col">
          <span className="progress-percent-label">{progressPercent}%</span>
          <button
            type="button"
            className="sound-mini-pill"
            onClick={onToggleSound}
            aria-label={`Sound is ${soundOn ? 'on' : 'off'}. Click to toggle.`}
          >
            <span className={`sound-mini-dot ${soundOn ? 'active' : ''}`} />
            <span>SOUND {soundOn ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </footer>

      {/* ===================================================================
          5. MODAL: DETAILED SERVICE INFORMATION PANEL
          =================================================================== */}
      {selectedService && (
        <div
          className="service-modal-overlay"
          onClick={() => setSelectedService(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-service-title"
        >
          <div
            className="service-modal-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="modal-header">
              <div className="modal-badge-group">
                <span className="modal-badge-id">{selectedService.id}</span>
                <span className="modal-badge-system">TESH // SERVICE ARCHITECTURE</span>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedService(null)}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </header>

            <div className="modal-main-content">
              <div className="modal-title-row">
                <div className="modal-icon-wrap">{selectedService.icon}</div>
                <div>
                  <h2 id="modal-service-title" className="modal-title">
                    {selectedService.title}
                  </h2>
                  <p className="modal-subtitle">{selectedService.subtitle}</p>
                </div>
              </div>

              <p className="modal-full-desc">{selectedService.desc}</p>

              <div className="modal-grid-details">
                <div className="modal-detail-col">
                  <h4 className="detail-col-title">KEY DELIVERABLES</h4>
                  <ul className="detail-list">
                    {selectedService.deliverables.map((item, idx) => (
                      <li key={idx} className="detail-list-item">
                        <span className="detail-item-bullet">✦</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="modal-detail-col">
                  <h4 className="detail-col-title">TECHNOLOGIES & FRAMEWORKS</h4>
                  <div className="tech-tags-cloud">
                    {selectedService.tech.map((t, idx) => (
                      <span key={idx} className="tech-pill-tag">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <footer className="modal-footer">
              <button
                type="button"
                className="modal-cta-btn"
                onClick={() => {
                  setSelectedService(null);
                  setShowContactModal(true);
                }}
              >
                <span>REQUEST PROJECT BRIEF</span>
                <span>→</span>
              </button>
              <button
                type="button"
                className="modal-secondary-btn"
                onClick={() => setSelectedService(null)}
              >
                BACK TO HERO
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* ===================================================================
          6. MODAL: FEATURED WORK SHOWCASE
          =================================================================== */}
      {showWorkModal && (
        <div
          className="service-modal-overlay"
          onClick={() => setShowWorkModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Featured Projects Showcase"
        >
          <div
            className="service-modal-panel work-modal-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="modal-header">
              <div className="modal-badge-group">
                <span className="modal-badge-id">WORK</span>
                <span className="modal-badge-system">TESH MEDIA // FEATURED PORTFOLIO</span>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowWorkModal(false)}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </header>

            <div className="modal-main-content">
              <h2 className="modal-title">FEATURED CASE STUDIES</h2>
              <p className="modal-subtitle">Proven impact across artificial intelligence, 3D WebGL, and scalable software.</p>

              <div className="work-cards-grid">
                {portfolioProjects.map((proj, idx) => (
                  <div key={idx} className="work-case-item">
                    <div className="work-case-header">
                      <span className="work-case-tag">{proj.tag}</span>
                      <span className="work-case-year">{proj.year}</span>
                    </div>
                    <h3 className="work-case-title">{proj.title}</h3>
                    <p className="work-case-cat">{proj.category}</p>
                    <p className="work-case-desc">{proj.desc}</p>
                    <div className="work-case-impact">
                      <span className="impact-label">MEASURED OUTCOME:</span>
                      <span className="impact-val">{proj.impact}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <footer className="modal-footer">
              <button
                type="button"
                className="modal-cta-btn"
                onClick={() => {
                  setShowWorkModal(false);
                  setShowContactModal(true);
                }}
              >
                <span>INITIATE PARTNERSHIP</span>
                <span>→</span>
              </button>
              <button
                type="button"
                className="modal-secondary-btn"
                onClick={() => setShowWorkModal(false)}
              >
                CLOSE SHOWCASE
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* ===================================================================
          7. MODAL: CONTACT INQUIRY DIALOG
          =================================================================== */}
      {showContactModal && (
        <div
          className="service-modal-overlay"
          onClick={() => setShowContactModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Contact Tesh Media"
        >
          <div
            className="service-modal-panel contact-modal-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="modal-header">
              <div className="modal-badge-group">
                <span className="modal-badge-id">CONNECT</span>
                <span className="modal-badge-system">INITIATE COLLABORATION</span>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowContactModal(false)}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </header>

            <form
              className="modal-main-content contact-form"
              onSubmit={(e) => {
                e.preventDefault();
                alert('Thank you for reaching out! A partner at Tesh Media will review your brief within 24 hours.');
                setShowContactModal(false);
              }}
            >
              <h2 className="modal-title">LET'S BUILD WHAT'S NEXT</h2>
              <p className="modal-subtitle">Tell us about your venture, timeline, and strategic objectives.</p>

              <div className="form-fields-group">
                <div className="form-field">
                  <label htmlFor="contact-name">YOUR NAME / ENTITY</label>
                  <input id="contact-name" type="text" required placeholder="Alex Mercer / Apex AI" />
                </div>
                <div className="form-field">
                  <label htmlFor="contact-email">DIRECT WORK EMAIL</label>
                  <input id="contact-email" type="email" required placeholder="alex@apex.ai" />
                </div>
                <div className="form-field">
                  <label htmlFor="contact-service">DESIRED CAPABILITY</label>
                  <select id="contact-service" defaultValue="AI Solutions">
                    <option value="AI Solutions">AI Solutions & Agentic Systems</option>
                    <option value="UI/UX Design">UI/UX Design & Spatial Systems</option>
                    <option value="Web & App">Web & App Engineering</option>
                    <option value="3D / AR / VR">3D / AR / VR Experiences</option>
                    <option value="Product Design">Full-Stack Product Design</option>
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="contact-msg">PROJECT VISION & TIMELINE</label>
                  <textarea id="contact-msg" rows="3" placeholder="Brief outline of your project requirements..." />
                </div>
              </div>

              <footer className="modal-footer">
                <button type="submit" className="modal-cta-btn">
                  <span>TRANSMIT BRIEF</span>
                  <span>→</span>
                </button>
                <button
                  type="button"
                  className="modal-secondary-btn"
                  onClick={() => setShowContactModal(false)}
                >
                  CANCEL
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
