import React from "react";
import Button from "@/components/Button.jsx";

const PlanCard = ({ plan, isSelected, onSelect }) => {
  return (
    <div
      className={`border rounded-lg p-6 cursor-pointer transition-all ${
        isSelected
          ? "border-blue-500 ring-2 ring-blue-200"
          : "hover:border-gray-300"
      }`}
      onClick={onSelect}
    >
      <h3 className="text-xl font-bold text-gray-800">{plan.PlanName}</h3>
      <p className="text-2xl font-semibold my-2 text-blue-600">
        ${plan.Price}
        <span className="text-sm text-gray-500 ml-1">
          / {plan.DurationInMonths} month{plan.DurationInMonths !== 1 ? "s" : ""}
        </span>
      </p>
      <p className="text-gray-600 mb-4">{plan.Description}</p>
      <div className="space-y-2">
        <p className="text-sm text-gray-700">
          <span className="font-medium">Duration:</span>{" "}
          {plan.DurationInMonths} month{plan.DurationInMonths !== 1 ? "s" : ""}
        </p>
        <p className="text-sm text-gray-700">
          <span className="font-medium">Max Churches:</span> {plan.MaxChurchesAllowed}
        </p>
      </div>
      <Button
        className={`mt-4 w-full ${
          isSelected ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-500 hover:bg-blue-600"
        }`}
        onClick={onSelect}
      >
        {isSelected ? "Selected" : "Select Plan"}
      </Button>
    </div>
  );
};

export default PlanCard;