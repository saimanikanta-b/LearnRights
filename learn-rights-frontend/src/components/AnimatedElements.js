import React, { useState, useEffect, useRef } from 'react';

/**
 * Typewriter text effect that types out text character by character.
 */
export const TypewriterText = ({ text, speed = 50, delay = 0, className = '', onComplete }) => {
  const [displayText, setDisplayText] = useState('');
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const delayTimer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(delayTimer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayText(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        setDone(true);
        onComplete && onComplete();
      }
    }, speed);
    return () => clearInterval(interval);
  }, [started, text, speed, onComplete]);

  return (
    <span className={className}>
      {displayText}
      {!done && <span style={{
        borderRight: '2px solid #a78bfa',
        animation: 'cursorBlink 0.8s ease-in-out infinite',
        marginLeft: 2,
      }} />}
    </span>
  );
};

/**
 * Animated counter that counts up from 0 to target value.
 */
export const AnimatedCounter = ({ end, duration = 2000, prefix = '', suffix = '', className = '' }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const numEnd = parseInt(end) || 0;
    if (numEnd === 0) { setCount(0); return; }
    
    let start = 0;
    const step = numEnd / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= numEnd) {
        setCount(numEnd);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [visible, end, duration]);

  return <span ref={ref} className={className}>{prefix}{count}{suffix}</span>;
};

/**
 * Scroll-triggered fade-in animation wrapper.
 */
export const FadeInOnScroll = ({ children, direction = 'up', delay = 0, className = '' }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const transforms = {
    up: 'translateY(40px)',
    down: 'translateY(-40px)',
    left: 'translateX(40px)',
    right: 'translateX(-40px)',
    scale: 'scale(0.9)',
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : transforms[direction],
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

/**
 * Glowing cursor follower effect.
 */
export const GlowCursor = () => {
  const glowRef = useRef(null);

  useEffect(() => {
    const handleMove = (e) => {
      if (glowRef.current) {
        glowRef.current.style.left = e.clientX + 'px';
        glowRef.current.style.top = e.clientY + 'px';
      }
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <div
      ref={glowRef}
      style={{
        position: 'fixed',
        width: 300,
        height: 300,
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 0,
        transform: 'translate(-50%, -50%)',
        background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)',
        transition: 'left 0.15s ease-out, top 0.15s ease-out',
      }}
    />
  );
};

/**
 * Staggered list animation wrapper.
 */
export const StaggeredList = ({ children, staggerDelay = 80 }) => {
  return (
    <>
      {React.Children.map(children, (child, i) => (
        <div
          style={{
            animation: `staggerFadeIn 0.5s ease forwards`,
            animationDelay: `${i * staggerDelay}ms`,
            opacity: 0,
          }}
        >
          {child}
        </div>
      ))}
    </>
  );
};

/**
 * Shimmer loading placeholder.
 */
export const ShimmerCard = ({ width = '100%', height = 200, borderRadius = 18 }) => (
  <div style={{
    width,
    height,
    borderRadius,
    background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
    backgroundSize: '400% 100%',
    animation: 'shimmerSlide 1.5s ease-in-out infinite',
    border: '1px solid rgba(255,255,255,0.06)',
  }} />
);
