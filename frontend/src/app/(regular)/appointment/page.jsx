export const metadata = {
  title: "Appointment",
};

const AppointmentPage = () => {
  return (
    <div className="lg:p-6 w-full h-screen pt-20">
      <div className="max-w-7xl mx-auto h-full">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg h-full flex flex-col">
          <div className="p-6 bg-white border-b border-gray-200">
            <h1 className="text-2xl font-semibold text-gray-900">
              Appointments
            </h1>
          </div>
          <div className="p-6 flex-1">
            <p className="text-gray-600">
              Welcome to the Appointment Management System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentPage;
