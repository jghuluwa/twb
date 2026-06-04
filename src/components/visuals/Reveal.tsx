import { CSSProperties, ReactNode } from 'react';
import { motion, useReducedMotion, Variants } from 'motion/react';

interface RevealProps {
  children: ReactNode;
  /** Stagger delay for siblings (in seconds) */
  delay?: number;
  /** Initial vertical offset in px */
  y?: number;
  /** Whether to also slide in from the side */
  x?: number;
  /** Render with this element tag */
  as?: 'div' | 'section' | 'span' | 'li' | 'article' | 'header' | 'h2' | 'h3';
  className?: string;
  /** Animation duration */
  duration?: number;
  /** When passed, children are treated as a stagger container */
  stagger?: number;
  /** When false, animate every time it enters the viewport */
  once?: boolean;
  /** Inline style passthrough */
  style?: CSSProperties;
}

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * One-line scroll-reveal wrapper. Reads prefers-reduced-motion and skips
 * the transform if the user prefers less motion.
 *
 *   <Reveal>...</Reveal>           // simple fade-up
 *   <Reveal stagger={0.09}> ...    // makes each child fade up sequentially
 *     <Reveal>card 1</Reveal>
 *     <Reveal>card 2</Reveal>
 *   </Reveal>
 */
export default function Reveal({
  children,
  delay = 0,
  y = 28,
  x = 0,
  as = 'div',
  className,
  duration = 0.7,
  stagger,
  once = true,
  style
}: RevealProps) {
  const reduce = useReducedMotion();
  const Tag = motion[as] as typeof motion.div;

  const variants: Variants = stagger
    ? {
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren: delay } }
      }
    : {
        hidden: { opacity: 0, y: reduce ? 0 : y, x: reduce ? 0 : x },
        show:   { opacity: 1, y: 0, x: 0, transition: { duration, ease: EASE, delay } }
      };

  return (
    <Tag
      className={className}
      style={style}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount: 0.15, margin: '0px 0px -10% 0px' }}
      variants={variants}
    >
      {children}
    </Tag>
  );
}
