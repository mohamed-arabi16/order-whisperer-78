import {
  motion,
  useInView,
  useAnimation,
  Variants,
  Transition,
} from "framer-motion";
import { ReactNode, useEffect, useRef } from "react";

/**
 * Props for the StaggeredFadeIn component.
 */
interface StaggeredFadeInProps {
  /**
   * The content to be rendered within the section.
   */
  children: ReactNode;
  /**
   * Optional CSS class name to be applied to the section.
   */
  className?: string;
  /**
   * The amount of time to stagger the animation of each child.
   * @default 0.05
   */
  stagger?: number;
  /**
   * The amount of time to delay the start of the animation.
   * @default 0
   */
  delay?: number;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: (i = 1) => ({
    opacity: 1,
    transition: { staggerChildren: i, delayChildren: 0 },
  }),
};

const childVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 15,
      stiffness: 200,
      duration: 0.4,
    },
  },
};

/**
 * A component that fades in its children in a staggered sequence when it enters the viewport.
 * It uses `framer-motion` for animations and `IntersectionObserver` (via `useInView`) to detect visibility.
 *
 * @param {StaggeredFadeInProps} props - The props for the component.
 * @returns {JSX.Element} The rendered staggered fade-in section.
 */
const StaggeredFadeIn = ({
  children,
  className,
  stagger = 0.1,
  delay = 0,
}: StaggeredFadeInProps): JSX.Element => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate={controls}
      transition={{ staggerChildren: stagger, delayChildren: delay }}
    >
      {Array.isArray(children) ? (
        children.map((child, index) => (
          <motion.div key={index} variants={childVariants}>
            {child}
          </motion.div>
        ))
      ) : (
        <motion.div variants={childVariants}>{children}</motion.div>
      )}
    </motion.div>
  );
};

export default StaggeredFadeIn;
