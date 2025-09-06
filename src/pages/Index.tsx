import Features from "@/components/Features";
import Hero from "@/components/Hero";
import MenuDemo from "@/components/MenuDemo";
import Parallax from "@/components/Parallax";
import StaggeredFadeIn from "@/components/StaggeredFadeIn";
import { useTranslation } from "@/hooks/useTranslation";

/**
 * The main landing page of the application.
 * It assembles several components to create the homepage layout.
 *
 * @returns {JSX.Element} The rendered index page.
 */
const Index = (): JSX.Element => {
  const { t, isRTL } = useTranslation();

  return (
    <div className="min-h-screen">
      <Parallax speed={0.5}>
        <StaggeredFadeIn>
          <Hero />
        </StaggeredFadeIn>
      </Parallax>
      <StaggeredFadeIn>
        <Features />
      </StaggeredFadeIn>
      <StaggeredFadeIn>
        <MenuDemo />
      </StaggeredFadeIn>

      {/* Call to Action */}
      <StaggeredFadeIn>
        <section
          className="py-16 px-4 bg-accent/10"
          dir={isRTL ? "rtl" : "ltr"}
        >
          <div className="container mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4 text-accent">
              {t("cta.title")}
            </h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              {t("cta.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/auth"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 gradient-hero text-primary-foreground hover:shadow-glow hover:scale-105 font-semibold h-11 rounded-md px-8"
              >
                {t("cta.restaurantLogin")}
              </a>
              <a
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 rounded-md px-8"
              >
                {t("cta.dashboard")}
              </a>
            </div>
          </div>
        </section>
      </StaggeredFadeIn>
    </div>
  );
};

export default Index;
