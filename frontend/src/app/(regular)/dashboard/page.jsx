'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, MapPin, Heart, Send } from 'lucide-react'
import MapWrapper from '@/components/MapWrapper'
import SacramentApplicationModal from '@/components/SacramentApplicationModal'
import axios from '@/lib/axios'
import { useAuth } from '@/hooks/auth.jsx'

const Dashboard = () => {
  const router = useRouter()
  const { user } = useAuth()
  const [churches, setChurches] = useState([])
  const [nearestChurches, setNearestChurches] = useState([])
  const [userLocation, setUserLocation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedChurch, setSelectedChurch] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [churchImages, setChurchImages] = useState({})

  useEffect(() => {
    // Clean up any leftover payment data without showing alerts
    localStorage.removeItem('paymongo_session_id')
    localStorage.removeItem('paymongo_church_id')
    localStorage.removeItem('appointment_success')
    
    // Clean URL
    window.history.replaceState({}, document.title, '/dashboard')
    
    // Get user location and fetch churches
    getUserLocation()
    fetchChurches()
  }, [])

  const getUserLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.warn('Geolocation error:', error)
          // Fallback to Manila coordinates
          setUserLocation({
            lat: 14.5995,
            lng: 120.9842
          })
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      )
    } else {
      // Fallback to Manila coordinates
      setUserLocation({
        lat: 14.5995,
        lng: 120.9842
      })
    }
  }

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371 // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  const fetchChurches = async () => {
    try {
      const response = await axios.get('/api/churches/public')
      const allChurches = response.data.churches || []
      setChurches(allChurches)
      
      // Use direct image URLs
      const imageMap = {}
      allChurches.forEach(church => {
        if (church.ProfilePictureUrl) imageMap[church.ChurchID] = church.ProfilePictureUrl
      })
      setChurchImages(imageMap)
      
      // Calculate nearest churches when user location is available
      if (userLocation && allChurches.length > 0) {
        const churchesWithDistance = allChurches.map(church => ({
          ...church,
          distance: calculateDistance(
            userLocation.lat,
            userLocation.lng,
            parseFloat(church.Latitude),
            parseFloat(church.Longitude)
          )
        }))
        
        const sortedChurches = churchesWithDistance
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 3)
          
        setNearestChurches(sortedChurches)
      }
    } catch (err) {
      console.error('Error fetching churches:', err)
    } finally {
      setLoading(false)
    }
  }

  // Recalculate nearest churches when user location changes
  useEffect(() => {
    if (userLocation && churches.length > 0) {
      const churchesWithDistance = churches.map(church => ({
        ...church,
        distance: calculateDistance(
          userLocation.lat,
          userLocation.lng,
          parseFloat(church.Latitude),
          parseFloat(church.Longitude)
        )
      }))
      
      const sortedChurches = churchesWithDistance
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 3)
        
      setNearestChurches(sortedChurches)
    }
  }, [userLocation, churches])

  const handleBecomeMember = (churchId) => {
    router.push(`/church/${churchId}/become-member`)
  }
  
  const handleSendRequest = (church) => {
    setSelectedChurch(church)
    setShowModal(true)
  }
  
  return (
    <div className="lg:p-6 w-full h-screen pt-20">
      <div className="w-full h-full">
        
        <div className="bg-white overflow-y-auto shadow-sm rounded-lg flex flex-col h-full">
          <div className="p-6 bg-white border-b border-gray-200">
            <h1 className="text-2xl font-semibold text-gray-900">
              Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Welcome to your Dashboard - Explore registered churches on the map below
            </p>
          </div>
          <div className="p-6 flex-1 flex flex-col">
            {/* Header for the entire section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-medium text-gray-900">Find Churches Near You</h2>
                <div className="flex items-center text-sm text-gray-500">
                  <MapPin className="w-4 h-4 mr-1" />
                  Interactive Map
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Explore registered churches with their locations. Click on any church marker to request sacraments or apply for membership.
              </p>
            </div>
            
            {/* Main Content: 30% Nearest Churches + 70% Map */}
            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
              {/* Left: Nearest Churches (30%) */}
              <div className="lg:w-[30%] space-y-4 flex-shrink-0">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
                  <div className="mb-4">
                    <h3 className="text-base font-semibold text-gray-900">Join a Parish Community</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Become a member of a local church community. Find your spiritual home and connect with fellow believers.
                    </p>
                  </div>
                  
                  {!loading && nearestChurches.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Nearest Churches</h4>
                      <div className="space-y-3">
                        {nearestChurches.map((church) => (
                          <div key={church.ChurchID} className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors">
                            <div className="flex items-center mb-3">
                              {churchImages[church.ChurchID] ? (
                                <img 
                                  src={churchImages[church.ChurchID]}
                                  alt={church.ChurchName}
                                  className="w-8 h-8 rounded-full object-cover border border-gray-200 mr-3"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm mr-3">
                                  {church.ChurchName.charAt(0)}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h5 className="text-sm font-medium text-gray-900 truncate">{church.ChurchName}</h5>
                                {church.distance && (
                                  <p className="text-xs text-gray-500">{church.distance.toFixed(1)} km away</p>
                                )}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <button 
                                onClick={() => handleSendRequest(church)}
                                className="w-full inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer"
                              >
                                <Send className="w-3 h-3 mr-1" />
                                Send Request
                              </button>
                              <button 
                                onClick={() => handleBecomeMember(church.ChurchID)}
                                className="w-full inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer"
                              >
                                <Users className="w-3 h-3 mr-1" />
                                Membership
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Right: Map (70%) */}
              <div className="lg:w-[70%] flex-1 min-h-[400px]">
                <div className="h-full w-full">
                  <MapWrapper />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Sacrament Application Modal */}
      {showModal && selectedChurch && (
        <SacramentApplicationModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false)
            setSelectedChurch(null)
          }}
          church={selectedChurch}
        />
      )}
    </div>
  );
};

export default Dashboard;
