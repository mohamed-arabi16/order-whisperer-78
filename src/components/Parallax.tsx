import { motion, useScroll, useTransform } from "framer-motion";
import { ReactNode, useRef } from "react";

/**
 * Props for the Parallax component.
 */
interface ParallaxProps {
  /**
   * The content to be rendered within the parallax section.
   */
  children: ReactNode;
  /**
   * Optional CSS class name to be applied to the section.
   */
  className?: string;
  /**
   * The speed of the parallax effect.
   * A value of 0.5 will move the content at half the scroll speed.
   * @default 0.5
   */
  speed?: number;
}

/**
 * A component that creates a parallax scrolling effect on its children.
 * It uses `framer-motion`'s `useScroll` and `useTransform` hooks to achieve the effect.
 *
 * @param {ParallaxProps} props - The props for the component.
 * @returns {JSX.Element} The rendered parallax section.
 */
const Parallax = ({
  children,
  className,
  speed = 0.5,
}: ParallaxProps): JSX.Element => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", `${speed * 100}%`]);

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
};

export default Parallax;
