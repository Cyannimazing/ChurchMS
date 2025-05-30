import React from 'react';

const PricingSection = () => {
  return (
    <>
      <section className="py-12 bg-gray-50">
        <div className="max-w-screen-xl mx-auto text-center">
          <h1 className="mb-4 text-4xl font-extrabold leading-none tracking-tight md:text-5xl lg:text-6xl text-black">
            Unlock Full Features
          </h1>
          <p className="mb-6 text-lg font-normal text-black lg:text-xl sm:px-16 xl:px-48">
            Select your plan and empower your church with seamless service management.
          </p>
        </div>
      </section>

      <div className="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-4 px-4">
        {/* Standard Plan */}
        <div className="w-full max-w-sm p-4 bg-white border border-gray-200 rounded-lg shadow-lg sm:p-8">
          <h5 className="mb-4 text-xl font-medium text-black">Standard plan</h5>
          <div className="flex items-baseline text-black">
            <span className="text-3xl font-semibold">$</span>
            <span className="text-5xl font-extrabold tracking-tight">49</span>
            <span className="ml-1 text-xl font-normal text-black">/year</span>
          </div>
          <ul role="list" className="space-y-5 my-7">
            {[
              "2 team members",
              "20GB Cloud storage",
              "Integration help",
              "2 team members",
              "20GB Cloud storage",
              "Integration help",
              "2 team members",
            ].map((feature, index) => (
              <li key={index} className="flex items-center">
                <svg
                  className="shrink-0 w-4 h-4 text-black"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
                </svg>
                <span className="text-base font-normal leading-tight text-black ml-3">
                  {feature}
                </span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="text-white font-medium rounded-lg text-sm px-5 py-2.5 inline-flex justify-center w-full text-center bg-[#3A5B22] hover:bg-[#2e461a] transition-colors"
          >
            Get Started
          </button>
        </div>

        {/* Premium Plan */}
        <div className="w-full max-w-sm p-4 bg-white border border-gray-200 rounded-lg shadow-lg sm:p-8">
          <h5 className="mb-4 text-xl font-medium text-black">Premium plan</h5>
          <div className="flex items-baseline text-black">
            <span className="text-3xl font-semibold">$</span>
            <span className="text-5xl font-extrabold tracking-tight">49</span>
            <span className="ml-1 text-xl font-normal text-black">/year</span>
          </div>
          <ul role="list" className="space-y-5 my-7">
            {[
              "2 team members",
              "20GB Cloud storage",
              "Integration help",
              "2 team members",
              "20GB Cloud storage",
              "Integration help",
              "2 team members",
            ].map((feature, index) => (
              <li key={index} className="flex items-center">
                <svg
                  className="shrink-0 w-4 h-4 text-black"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
                </svg>
                <span className="text-base font-normal leading-tight text-black ml-3">
                  {feature}
                </span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="text-white font-medium rounded-lg text-sm px-5 py-2.5 inline-flex justify-center w-full text-center bg-[#3A5B22] hover:bg-[#2e461a] transition-colors"
          >
            Get Started
          </button>
        </div>
      </div>
    </>
  );
};

export default PricingSection;