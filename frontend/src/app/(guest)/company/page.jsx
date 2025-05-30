import AboutSection from '@/components/sections/aboutsection'
import ContactSection from '@/components/sections/contactsection'
import FaqSection from '@/components/sections/faqsection'
import TestimonialsSection from '@/components/sections/testimonialsection'
import React from 'react'


const page = () => {
  return (
    <div>
      <section id="about">
          <AboutSection/>
        </section>
        <section>
        <FaqSection/>
      </section>
        <section>
            <TestimonialsSection/>
        </section>
        <section>
            <ContactSection/>
        </section>
    </div>
  )
}

export default page
