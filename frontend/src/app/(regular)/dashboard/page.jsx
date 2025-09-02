import MapWrapper from '@/components/MapWrapper'

export const metadata = {
  title: "Dashboard",
};

const Dashboard = () => {
  return (
    <div className="lg:p-6 w-full h-screen pt-20">
      <div className="max-w-7xl mx-auto h-full">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg h-full flex flex-col">
          <div className="p-6 bg-white border-b border-gray-200">
            <h1 className="text-2xl font-semibold text-gray-900">
              Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Welcome to your Dashboard - Explore registered churches on the map below
            </p>
          </div>
          <div className="p-6 flex-1 flex flex-col">
            <div className="mb-4">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Public Churches Map</h2>
              <p className="text-sm text-gray-600 mb-4">
                View all registered and published churches with their locations and logos.
              </p>
            </div>
            <div className="flex-1">
              <MapWrapper />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
