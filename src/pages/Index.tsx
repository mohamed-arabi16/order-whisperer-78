import Hero from "@/components/Hero";
import Features from "@/components/Features";
import MenuDemo from "@/components/MenuDemo";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <Features />
      <MenuDemo />
      
      {/* Backend Integration Notice */}
      <section className="py-16 px-4 bg-accent/10">
        <div className="container mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4 text-accent">Ready to Build Your Restaurant Platform?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            To implement the full multi-tenant system with authentication, database management, 
            and backend APIs as described in your Gherkin features, you'll need to connect this project to Supabase.
          </p>
          <p className="text-sm text-muted-foreground">
            Click the green Supabase button in the top right to activate our native integration 
            and unlock features like user authentication, tenant isolation with RLS, and backend APIs.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Index;
