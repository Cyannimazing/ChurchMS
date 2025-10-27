"use client";

import { useAuth } from "@/hooks/auth";
import axios from "@/lib/axios";
import Button from "@/components/Button.jsx";
import Input from "@/components/Input.jsx";
import InputError from "@/components/InputError.jsx";
import Label from "@/components/Label.jsx";
import DataLoading from "@/components/DataLoading";
import Alert from "@/components/Alert";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useState, useEffect } from "react";
import { X, Download, Eye, Loader2, Edit, Trash2 } from "lucide-react";
import SearchAndPagination from "@/components/SearchAndPagination";
import { filterAndPaginateData } from "@/utils/tableUtils";

const SubscriptionPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    PlanName: "",
    Price: "",
    DurationInMonths: "",
    MaxChurchesAllowed: "",
    Description: "",
  });
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, planId: null, action: null });
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  // Define search fields
  const searchFields = ['PlanName', 'Description'];
  
  // Handle search query change and reset pagination
  const handleSearchChange = (query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Get filtered and paginated data
  const { data: paginatedPlans, pagination } = filterAndPaginateData(
    plans,
    searchQuery,
    searchFields,
    currentPage,
    itemsPerPage
  );

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
        setAlert({
          type: 'error',
          title: 'Error Loading Plans',
          message: 'Failed to fetch subscription plans'
        });
        setLoading(false);
      });
  }, []);

  console.log(plans);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);


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
          setAlert({
            type: 'success',
            title: 'Plan Updated',
            message: 'Plan updated successfully!'
          });
        } else {
          setPlans([...plans, response.data]);
          setAlert({
            type: 'success',
            title: 'Plan Created',
            message: 'Plan created successfully!'
          });
        }
        // Reset form and close modal
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
          setAlert({
            type: 'error',
            title: 'Validation Error',
            message: 'Please fix the errors in the form'
          });
        } else {
          console.error("Error saving plan:", error);
          setAlert({
            type: 'error',
            title: 'Save Failed',
            message: 'Failed to save plan'
          });
        }
      })
      .finally(() => {
        setIsSubmitting(false);
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

  const handleDelete = async () => {
    const { planId } = confirmDialog;
    try {
      await axios.delete(`/api/subscription-plans/${planId}`);
      setPlans(plans.filter((plan) => plan.PlanID !== planId));
      setAlert({
        type: 'success',
        title: 'Plan Deleted',
        message: 'Plan deleted successfully!'
      });
    } catch (error) {
      console.error("Error deleting plan:", error);
      setAlert({
        type: 'error',
        title: 'Delete Failed',
        message: 'Cannot delete plan with active subscriptions'
      });
    } finally {
      setConfirmDialog({ isOpen: false, planId: null, action: null });
    }
  };

  const openDeleteConfirm = (planId, planName) => {
    setConfirmDialog({
      isOpen: true,
      planId,
      action: 'delete',
      title: 'Delete Plan',
      message: `Are you sure you want to delete "${planName}"? This action cannot be undone.`
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
    <div className="lg:p-6 w-full h-screen pt-20">
      <div className="w-full mx-auto h-full">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg h-full flex flex-col">
          <div className="p-6 bg-white border-b border-gray-200 flex-1 overflow-auto">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">
              Manage Subscription Plans
            </h1>
            
            {alert && (
              <div className="mb-6">
                <Alert
                  type={alert.type}
                  title={alert.title}
                  message={alert.message}
                  onClose={() => setAlert(null)}
                />
              </div>
            )}
            
            {/* Plan List */}
            <div className="mt-6">
              <div className="overflow-x-auto">
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Subscription Plans</h3>
                        <p className="mt-1 text-sm text-gray-600">Manage subscription plans and pricing</p>
                      </div>
                      <Button onClick={handleOpenModal}>Create Plan</Button>
                    </div>
                  </div>
                  
                  <div className="px-6 py-4">
                    <SearchAndPagination
                      searchQuery={searchQuery}
                      onSearchChange={handleSearchChange}
                      currentPage={currentPage}
                      totalPages={pagination.totalPages}
                      onPageChange={handlePageChange}
                      totalItems={pagination.totalItems}
                      itemsPerPage={itemsPerPage}
                      placeholder="Search plans..."
                    />
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Plan Details
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Pricing
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Duration
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Limits
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-8">
                              <DataLoading message="Loading plans..." />
                            </td>
                          </tr>
                        ) : paginatedPlans.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                              {searchQuery ? 'No plans found matching your search.' : 'No plans available.'}
                            </td>
                          </tr>
                        ) : (
                          paginatedPlans.map((plan) => (
                            <tr
                              key={plan.PlanID}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-start space-x-3">
                                  <div className="flex-shrink-0">
                                    <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                                      <span className="text-xs font-medium text-indigo-600">
                                        {plan.PlanName.charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {plan.PlanName}
                                    </p>
                                    {plan.Description && (
                                      <p className="text-xs text-gray-400 truncate mt-1">
                                        {plan.Description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-sm text-gray-900 font-medium">
                                  ₱{plan.Price}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-sm text-gray-900">
                                  {plan.DurationInMonths}mo
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {plan.MaxChurchesAllowed}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex justify-center items-center space-x-2">
                                  <Button
                                    onClick={() => handleEdit(plan)}
                                    variant="outline"
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 min-h-0 h-auto"
                                  >
                                    <Edit className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>
                                  <Button
                                    onClick={() => openDeleteConfirm(plan.PlanID, plan.PlanName)}
                                    variant="outline"
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border-red-200 min-h-0 h-auto"
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete
                                  </Button>
                                </div>
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
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div
            className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 p-6 relative max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-labelledby="modal-title"
          >
            <Button
              onClick={handleCloseModal}
              variant="outline"
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 p-1.5 min-h-0 h-auto border-none hover:bg-gray-100"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </Button>
            <h2
              id="modal-title"
              className="text-xl font-bold text-gray-900 mb-6"
            >
              {editingPlanId ? "Edit Plan" : "Create Plan"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label
                  htmlFor="PlanName"
                  className="text-sm font-medium text-gray-700"
                >
                  Plan Name
                </Label>
                <Input
                  id="PlanName"
                  type="text"
                  value={form.PlanName}
                  onChange={(e) =>
                    setForm({ ...form, PlanName: e.target.value })
                  }
                  placeholder="Enter plan name (e.g., Basic Plan)"
                  required
                  className="block mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <InputError
                  messages={errors.PlanName}
                  className="mt-2 text-xs text-red-600"
                />
              </div>
              <div>
                <Label
                  htmlFor="Price"
                  className="text-sm font-medium text-gray-700"
                >
                  Price
                </Label>
                <Input
                  id="Price"
                  type="number"
                  step="0.01"
                  value={form.Price}
                  onChange={(e) => setForm({ ...form, Price: e.target.value })}
                  placeholder="Enter price (e.g., 29.99)"
                  required
                  className="block mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <InputError
                  messages={errors.Price}
                  className="mt-2 text-xs text-red-600"
                />
              </div>
              <div>
                <Label
                  htmlFor="DurationInMonths"
                  className="text-sm font-medium text-gray-700"
                >
                  Duration (Months)
                </Label>
                <Input
                  id="DurationInMonths"
                  type="number"
                  value={form.DurationInMonths}
                  onChange={(e) =>
                    setForm({ ...form, DurationInMonths: e.target.value })
                  }
                  placeholder="Enter duration in months (e.g., 12)"
                  required
                  className="block mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <InputError
                  messages={errors.DurationInMonths}
                  className="mt-2 text-xs text-red-600"
                />
              </div>
              <div>
                <Label
                  htmlFor="MaxChurchesAllowed"
                  className="text-sm font-medium text-gray-700"
                >
                  Max Churches
                </Label>
                <Input
                  id="MaxChurchesAllowed"
                  type="number"
                  value={form.MaxChurchesAllowed}
                  onChange={(e) =>
                    setForm({ ...form, MaxChurchesAllowed: e.target.value })
                  }
                  placeholder="Enter max churches (e.g., 5)"
                  required
                  className="block mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <InputError
                  messages={errors.MaxChurchesAllowed}
                  className="mt-2 text-xs text-red-600"
                />
              </div>
              <div>
                <Label
                  htmlFor="Description"
                  className="text-sm font-medium text-gray-700"
                >
                  Description
                </Label>
                <textarea
                  id="Description"
                  value={form.Description}
                  onChange={(e) =>
                    setForm({ ...form, Description: e.target.value })
                  }
                  placeholder="Enter plan description (e.g., Perfect for small churches with basic features)"
                  className="block mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  rows="3"
                />
                <InputError
                  messages={errors.Description}
                  className="mt-2 text-xs text-red-600"
                />
              </div>
              <div className="flex justify-end items-center space-x-3">
                <Button
                  type="button"
                  onClick={handleCloseModal}
                  variant="outline"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {editingPlanId ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>{editingPlanId ? "Update Plan" : "Create Plan"}</>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, planId: null, action: null })}
        onConfirm={handleDelete}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default SubscriptionPlans;
