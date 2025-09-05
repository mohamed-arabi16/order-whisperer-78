import { useEffect, useRef, useState, ReactNode } from "react";

/**
 * Props for the AnimatedSection component.
 */
interface AnimatedSectionProps {
  /**
   * The content to be rendered within the section.
   */
  children: ReactNode;
  /**
   * Optional CSS class name to be applied to the section.
   */
  className?: string;
}

/**
 * A component that fades in its children when it becomes visible in the viewport.
 * It uses the IntersectionObserver API to detect when the component is in view.
 *
 * @param {AnimatedSectionProps} props - The props for the component.
 * @returns {JSX.Element} The rendered animated section.
 */
const AnimatedSection = ({
  children,
  className,
}: AnimatedSectionProps): JSX.Element => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    const currentRef = sectionRef.current;
    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  return (
    <div
      ref={sectionRef}
      className={`${className} transition-opacity duration-1000 ease-in ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      {children}
    </div>
  );
};

export default AnimatedSection;
