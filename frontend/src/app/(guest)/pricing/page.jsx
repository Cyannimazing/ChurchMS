"use client";

import Navigation from "@/components/layout/Navigation";
import PricingSection from "@/components/sections/pricingsection";
import { useRouter, useSearchParams } from "next/navigation";

const PricingPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePlanSelect = (planId) => {
    router.push(`/register?roleId=2&planId=${planId}`);
  };

  return (
    <div>
      <Navigation />
      <div className="pt-20">
        <PricingSection onPlanSelect={handlePlanSelect} />
      </div>
    </div>
  );
};

export default PricingPage;
