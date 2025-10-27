import Navigation from "@/components/layout/Navigation";
import AboutSection from "@/components/sections/aboutsection";
import ContactSection from "@/components/sections/contactsection";
import FaqSection from "@/components/sections/faqsection";
import TestimonialsSection from "@/components/sections/testimonialsection";
import React from "react";

const page = () => {
  return (
    <div>
      <Navigation />
      <div className="pt-20">
        <section id="about">
          <AboutSection />
        </section>
        <section>
          <FaqSection id="faq" />
        </section>
        <section>
          <TestimonialsSection id="testimonials" />
        </section>
        <section>
          <ContactSection id="contact" />
        </section>
      </div>
    </div>
  );
};

export default page;
