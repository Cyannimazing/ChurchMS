"use client";

import React from "react";
import { X, Heart, Droplets, Wine, Cross } from "lucide-react";
import { Button } from "@/components/Button.jsx";

const CertificateTypeModal = ({ isOpen, onClose, onSelectType }) => {
  const certificateTypes = [
    {
      id: 'marriage',
      name: 'Marriage Certificate',
      description: 'Certificate of Marriage for couples',
      icon: Heart,
      color: 'text-red-600'
    },
    {
      id: 'baptism',
      name: 'Baptism Certificate',
      description: 'Certificate of Baptism for children',
      icon: Droplets,
      color: 'text-blue-600'
    },
    {
      id: 'firstCommunion',
      name: 'First Communion Certificate',
      description: 'Certificate of First Holy Communion',
      icon: Wine,
      color: 'text-purple-600'
    },
    {
      id: 'confirmation',
      name: 'Confirmation Certificate',
      description: 'Certificate of Confirmation',
      icon: Cross,
      color: 'text-green-600'
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Select Certificate Type</h2>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certificateTypes.map((type) => {
              const IconComponent = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => onSelectType(type.id)}
                  className="p-6 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-full bg-gray-100 group-hover:bg-blue-100 transition-colors`}>
                      <IconComponent className={`h-6 w-6 ${type.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-900">
                        {type.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {type.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex justify-end pt-6 border-t mt-6">
            <Button
              onClick={onClose}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateTypeModal;
