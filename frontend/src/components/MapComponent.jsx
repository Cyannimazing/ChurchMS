'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import axios from '@/lib/axios'
import SacramentApplicationModal from './SacramentApplicationModal'

// Fix for default markers in react-leaflet
import 'leaflet/dist/leaflet.css'

// Create custom circular marker for churches
const createChurchMarker = (profilePictureUrl, churchName) => {
  const markerHtml = profilePictureUrl
    ? `<div style="
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 3px solid #ffffff;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        background-image: url('${profilePictureUrl}');
        background-size: cover;
        background-position: center;
        background-color: #f3f4f6;
      "></div>`
    : `<div style="
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 3px solid #ffffff;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        background-color: #3b82f6;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        font-weight: bold;
        color: white;
      ">${churchName.charAt(0)}</div>`

  return L.divIcon({
    html: markerHtml,
    className: 'custom-church-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  })
}

// Create custom marker for user location
const createUserMarker = () => {
  const markerHtml = `<div style="
    position: relative;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  ">
    <div style="
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 3px solid #ffffff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      background-color: #ef4444;
      position: relative;
      z-index: 2;
    "></div>
    <div style="
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 2px solid #ef4444;
      background-color: rgba(239, 68, 68, 0.2);
      position: absolute;
      top: 0;
      left: 0;
      animation: pulse 2s infinite;
      z-index: 1;
    "></div>
  </div>`

  return L.divIcon({
    html: markerHtml,
    className: 'custom-user-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  })
}

const MapComponent = () => {
  const router = useRouter()
  const [churches, setChurches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const [locationError, setLocationError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedChurch, setSelectedChurch] = useState(null)
  const [churchImages, setChurchImages] = useState({})

  // Get user's current location
  useEffect(() => {
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
            setLocationError('Unable to access location')
            // Fallback to a default location (Manila, Philippines)
            setUserLocation({
              lat: 14.5995,
              lng: 120.9842
            })
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          }
        )
      } else {
        setLocationError('Geolocation not supported')
        // Fallback to default location
        setUserLocation({
          lat: 14.5995,
          lng: 120.9842
        })
      }
    }

    getUserLocation()
  }, [])

  useEffect(() => {
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
      } catch (err) {
        console.error('Error fetching churches:', err)
        setError('Failed to load churches')
      } finally {
        setLoading(false)
      }
    }

    fetchChurches()
  }, [])

  const handleReceiveSacrament = (church) => {
    setSelectedChurch(church)
    setIsModalOpen(true)
  }

  const handleBecomeMember = (church) => {
    router.push(`/church/${church.ChurchID}/become-member`);
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedChurch(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading churches...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
        <div className="text-center">
          <p className="text-red-600 mb-2">⚠️ {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (churches.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
        <div className="text-center">
          <p className="text-gray-600">No public churches available</p>
        </div>
      </div>
    )
  }

  // Use user location as center, fallback to church average if no user location
  const mapCenter = userLocation
    ? [userLocation.lat, userLocation.lng]
    : churches.length > 0
    ? [churches.reduce((sum, church) => sum + parseFloat(church.Latitude), 0) / churches.length,
       churches.reduce((sum, church) => sum + parseFloat(church.Longitude), 0) / churches.length]
    : [14.5995, 120.9842] // Default fallback
  
  // Wait for user location to be determined
  if (!userLocation && !locationError) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Getting your location...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="w-full h-full rounded-lg overflow-hidden shadow-md">
      {locationError && (
        <div className="mb-2 p-2 bg-yellow-100 border border-yellow-400 text-yellow-700 text-xs rounded">
          ℹ️ {locationError} - Using default location
        </div>
      )}
      <MapContainer
        center={mapCenter}
        zoom={userLocation ? 12 : 10}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* User Location Marker */}
        {userLocation && !locationError && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={createUserMarker()}
          >
            <Popup className="custom-popup">
              <div className="p-2 text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white font-bold mr-2">
                    📍
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Your Location</h3>
                  </div>
                </div>
                <p className="text-gray-600 text-sm">
                  You are here
                </p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {churches.map((church) => (
          <Marker
            key={church.ChurchID}
            position={[parseFloat(church.Latitude), parseFloat(church.Longitude)]}
            icon={createChurchMarker(churchImages[church.ChurchID], church.ChurchName)}
          >
            <Popup className="custom-popup" maxWidth={250}>
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                {/* Church Header */}
                <div className="flex items-center p-4 border-b border-gray-200">
                  {churchImages[church.ChurchID] ? (
                    <img 
                      src={churchImages[church.ChurchID]}
                      alt={church.ChurchName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 mr-3"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold mr-3">
                      {church.ChurchName.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900">{church.ChurchName}</h3>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="p-4 space-y-2">
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleReceiveSacrament(church);
                    }}
                    className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer"
                  >
                    Send Request
                  </button>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleBecomeMember(church);
                    }}
                    className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer"
                  >
                    Membership
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Sacrament Application Modal */}
      <SacramentApplicationModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        church={selectedChurch}
      />
      
      <style jsx global>{`
        .custom-church-marker {
          background: none !important;
          border: none !important;
        }
        
        .custom-user-marker {
          background: none !important;
          border: none !important;
        }
        
        .leaflet-popup-content-wrapper {
          border-radius: 0.5rem !important;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1) !important;
          border: 1px solid #e5e7eb !important;
          background: white !important;
          padding: 0 !important;
        }
        
        .leaflet-popup-content {
          margin: 0 !important;
          border-radius: 0.5rem !important;
          overflow: hidden;
        }
        
        .leaflet-popup-tip {
          background: white !important;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1) !important;
        }
        
        .leaflet-popup-close-button {
          background: rgba(255,255,255,0.9) !important;
          border-radius: 50% !important;
          width: 28px !important;
          height: 28px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          top: 8px !important;
          right: 8px !important;
          color: #6b7280 !important;
          font-size: 18px !important;
          font-weight: bold !important;
          text-decoration: none !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
          transition: all 0.2s ease !important;
        }
        
        .leaflet-popup-close-button:hover {
          background: white !important;
          color: #ef4444 !important;
          transform: scale(1.1) !important;
        }
        
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.7;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}

export default MapComponent
