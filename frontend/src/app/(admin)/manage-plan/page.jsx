"use client";

import { useAuth } from "@/hooks/auth";
import axios from "@/lib/axios";
import Button from "@/components/Button.jsx";
import Input from "@/components/Input.jsx";
import InputError from "@/components/InputError.jsx";
import Label from "@/components/Label.jsx";
import { useState, useEffect } from "react";

const SubscriptionPlans = () => {
  const { user } = useAuth({ middleware: "auth" });

  // Restrict to admins (role_id = 4)
  if (user?.profile?.system_role_id !== 4) {
    return <div className="py-12 text-center">Unauthorized</div>;
  }

  const [plans, setPlans] = useState([]);
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
    axios
      .get("/api/subscription-plans")
      .then((response) => setPlans(response.data))
      .catch((error) => console.error("Error fetching plans:", error));
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

  return (
    <div className="lg:ml-75 lg:py-12 mx-3 py-20">
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
          <div className="p-6 bg-white border-b border-gray-200">
            <h2 className="text-lg font-semibold">Manage Subscription Plans</h2>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 mt-4 max-w-md">
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
              <Button type="submit">
                {editingPlanId ? "Update Plan" : "Create Plan"}
              </Button>
            </form>

            {/* Plan List */}
            <div className="mt-6">
              <h3 className="text-md font-medium">Existing Plans</h3>
              {plans.length === 0 ? (
                <p className="mt-2">No plans available.</p>
              ) : (
                <table className="min-w-full mt-2 border">
                  <thead>
                    <tr>
                      <th className="border px-4 py-2">Name</th>
                      <th className="border px-4 py-2">Price</th>
                      <th className="border px-4 py-2">Duration</th>
                      <th className="border px-4 py-2">Max Churches</th>
                      <th className="border px-4 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plans.map((plan) => (
                      <tr key={plan.PlanID}>
                        <td className="border px-4 py-2">{plan.PlanName}</td>
                        <td className="border px-4 py-2">${plan.Price}</td>
                        <td className="border px-4 py-2">
                          {plan.DurationInMonths} months
                        </td>
                        <td className="border px-4 py-2">
                          {plan.MaxChurchesAllowed}
                        </td>
                        <td className="border px-4 py-2">
                          <button
                            onClick={() => handleEdit(plan)}
                            className="text-blue-600 hover:underline mr-2"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(plan.PlanID)}
                            className="text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
