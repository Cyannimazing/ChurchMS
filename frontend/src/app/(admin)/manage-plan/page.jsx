"use client";

import { useAuth } from "@/hooks/auth";
import axios from "@/lib/axios";
import Button from "@/components/Button.jsx";
import Input from "@/components/Input.jsx";
import InputError from "@/components/InputError.jsx";
import Label from "@/components/Label.jsx";
import DataLoading from "@/components/DataLoading";
import { useState, useEffect } from "react";
import { X } from "lucide-react";

const SubscriptionPlans = () => {
  const { user } = useAuth({ middleware: "auth" });

  // Restrict to admins (role_id = 4)
  if (user?.profile?.system_role_id !== 4) {
    return <div className="py-12 text-center">Unauthorized</div>;
  }

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    PlanName: "",
    Price: "",
    DurationInMonths: "",
    MaxChurchesAllowed: "",
    Description: "",
  });
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [errors, setErrors] = useState({});

  // Fetch plans
  useEffect(() => {
    setLoading(true);
    axios
      .get("/api/subscription-plans")
      .then((response) => {
        setPlans(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching plans:", error);
        setLoading(false);
      });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});

    const request = editingPlanId
      ? axios.put(`/api/subscription-plans/${editingPlanId}`, form)
      : axios.post("/api/subscription-plans", form);

    request
      .then((response) => {
        if (editingPlanId) {
          setPlans(
            plans.map((plan) =>
              plan.PlanID === editingPlanId ? response.data : plan
            )
          );
        } else {
          setPlans([...plans, response.data]);
        }
        setForm({
          PlanName: "",
          Price: "",
          DurationInMonths: "",
          MaxChurchesAllowed: "",
          Description: "",
        });
        setEditingPlanId(null);
        setIsModalOpen(false);
      })
      .catch((error) => {
        if (error.response?.status === 422) {
          setErrors(error.response.data.errors);
        } else {
          console.error("Error saving plan:", error);
        }
      });
  };

  const handleEdit = (plan) => {
    setForm({
      PlanName: plan.PlanName,
      Price: plan.Price,
      DurationInMonths: plan.DurationInMonths,
      MaxChurchesAllowed: plan.MaxChurchesAllowed,
      Description: plan.Description,
    });
    setEditingPlanId(plan.PlanID);
    setErrors({});
    setIsModalOpen(true);
  };

  const handleDelete = (planId) => {
    axios
      .delete(`/api/subscription-plans/${planId}`)
      .then(() => {
        setPlans(plans.filter((plan) => plan.PlanID !== planId));
      })
      .catch((error) => {
        console.error("Error deleting plan:", error);
        alert("Cannot delete plan with active subscriptions.");
      });
  };

  const handleOpenModal = () => {
    setForm({
      PlanName: "",
      Price: "",
      DurationInMonths: "",
      MaxChurchesAllowed: "",
      Description: "",
    });
    setEditingPlanId(null);
    setErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setForm({
      PlanName: "",
      Price: "",
      DurationInMonths: "",
      MaxChurchesAllowed: "",
      Description: "",
    });
    setEditingPlanId(null);
    setErrors({});
  };

  return (
    <div className="lg:ml-72 lg:py-12 mx-3 py-20">
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
          <div className="p-6 bg-white border-b border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">
                Manage Subscription Plans
              </h2>
              <button
                onClick={handleOpenModal}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Create Plan
              </button>
            </div>

            {/* Plan List */}
            <div className="mt-6">
              <h3 className="text-md font-medium">Existing Plans</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Max Churches
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody
                    className="bg-white divide-y divide-gray-200"
                    aria-live="polite"
                  >
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4">
                          <DataLoading message="Loading plans..." />
                        </td>
                      </tr>
                    ) : plans.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-4 text-center text-gray-500"
                        >
                          No plans available.
                        </td>
                      </tr>
                    ) : (
                      plans.map((plan) => (
                        <tr key={plan.PlanID}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {plan.PlanName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            ${plan.Price}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {plan.DurationInMonths} months
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {plan.MaxChurchesAllowed}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleEdit(plan)}
                              className="text-indigo-600 hover:text-indigo-900 mr-4"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(plan.PlanID)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6 relative max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-labelledby="modal-title"
          >
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
            <h2
              id="modal-title"
              className="text-xl font-bold text-gray-900 mb-4"
            >
              {editingPlanId ? "Edit Plan" : "Create Plan"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="PlanName">Plan Name</Label>
                <Input
                  id="PlanName"
                  type="text"
                  value={form.PlanName}
                  onChange={(e) =>
                    setForm({ ...form, PlanName: e.target.value })
                  }
                  required
                  className="block mt-1 w-full"
                />
                <InputError messages={errors.PlanName} className="mt-2" />
              </div>
              <div>
                <Label htmlFor="Price">Price</Label>
                <Input
                  id="Price"
                  type="number"
                  step="0.01"
                  value={form.Price}
                  onChange={(e) => setForm({ ...form, Price: e.target.value })}
                  required
                  className="block mt-1 w-full"
                />
                <InputError messages={errors.Price} className="mt-2" />
              </div>
              <div>
                <Label htmlFor="DurationInMonths">Duration (Months)</Label>
                <Input
                  id="DurationInMonths"
                  type="number"
                  value={form.DurationInMonths}
                  onChange={(e) =>
                    setForm({ ...form, DurationInMonths: e.target.value })
                  }
                  required
                  className="block mt-1 w-full"
                />
                <InputError
                  messages={errors.DurationInMonths}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="MaxChurchesAllowed">Max Churches</Label>
                <Input
                  id="MaxChurchesAllowed"
                  type="number"
                  value={form.MaxChurchesAllowed}
                  onChange={(e) =>
                    setForm({ ...form, MaxChurchesAllowed: e.target.value })
                  }
                  required
                  className="block mt-1 w-full"
                />
                <InputError
                  messages={errors.MaxChurchesAllowed}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="Description">Description</Label>
                <textarea
                  id="Description"
                  value={form.Description}
                  onChange={(e) =>
                    setForm({ ...form, Description: e.target.value })
                  }
                  className="block mt-1 w-full border rounded p-2"
                />
                <InputError messages={errors.Description} className="mt-2" />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <Button type="submit">
                  {editingPlanId ? "Update Plan" : "Create Plan"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPlans;
