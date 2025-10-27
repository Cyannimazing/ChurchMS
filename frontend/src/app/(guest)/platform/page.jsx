import Navigation from "@/components/layout/Navigation";
import FeaturesSection from "@/components/sections/featuresection";
import ForChurchesSection from "@/components/sections/forchurches";
import HowItWorksSection from "@/components/sections/howitworks";
import React from "react";

const page = () => {
  return (
    <div>
      <Navigation />
      <div className="pt-20">
        <section>
          <FeaturesSection id="feature" />
        </section>
        <section>
          <HowItWorksSection id="how_it_work" />
        </section>
        <section>
          <ForChurchesSection id="for_churches" />
        </section>
      </div>
    </div>
  );
};

export default page;
