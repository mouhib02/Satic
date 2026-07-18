document.addEventListener('DOMContentLoaded', () => {
  // ─── Utilities ───
  const lerp = (start, end, factor) => start + (end - start) * factor;
  const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

  // ─── Reading Progress ───
  const progressBar = document.querySelector('.reading-progress-bar');
  if (progressBar) {
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      progressBar.style.width = progress + '%';
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  }

  // ─── Header Scroll State ───
  const header = document.querySelector('.site-header');
  if (header) {
    let lastScroll = 0;
    const updateHeader = () => {
      const currentScroll = window.scrollY;
      header.classList.toggle('scrolled', currentScroll > 50);
      lastScroll = currentScroll;
    };
    window.addEventListener('scroll', updateHeader, { passive: true });
    updateHeader();
  }

  // ─── Custom Cursor ───
  if (!isTouchDevice && !prefersReducedMotion) {
    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    if (dot && ring) {
      let mouseX = 0, mouseY = 0;
      let dotX = 0, dotY = 0;
      let ringX = 0, ringY = 0;
      let isActive = true;
      let rafId = null;

      document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        if (!isActive) {
          isActive = true;
          animateCursor();
        }
      });

      document.addEventListener('mouseleave', () => {
        isActive = false;
        if (rafId) cancelAnimationFrame(rafId);
      });

      const animateCursor = () => {
        if (!isActive) return;
        dotX = lerp(dotX, mouseX, 0.2);
        dotY = lerp(dotY, mouseY, 0.2);
        ringX = lerp(ringX, mouseX, 0.08);
        ringY = lerp(ringY, mouseY, 0.08);
        dot.style.left = dotX + 'px';
        dot.style.top = dotY + 'px';
        ring.style.left = ringX + 'px';
        ring.style.top = ringY + 'px';
        rafId = requestAnimationFrame(animateCursor);
      };
      animateCursor();
    }
  }

  // ─── Magnetic Effect ───
  if (!isTouchDevice && !prefersReducedMotion) {
    document.querySelectorAll('.magnetic').forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        el.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'translate(0, 0)';
      });
    });
  }

  // ─── Typewriter Effect ───
  const typewriterEl = document.querySelector('[data-typewriter]');
  if (typewriterEl && !prefersReducedMotion) {
    const text = typewriterEl.dataset.typewriter;
    typewriterEl.textContent = '';
    let i = 0;
    const type = () => {
      if (i < text.length) {
        typewriterEl.textContent += text.charAt(i);
        i++;
        setTimeout(type, 40 + Math.random() * 40);
      }
    };
    const typeObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          type();
          typeObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    typeObserver.observe(typewriterEl);
  }

  // ─── 3D Tilt & Shine on Cards ───
  if (!isTouchDevice && !prefersReducedMotion) {
    document.querySelectorAll('[data-tilt]').forEach(card => {
      const shine = card.querySelector('.card-shine');

      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -6;
        const rotateY = ((x - centerX) / centerX) * 6;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`;

        if (shine) {
          const percentX = (x / rect.width) * 100;
          const percentY = (y / rect.height) * 100;
          shine.style.setProperty('--mouse-x', percentX + '%');
          shine.style.setProperty('--mouse-y', percentY + '%');
        }
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
      });
    });
  }

  // ─── Mobile Navigation ───
  const navToggle = document.querySelector('.nav-toggle');
  const navList = document.querySelector('.nav-list');
  const navLinks = document.querySelectorAll('.nav-link');

  if (navToggle && navList) {
    navToggle.addEventListener('click', () => {
      const isOpen = navList.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        if (navList.classList.contains('is-open')) {
          navList.classList.remove('is-open');
          navToggle.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
        }
      });
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && navList.classList.contains('is-open')) {
        navList.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        navToggle.focus();
      }
    });
  }

  // ─── Scroll Reveal with Stagger ───
  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    const revealElements = document.querySelectorAll('.reveal-hidden');
    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -60px 0px',
      threshold: 0.08,
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    revealElements.forEach((element) => {
      revealObserver.observe(element);
    });
  } else {
    document.querySelectorAll('.reveal-hidden').forEach((element) => {
      element.classList.add('reveal-visible');
    });
  }

  // ─── Ambient Particle Network Canvas ───
  const canvas = document.getElementById('ambient-canvas');
  if (canvas && !prefersReducedMotion) {
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];
    let animationId;
    let isVisible = true;

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Create particles
    const particleCount = Math.min(Math.floor(window.innerWidth / 12), 100);
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.5 + 0.2,
      });
    }

    let mouseParticleX = width / 2;
    let mouseParticleY = height / 2;

    document.addEventListener('mousemove', (e) => {
      mouseParticleX = e.clientX;
      mouseParticleY = e.clientY;
    });

    const draw = () => {
      if (!isVisible) {
        animationId = requestAnimationFrame(draw);
        return;
      }
      ctx.clearRect(0, 0, width, height);

      // Update and draw particles
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 176, 58, ${p.alpha * 0.6})`;
        ctx.fill();

        // Connect nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(255, 176, 58, ${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }

        // Connect to mouse
        const mdx = p.x - mouseParticleX;
        const mdy = p.y - mouseParticleY;
        const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mDist < 200) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouseParticleX, mouseParticleY);
          ctx.strokeStyle = `rgba(255, 176, 58, ${0.12 * (1 - mDist / 200)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      });

      animationId = requestAnimationFrame(draw);
    };

    // Visibility check
    document.addEventListener('visibilitychange', () => {
      isVisible = !document.hidden;
    });

    draw();
  }

  // ─── Smooth Scroll for Anchor Links ───
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      }
    });
  });

  // ─── Glitch Text Trigger on Scroll ───
  if (!prefersReducedMotion) {
    const glitchObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('glitch-active');
          setTimeout(() => entry.target.classList.remove('glitch-active'), 400);
          glitchObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.8 });

    document.querySelectorAll('[data-glitch]').forEach(el => {
      glitchObserver.observe(el);
    });
  }
})
