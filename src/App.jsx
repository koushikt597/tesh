import React, { useState, useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { soundManager } from './audio';
import GoldenSphereCanvas from './components/GoldenSphereCanvas';
import './App.css';

export default function App() {
  // Screen states: 'intro' | 'hero' | 'next-template'
  const [currentScreen, setCurrentScreen] = useState('intro');
  const [soundOn, setSoundOn] = useState(false);
  const [isAssemblingSphere, setIsAssemblingSphere] = useState(false);
  const [isSphereHovered, setIsSphereHovered] = useState(false);
  const [introProgressPercent, setIntroProgressPercent] = useState(0);

  // 3-Second Interactive Hold & Explosion States
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0); // 0.0 to 1.0
  const [countdownNumber, setCountdownNumber] = useState(null); // 3 | 2 | 1 | null
  const [isExploding, setIsExploding] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Intro Refs
  const appContainerRef = useRef(null);
  const introViewportRef = useRef(null);
  const immerseWordRef = useRef(null);
  const yourselfWordRef = useRef(null);
  const startBtnRef = useRef(null);
  const outerRingRef = useRef(null);
  const bracketTopRef = useRef(null);
  const bracketBottomRef = useRef(null);
  const arrowRef = useRef(null);
  const bottomDockRef = useRef(null);
  const cornerDotRef = useRef(null);
  const cornerTrRef = useRef(null);

  // Hero Refs
  const heroViewportRef = useRef(null);
  const heroHeadlineRef = useRef(null);
  const heroNavRef = useRef(null);
  const heroBrandRef = useRef(null);
  const heroBottomRef = useRef(null);
  const heroFloorLightRef = useRef(null);
  const progressFillRef = useRef(null);
  const flashOverlayRef = useRef(null);
  const nextTemplateRef = useRef(null);

  // Animation & Timer Tracking Refs
  const xQuickTo = useRef(null);
  const yQuickTo = useRef(null);
  const ringXQuickTo = useRef(null);
  const ringYQuickTo = useRef(null);
  const transitionTimelineRef = useRef(null);
  const isTransitioningRef = useRef(false);
  const holdStartTimestampRef = useRef(0);
  const holdAnimFrameRef = useRef(null);
  const isHoldingRef = useRef(false);
  const isExplodingRef = useRef(false);

  useEffect(() => {
    isHoldingRef.current = isHolding;
  }, [isHolding]);

  useEffect(() => {
    isExplodingRef.current = isExploding;
  }, [isExploding]);

  // 1. Initial Intro Screen Entrance Animation
  useEffect(() => {
    if (startBtnRef.current && outerRingRef.current) {
      xQuickTo.current = gsap.quickTo(startBtnRef.current, 'x', { duration: 0.35, ease: 'power2.out' });
      yQuickTo.current = gsap.quickTo(startBtnRef.current, 'y', { duration: 0.35, ease: 'power2.out' });
      ringXQuickTo.current = gsap.quickTo(outerRingRef.current, 'x', { duration: 0.5, ease: 'power2.out' });
      ringYQuickTo.current = gsap.quickTo(outerRingRef.current, 'y', { duration: 0.5, ease: 'power2.out' });
    }

    const ctx = gsap.context(() => {
      gsap.set([immerseWordRef.current, yourselfWordRef.current], {
        opacity: 0,
        y: 35,
        filter: 'blur(6px)',
      });
      gsap.set(startBtnRef.current, {
        opacity: 0,
        scale: 0.65,
      });
      gsap.set(outerRingRef.current, {
        opacity: 0,
        scale: 0.5,
      });
      gsap.set([bracketTopRef.current, bracketBottomRef.current], {
        opacity: 0,
        scale: 0.8,
      });
      gsap.set(arrowRef.current, {
        opacity: 0,
        x: -25,
      });
      gsap.set([bottomDockRef.current, cornerDotRef.current, cornerTrRef.current], {
        opacity: 0,
        y: 20,
      });

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.to([cornerDotRef.current, cornerTrRef.current], {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.1,
      })
      .to(
        [immerseWordRef.current, yourselfWordRef.current],
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 1.1,
          stagger: 0.08,
        },
        '-=0.5'
      )
      .to(
        startBtnRef.current,
        {
          opacity: 1,
          scale: 1,
          duration: 0.9,
          ease: 'back.out(1.5)',
        },
        '-=0.8'
      )
      .to(
        outerRingRef.current,
        {
          opacity: 1,
          scale: 1,
          duration: 0.8,
        },
        '-=0.7'
      )
      .to(
        [bracketTopRef.current, bracketBottomRef.current],
        {
          opacity: 0.65,
          scale: 1,
          duration: 0.7,
        },
        '-=0.6'
      )
      .to(
        arrowRef.current,
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
        },
        '-=0.6'
      )
      .to(
        bottomDockRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
        },
        '-=0.5'
      );
    }, introViewportRef);

    return () => ctx.revert();
  }, []);

  // Magnetic cursor tracking for Intro button
  const handleMouseMove = (e) => {
    if (!startBtnRef.current || currentScreen !== 'intro') return;
    const rect = startBtnRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = (e.clientX - centerX) * 0.28;
    const deltaY = (e.clientY - centerY) * 0.28;

    xQuickTo.current?.(deltaX);
    yQuickTo.current?.(deltaY);
    ringXQuickTo.current?.(deltaX * 0.6);
    ringYQuickTo.current?.(deltaY * 0.6);
  };

  const handleMouseEnter = () => {
    if (currentScreen !== 'intro') return;
    if (soundOn) {
      soundManager.playHoverTick();
    }
    gsap.to(startBtnRef.current, {
      scale: 1.06,
      duration: 0.35,
      ease: 'power2.out',
    });
    gsap.to(outerRingRef.current, {
      scale: 1.14,
      borderColor: 'rgba(130, 160, 205, 0.7)',
      duration: 0.4,
      ease: 'power2.out',
    });
    gsap.to(arrowRef.current, {
      x: 8,
      duration: 0.35,
      ease: 'power2.out',
    });
  };

  const handleMouseLeave = () => {
    if (currentScreen !== 'intro') return;
    xQuickTo.current?.(0);
    yQuickTo.current?.(0);
    ringXQuickTo.current?.(0);
    ringYQuickTo.current?.(0);

    gsap.to(startBtnRef.current, {
      scale: 1,
      duration: 0.5,
      ease: 'elastic.out(1, 0.5)',
    });
    gsap.to(outerRingRef.current, {
      scale: 1,
      borderColor: 'rgba(165, 185, 218, 0.45)',
      duration: 0.5,
      ease: 'power2.out',
    });
    gsap.to(arrowRef.current, {
      x: 0,
      duration: 0.4,
      ease: 'power2.out',
    });
  };

  // Toggle Sound State & Web Audio API
  const handleToggleSound = () => {
    if (soundOn) {
      soundManager.playToggleChime(false);
      soundManager.stopAmbience();
      setSoundOn(false);
    } else {
      soundManager.playToggleChime(true);
      soundManager.startAmbience();
      setSoundOn(true);
    }
  };

  // =========================================================================
  // CINEMATIC TRANSITION 1: INTRO -> 3D HERO SCREEN
  // =========================================================================
  const handleStartTransition = (e) => {
    e?.stopPropagation?.();
    if (isTransitioningRef.current || currentScreen !== 'intro') return;
    isTransitioningRef.current = true;

    if (soundOn) {
      soundManager.playStartSwell();
    }

    if (transitionTimelineRef.current) {
      transitionTimelineRef.current.kill();
    }

    const tl = gsap.timeline({
      defaults: { ease: 'power3.inOut' },
      onComplete: () => {
        setCurrentScreen('hero');
        isTransitioningRef.current = false;
      },
    });
    transitionTimelineRef.current = tl;

    // Phase 1: Button & intro elements separate
    tl.to(startBtnRef.current, {
      scale: 0.88,
      opacity: 0.4,
      duration: 0.4,
      ease: 'power2.in',
    })
    .to(outerRingRef.current, {
      scale: 0.92,
      opacity: 0,
      duration: 0.35,
    }, '<')
    .to([bracketTopRef.current, bracketBottomRef.current], {
      opacity: 0,
      duration: 0.3,
    }, '<')
    .to(immerseWordRef.current, {
      x: -160,
      opacity: 0,
      filter: 'blur(8px)',
      duration: 0.75,
    }, '<0.05')
    .to(yourselfWordRef.current, {
      x: 160,
      opacity: 0,
      filter: 'blur(8px)',
      duration: 0.75,
    }, '<')
    .to(arrowRef.current, {
      x: 180,
      opacity: 0,
      duration: 0.65,
    }, '<')
    .to(bottomDockRef.current, {
      y: 40,
      opacity: 0,
      duration: 0.45,
    }, '<0.1')
    .to(introViewportRef.current, {
      opacity: 0,
      duration: 0.85,
      ease: 'power2.inOut',
    }, '-=0.3');

    // Phase 2: Hero Entrance
    tl.add(() => {
      setCurrentScreen('hero');
      setIsAssemblingSphere(true);

      gsap.set(heroViewportRef.current, {
        opacity: 1,
        visibility: 'visible',
        pointerEvents: 'auto',
        zIndex: 30,
      });
      gsap.set(heroHeadlineRef.current, {
        opacity: 0,
        y: 45,
        scale: 0.94,
        filter: 'blur(10px)',
      });
      gsap.set([heroBrandRef.current, heroNavRef.current], {
        opacity: 0,
        y: -25,
      });
      gsap.set(heroBottomRef.current, {
        opacity: 0,
        y: 30,
      });
      gsap.set(heroFloorLightRef.current, {
        opacity: 0,
        scale: 0.6,
      });
    }, '-=0.2');

    tl.to(heroHeadlineRef.current, {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: 'blur(0px)',
      duration: 1.3,
      ease: 'power3.out',
    })
    .to([heroBrandRef.current, heroNavRef.current], {
      opacity: 1,
      y: 0,
      duration: 0.9,
      stagger: 0.1,
      ease: 'power2.out',
    }, '-=1.0')
    .to(heroFloorLightRef.current, {
      opacity: 1,
      scale: 1,
      duration: 1.4,
      ease: 'power2.out',
    }, '-=1.1')
    .to(heroBottomRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.85,
      ease: 'power2.out',
    }, '-=0.7')
    .fromTo(
      progressFillRef.current,
      { width: '0%' },
      {
        width: '100%',
        duration: 1.8,
        ease: 'power1.inOut',
        onUpdate: function () {
          setIntroProgressPercent(Math.round(this.progress() * 100));
        },
      },
      '-=1.4'
    );
  };

  // Return to Intro screen
  const handleReturnToIntro = () => {
    isTransitioningRef.current = false;
    setCurrentScreen('intro');
    setIsAssemblingSphere(false);
    setIsHolding(false);
    setHoldProgress(0);
    setCountdownNumber(null);
    setIsExploding(false);

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.to(heroViewportRef.current, {
      opacity: 0,
      duration: 0.5,
      onComplete: () => {
        gsap.set(heroViewportRef.current, {
          visibility: 'hidden',
          pointerEvents: 'none',
          zIndex: 5,
        });
      },
    })
    .to(introViewportRef.current, {
      opacity: 1,
      visibility: 'visible',
      pointerEvents: 'auto',
      zIndex: 25,
      duration: 0.6,
    }, '<0.1')
    .to([immerseWordRef.current, yourselfWordRef.current], {
      x: 0,
      opacity: 1,
      filter: 'blur(0px)',
      duration: 0.8,
    }, '-=0.2')
    .to(startBtnRef.current, {
      scale: 1,
      opacity: 1,
      x: 0,
      y: 0,
      duration: 0.8,
      ease: 'back.out(1.4)',
    }, '<')
    .to(outerRingRef.current, {
      scale: 1,
      opacity: 1,
      x: 0,
      y: 0,
      duration: 0.7,
    }, '<')
    .to([bracketTopRef.current, bracketBottomRef.current], {
      scale: 1,
      opacity: 0.65,
      duration: 0.6,
    }, '<')
    .to(arrowRef.current, {
      x: 0,
      opacity: 1,
      duration: 0.6,
    }, '<')
    .to(bottomDockRef.current, {
      y: 0,
      opacity: 1,
      duration: 0.6,
    }, '<');
  };

  // =========================================================================
  // FINAL 3D EXPLOSION SEQUENCE (At exactly 3 seconds)
  // =========================================================================
  const triggerExplosionSequence = useCallback(() => {
    if (holdAnimFrameRef.current) {
      cancelAnimationFrame(holdAnimFrameRef.current);
      holdAnimFrameRef.current = null;
    }

    setIsHolding(false);
    setIsExploding(true);
    setHoldProgress(1.0);

    if (soundOn) {
      soundManager.playExplosion();
    }

    // Brief Golden Screen Flash Overlay
    if (flashOverlayRef.current) {
      gsap.timeline()
        .to(flashOverlayRef.current, {
          opacity: 0.95,
          duration: 0.12,
          ease: 'power2.in',
        })
        .to(flashOverlayRef.current, {
          opacity: 0,
          duration: 0.9,
          ease: 'power2.out',
        }, '+=0.05');
    }

    // Disperse Hero Typography and UI
    gsap.to([heroHeadlineRef.current, heroFloorLightRef.current], {
      opacity: 0,
      y: -25,
      scale: 0.95,
      duration: 0.8,
      ease: 'power2.in',
    });

    gsap.to(heroBottomRef.current, {
      opacity: 0,
      y: 30,
      duration: 0.6,
      ease: 'power2.in',
    });
  }, [soundOn]);

  // =========================================================================
  // CORE INTERACTION: 3-SECOND PRESS & HOLD CONTROLLER (3000ms)
  // =========================================================================
  const startHold = useCallback((e) => {
    if (e) {
      if (e.button !== undefined && e.button !== 0) return; // Only primary mouse button
      e.preventDefault();
    }
    if (currentScreen !== 'hero' || isExplodingRef.current || isHoldingRef.current) return;

    setIsHolding(true);
    setIsResetting(false);
    setCountdownNumber(3);
    holdStartTimestampRef.current = performance.now();

    if (soundOn) {
      soundManager.startChargingRiser();
    }

    const durationMs = 3000;

    const tickHold = (currentTime) => {
      const elapsed = currentTime - holdStartTimestampRef.current;
      const progress = Math.min(elapsed / durationMs, 1.0);
      setHoldProgress(progress);

      // 3-Second Countdown Logic: 3 -> 2 -> 1
      if (elapsed < 1000) {
        setCountdownNumber(3);
      } else if (elapsed < 2000) {
        setCountdownNumber(2);
      } else {
        setCountdownNumber(1);
      }

      if (progress < 1.0) {
        holdAnimFrameRef.current = requestAnimationFrame(tickHold);
      } else {
        // EXACTLY 3 SECONDS (3000ms) REACHED -> TRIGGER EXPLOSION!
        triggerExplosionSequence();
      }
    };

    holdAnimFrameRef.current = requestAnimationFrame(tickHold);
  }, [currentScreen, soundOn, triggerExplosionSequence]);

  const cancelHold = useCallback(() => {
    if (!isHoldingRef.current || isExplodingRef.current) return;

    if (holdAnimFrameRef.current) {
      cancelAnimationFrame(holdAnimFrameRef.current);
      holdAnimFrameRef.current = null;
    }

    if (soundOn) {
      soundManager.stopChargingRiser();
    }

    setIsHolding(false);

    // Smooth reverse back to original sphere configuration
    const currentP = holdProgress;
    gsap.to({ val: currentP }, {
      val: 0,
      duration: 0.45,
      ease: 'power2.out',
      onUpdate: function () {
        setHoldProgress(this.targets()[0].val);
      },
      onComplete: () => {
        setHoldProgress(0);
        setCountdownNumber(null);
      },
    });
  }, [holdProgress, soundOn]);

  // Reusable Transition Controller as requested: startNextTemplateTransition()
  const startNextTemplateTransition = useCallback(() => {
    setCurrentScreen('next-template');

    // Reveal the clean placeholder container for the next template
    if (nextTemplateRef.current) {
      gsap.set(nextTemplateRef.current, {
        visibility: 'visible',
        opacity: 0,
        pointerEvents: 'auto',
      });

      gsap.to(nextTemplateRef.current, {
        opacity: 1,
        duration: 0.9,
        ease: 'power2.out',
      });

      gsap.fromTo(
        '.next-template-content > *',
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.1,
          duration: 0.8,
          ease: 'power3.out',
        }
      );
    }
  }, []);

  // Reset from Next Template back to 3D Hero Screen
  const handleResetFromNextTemplate = () => {
    setIsResetting(true);
    setIsExploding(false);
    setIsHolding(false);
    setHoldProgress(0);
    setCountdownNumber(null);
    setCurrentScreen('hero');

    gsap.to(nextTemplateRef.current, {
      opacity: 0,
      duration: 0.5,
      onComplete: () => {
        gsap.set(nextTemplateRef.current, {
          visibility: 'hidden',
          pointerEvents: 'none',
        });
      },
    });

    gsap.to([heroHeadlineRef.current, heroBottomRef.current, heroFloorLightRef.current], {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.9,
      delay: 0.2,
      ease: 'power3.out',
    });
  };

  // Keyboard accessibility: Press & hold Space or Enter
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (currentScreen !== 'hero' || isExplodingRef.current || e.repeat) return;
      if (e.code === 'Space' || e.code === 'Enter') {
        // Avoid intercepting if focus is on a link/button
        if (e.target.tagName === 'BUTTON' && e.target.classList.contains('hero-nav-link')) return;
        e.preventDefault();
        startHold();
      }
    };

    const handleKeyUp = (e) => {
      if (currentScreen !== 'hero' || isExplodingRef.current) return;
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        cancelHold();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [currentScreen, startHold, cancelHold]);

  return (
    <div
      className={`app-container ${currentScreen !== 'intro' ? 'hero-active' : ''}`}
      ref={appContainerRef}
    >
      {/* Golden Screen Flash Overlay on Explosion */}
      <div className="explosion-flash-overlay" ref={flashOverlayRef} aria-hidden="true" />

      {/* ===================================================================
          SCREEN 1: INTRO LANDING SCREEN ("IMMERSE YOURSELF")
          =================================================================== */}
      <section
        className={`landing-viewport ${currentScreen !== 'intro' ? 'fade-out' : ''}`}
        ref={introViewportRef}
        aria-label="Tesh Digitals Intro Screen"
      >
        <div className="ambient-glow" aria-hidden="true" />
        <div className="noise-overlay" aria-hidden="true" />

        <div className="corner-element-tl" ref={cornerDotRef} aria-hidden="true" />
        <div className="corner-element-tr" ref={cornerTrRef} aria-hidden="true">
          <span className="corner-crosshair">+</span>
          <span>TESH // 01</span>
        </div>

        <div className="main-stage">
          <div className="headline-composition">
            <h1 className="headline-word" ref={immerseWordRef}>
              IMMERSE
            </h1>

            <div
              className="start-btn-wrapper"
              onMouseMove={handleMouseMove}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onClick={handleStartTransition}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleStartTransition(e);
                }
              }}
            >
              <div className="bracket-indicator bracket-top" ref={bracketTopRef} aria-hidden="true">
                <span className="bracket-tick tick-left" />
                <span className="bracket-tick tick-right" />
              </div>

              <div className="start-btn-outer-ring" ref={outerRingRef} aria-hidden="true" />

              <button
                type="button"
                className="start-circle-btn"
                ref={startBtnRef}
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartTransition(e);
                }}
                aria-label="Start immersive experience and enter 3D hero"
              >
                <span className="start-btn-text">START</span>
              </button>

              <div className="bracket-indicator bracket-bottom" ref={bracketBottomRef} aria-hidden="true">
                <span className="bracket-tick tick-left" />
                <span className="bracket-tick tick-right" />
              </div>
            </div>

            <span className="headline-word" ref={yourselfWordRef}>
              YOURSELF
            </span>

            <div className="headline-arrow-wrapper" ref={arrowRef} aria-hidden="true">
              <svg
                className="headline-arrow"
                viewBox="0 0 76 42"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 21H69M69 21L50 4M69 21L50 38"
                  stroke="#000000"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        <footer className="bottom-dock" ref={bottomDockRef}>
          <button
            type="button"
            className="sound-toggle-btn"
            onClick={handleToggleSound}
            aria-label={`Sound is currently ${soundOn ? 'on' : 'off'}. Click to toggle.`}
            aria-pressed={soundOn}
          >
            <div className="sound-wave-icon" aria-hidden="true">
              <span className={`sound-bar ${soundOn ? 'active' : ''}`} />
              <span className={`sound-bar ${soundOn ? 'active' : ''}`} />
              <span className={`sound-bar ${soundOn ? 'active' : ''}`} />
              <span className={`sound-bar ${soundOn ? 'active' : ''}`} />
            </div>
            <span className="sound-toggle-label">
              SOUND: {soundOn ? 'ON' : 'OFF'}
            </span>
          </button>

          <div className="bottom-message">
            <p>TO MAKE THIS EXPERIENCE MORE</p>
            <p>IMMERSIVE WE USE SOUND EFFECTS</p>
          </div>
        </footer>
      </section>

      {/* ===================================================================
          SCREEN 2: CINEMATIC 3D HERO SCREEN (WITH 3S HOLD & EXPLOSION)
          =================================================================== */}
      <section
        className={`hero-viewport ${currentScreen === 'hero' ? 'visible' : ''}`}
        ref={heroViewportRef}
        aria-label="Tesh Digitals 3D Hero Screen"
      >
        <div className="hero-grid-background" aria-hidden="true" />
        <div className="hero-floor-lighting" ref={heroFloorLightRef} aria-hidden="true" />

        <span className="hero-crosshair hero-crosshair-tl" aria-hidden="true">+</span>
        <span className="hero-crosshair hero-crosshair-tr" aria-hidden="true">+</span>
        <span className="hero-crosshair hero-crosshair-bl" aria-hidden="true">+</span>
        <span className="hero-crosshair hero-crosshair-br" aria-hidden="true">+</span>

        {/* Top Navigation */}
        <header className="hero-header">
          <button
            type="button"
            className="hero-brand"
            ref={heroBrandRef}
            onClick={handleReturnToIntro}
            title="Click to return to Intro screen"
            aria-label="Tesh Digitals home"
          >
            <span>TESH DIGITALS</span>
            <span className="hero-brand-tag">3D HERO</span>
          </button>

          <nav className="hero-nav" ref={heroNavRef} aria-label="Main Navigation">
            <button type="button" className="hero-nav-link">WORK</button>
            <button type="button" className="hero-nav-link">SERVICES</button>
            <button type="button" className="hero-nav-link">CONTACT</button>
          </nav>
        </header>

        {/* Center Stage: Huge Typography & Overlapping 3D Golden Sphere */}
        <div className="hero-stage">
          <div className="hero-headline-wrapper">
            <h2 className="hero-headline" ref={heroHeadlineRef}>
              TESH DIGITALS
            </h2>
          </div>

          {/* Interactive 3D Golden Sphere Canvas & Hold Hitbox */}
          <div
            className="sphere-canvas-container"
            aria-label="Interactive 3D Metallic Golden Sphere"
            role="img"
          >
            {/* Interactive Hold Hitbox & Halo */}
            <div
              className={`sphere-interactive-hitbox ${isHolding ? 'is-holding' : ''}`}
              onPointerDown={startHold}
              onPointerUp={cancelHold}
              onPointerLeave={cancelHold}
              onTouchStart={startHold}
              onTouchEnd={cancelHold}
              onTouchCancel={cancelHold}
              onMouseEnter={() => {
                setIsSphereHovered(true);
                if (soundOn && !isHolding) soundManager.playHoverTick();
              }}
              onMouseLeave={() => {
                setIsSphereHovered(false);
                cancelHold();
              }}
              role="button"
              tabIndex={0}
              aria-label="Press and hold for 3 seconds to ignite sphere explosion"
              title="Press and hold 3s to ignite"
            >
              <div className="sphere-hold-halo" aria-hidden="true" />
            </div>

            <GoldenSphereCanvas
              isAssembling={isAssemblingSphere}
              isHovered={isSphereHovered}
              holdProgress={holdProgress}
              isExploding={isExploding}
              onExplosionComplete={startNextTemplateTransition}
              isResetting={isResetting}
            />
          </div>
        </div>

        {/* Bottom Section: 3-Second Countdown & Progress Line */}
        <footer className="hero-bottom" ref={heroBottomRef}>
          {/* Dynamic 3-Second Countdown HUD */}
          {isHolding && countdownNumber !== null ? (
            <div className="countdown-container" aria-live="polite">
              <div className="countdown-number" key={countdownNumber}>
                <span>{countdownNumber}</span>
                <span className="countdown-accent">S</span>
              </div>
              <div className="countdown-subtext">
                <span className="countdown-pulse-dot" />
                <span>CHARGING ENERGY...</span>
              </div>
            </div>
          ) : (
            <p className="hero-tagline">
              HOLD SPHERE FOR 3 SECONDS OR PRESS SPACEBAR
            </p>
          )}

          {/* Functional Animated Progress Line */}
          <div
            className={`progress-line-track ${isHolding ? 'holding' : ''}`}
            role="progressbar"
            aria-valuenow={Math.round(holdProgress * 100)}
            aria-valuemin="0"
            aria-valuemax="100"
            onPointerDown={startHold}
            onPointerUp={cancelHold}
            title={isHolding ? `Charging: ${Math.round(holdProgress * 100)}%` : 'Hold to charge'}
          >
            <div
              className="progress-line-fill"
              ref={progressFillRef}
              style={{
                width: isHolding || holdProgress > 0 ? `${holdProgress * 100}%` : `${introProgressPercent}%`,
              }}
            />
          </div>

          <button
            type="button"
            className="return-intro-pill"
            onClick={handleReturnToIntro}
            aria-label="Return to Intro Screen"
          >
            ← RETURN TO INTRO SCREEN
          </button>
        </footer>
      </section>

      {/* ===================================================================
          SCREEN 3: CLEAN PLACEHOLDER CONTAINER FOR NEXT TEMPLATE
          =================================================================== */}
      <section
        className={`next-template-viewport ${currentScreen === 'next-template' ? 'visible' : ''}`}
        ref={nextTemplateRef}
        aria-label="Next Template Transition Area"
      >
        <div className="next-template-content">
          <span className="next-template-badge">TESH DIGITALS — TEMPLATE TRANSITION</span>
          <h2 className="next-template-title">SEQUENCE ACTIVATED</h2>
          <p className="next-template-desc">
            The 3D golden sphere explosion completed successfully. The transition controller is now active and ready for your next template integration.
          </p>
          <button
            type="button"
            className="next-template-reset-btn"
            onClick={handleResetFromNextTemplate}
            aria-label="Replay sequence and restore 3D golden sphere"
          >
            <span>↺</span>
            <span>RESTORE 3D SPHERE & REPLAY</span>
          </button>
        </div>
      </section>
    </div>
  );
}
