import FeaturesSection from '@/components/sections/featuresection'
import ForChurchesSection from '@/components/sections/forchurches'
import HowItWorksSection from '@/components/sections/howitworks'
import React from 'react'

const page = () => {
  return (
    <div>
      <section>
       <FeaturesSection/>
      </section>
      <section>
        <HowItWorksSection/>
      </section>
      <section>
        <ForChurchesSection/>
      </section>
    </div>
  )
}

export default page
