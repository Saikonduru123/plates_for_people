import React, { useState, useEffect, useRef } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardContent,
  IonButton,
  IonInput,
  IonTextarea,
  IonSpinner,
  IonToast,
  IonToggle,
  IonLabel,
  IonItem,
  useIonRouter,
} from '@ionic/react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ngoService } from '../../services/ngoService';
import type { NGOLocation, CreateLocationFormData } from '../../types';
import './AddEditLocation.css';

// Fix for default marker icon in Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface FormData {
  location_name: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  country: string;
  zip_code: string;
  latitude: string;
  longitude: string;
  contact_person: string;
  contact_phone: string;
  operating_hours: string;
  default_breakfast_capacity: string;
  default_lunch_capacity: string;
  default_snacks_capacity: string;
  default_dinner_capacity: string;
}

interface FormErrors {
  location_name?: string;
  address_line1?: string;
  city?: string;
  state?: string;
  country?: string;
  zip_code?: string;
  latitude?: string;
  longitude?: string;
  contact_phone?: string;
}

const AddEditLocation: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const router = useIonRouter();
  const isEditMode = !!id;

  const [formData, setFormData] = useState<FormData>({
    location_name: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    country: '',
    zip_code: '',
    latitude: '',
    longitude: '',
    contact_person: '',
    contact_phone: '',
    operating_hours: '',
    default_breakfast_capacity: '100',
    default_lunch_capacity: '200',
    default_snacks_capacity: '50',
    default_dinner_capacity: '150',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(isEditMode);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger' | 'warning'>('success');
  const [useMapPicker, setUseMapPicker] = useState(false);
  const [mapPosition, setMapPosition] = useState<[number, number]>([20.5937, 78.9629]); // Default: India center
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      loadLocation();
    } else {
      // Try to get user's current location for new locations
      getCurrentLocation();
    }
  }, [id]);

  const loadLocation = async () => {
    try {
      const locations = await ngoService.getLocations();
      const location = locations.find((loc: NGOLocation) => loc.id === parseInt(id));

      if (location) {
        setFormData({
          location_name: location.location_name || '',
          address_line1: location.address_line1 || '',
          address_line2: location.address_line2 || '',
          city: location.city || '',
          state: location.state || '',
          country: location.country || '',
          zip_code: location.zip_code || '',
          latitude: location.latitude?.toString() || '',
          longitude: location.longitude?.toString() || '',
          contact_person: location.contact_person || '',
          contact_phone: location.contact_phone || '',
          operating_hours: location.operating_hours || '',
          default_breakfast_capacity: location.default_breakfast_capacity?.toString() || '',
          default_lunch_capacity: location.default_lunch_capacity?.toString() || '',
          default_snacks_capacity: location.default_snacks_capacity?.toString() || '',
          default_dinner_capacity: location.default_dinner_capacity?.toString() || '',
        });

        // Set map position and marker if coordinates exist
        if (location.latitude && location.longitude) {
          const lat = location.latitude;
          const lng = location.longitude;
          setMapPosition([lat, lng]);
          setMarkerPosition([lat, lng]);
        }
      } else {
        showToastMessage('Location not found', 'danger');
        router.push('/ngo/locations', 'back');
      }
    } catch (error: any) {
      console.error('Error loading location:', error);
      showToastMessage('Failed to load location', 'danger');
      router.push('/ngo/locations', 'back');
    } finally {
      setLoadingLocation(false);
    }
  };

  const getCurrentLocation = () => {
    if ('geolocation' in navigator) {
      setGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapPosition([latitude, longitude]);
          setMarkerPosition([latitude, longitude]);
          setFormData((prev) => ({
            ...prev,
            latitude: latitude.toFixed(6),
            longitude: longitude.toFixed(6),
          }));
          setGettingLocation(false);

          // Also fetch address for current location
          reverseGeocode(latitude, longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
          setGettingLocation(false);
          showToastMessage('Could not get your location. Please select manually.', 'warning');
        },
      );
    } else {
      showToastMessage('Geolocation is not supported by your browser', 'danger');
    }
  };

  const handleMapPinDrop = (lat: number, lng: number) => {
    setMarkerPosition([lat, lng]);
    setFormData((prev) => ({
      ...prev,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
    }));

    // Reverse geocode to get address (optional enhancement)
    reverseGeocode(lat, lng);
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      // Use our backend proxy to avoid CORS and User-Agent issues
      const response = await fetch(`http://localhost:8000/api/geocoding/reverse?lat=${lat}&lon=${lng}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Reverse geocode response:', data); // Debug log

        if (data) {
          // Auto-fill address fields if they're empty
          setFormData((prev) => ({
            ...prev,
            address_line1: prev.address_line1 || data.address_line1 || '',
            city: prev.city || data.city || '',
            state: prev.state || data.state || '',
            country: prev.country || data.country || '',
            zip_code: prev.zip_code || data.zip_code || '',
          }));

          showToastMessage('Address details auto-filled from map location', 'success');
        } else {
          console.warn('No address data in response');
          showToastMessage('Location selected. Please enter address details manually.', 'warning');
        }
      } else if (response.status === 404) {
        console.warn('No address found for coordinates');
        showToastMessage('Coordinates saved. Please enter address manually.', 'warning');
      } else {
        console.error('Reverse geocoding HTTP error:', response.status, response.statusText);
        showToastMessage('Could not fetch address. Please enter manually.', 'warning');
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      showToastMessage('Coordinates saved. Please enter address manually.', 'warning');
    }
  };

  const reverseGeocodeAlternative = async (lat: number, lng: number) => {
    // No longer needed - using backend proxy
    console.log('Alternative geocoding not needed with backend proxy');
  };

  const handleUseCurrentLocation = () => {
    getCurrentLocation();
  };

  // Component for handling map clicks
  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        handleMapPinDrop(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  };

  const showToastMessage = (message: string, color: 'success' | 'danger' | 'warning') => {
    setToastMessage(message);
    setToastColor(color);
    setShowToast(true);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required fields
    if (!formData.location_name.trim()) {
      newErrors.location_name = 'Location name is required';
    }
    if (!formData.address_line1.trim()) {
      newErrors.address_line1 = 'Address is required';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }
    if (!formData.country.trim()) {
      newErrors.country = 'Country is required';
    }
    if (!formData.zip_code.trim()) {
      newErrors.zip_code = 'ZIP code is required';
    }

    // Latitude validation
    if (!formData.latitude.trim()) {
      newErrors.latitude = 'Latitude is required';
    } else {
      const lat = parseFloat(formData.latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        newErrors.latitude = 'Latitude must be between -90 and 90';
      }
    }

    // Longitude validation
    if (!formData.longitude.trim()) {
      newErrors.longitude = 'Longitude is required';
    } else {
      const lon = parseFloat(formData.longitude);
      if (isNaN(lon) || lon < -180 || lon > 180) {
        newErrors.longitude = 'Longitude must be between -180 and 180';
      }
    }

    // Phone validation (optional field)
    if (formData.contact_phone.trim()) {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(formData.contact_phone)) {
        newErrors.contact_phone = 'Invalid phone number format';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field as keyof FormErrors];
        return newErrors;
      });
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showToastMessage('Please fix the errors in the form', 'danger');
      return;
    }

    setLoading(true);
    try {
      const locationData: CreateLocationFormData = {
        location_name: formData.location_name.trim(),
        address_line1: formData.address_line1.trim(),
        address_line2: formData.address_line2.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        country: formData.country.trim(),
        zip_code: formData.zip_code.trim(),
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        contact_person: formData.contact_person.trim() || '',
        contact_phone: formData.contact_phone.trim() || '',
        operating_hours: formData.operating_hours.trim() || '',
        default_breakfast_capacity: parseInt(formData.default_breakfast_capacity) || 0,
        default_lunch_capacity: parseInt(formData.default_lunch_capacity) || 0,
        default_snacks_capacity: parseInt(formData.default_snacks_capacity) || 0,
        default_dinner_capacity: parseInt(formData.default_dinner_capacity) || 0,
      };

      if (isEditMode) {
        await ngoService.updateLocation(parseInt(id), locationData);
        showToastMessage('Location updated successfully!', 'success');
      } else {
        await ngoService.createLocation(locationData);
        showToastMessage('Location created successfully!', 'success');
      }

      // Navigate back after a short delay
      setTimeout(() => {
        router.push('/ngo/locations', 'back');
      }, 1000);
    } catch (error: any) {
      console.error('Error saving location:', error);
      showToastMessage(error.response?.data?.detail || `Failed to ${isEditMode ? 'update' : 'create'} location`, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/ngo/locations', 'back');
  };

  if (loadingLocation) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/ngo/locations" />
            </IonButtons>
            <IonTitle>Edit Location</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <p>Loading location...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/ngo/locations" />
          </IonButtons>
          <IonTitle>{isEditMode ? 'Edit Location' : 'Add Location'}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="add-edit-location-container">
          <IonCard>
            <IonCardContent>
              {/* Location Name */}
              <div className="form-group">
                <label className="form-label required">Location Name</label>
                <IonInput
                  value={formData.location_name}
                  onIonInput={(e) => handleInputChange('location_name', e.detail.value || '')}
                  placeholder="e.g., Main Distribution Center"
                  className={errors.location_name ? 'input-error' : ''}
                  disabled={loading}
                />
                {errors.location_name && <p className="error-text">{errors.location_name}</p>}
              </div>

              {/* Address Line 1 */}
              <div className="form-group">
                <label className="form-label required">Address Line 1</label>
                <IonInput
                  value={formData.address_line1}
                  onIonInput={(e) => handleInputChange('address_line1', e.detail.value || '')}
                  placeholder="Street address"
                  className={errors.address_line1 ? 'input-error' : ''}
                  disabled={loading}
                />
                {errors.address_line1 && <p className="error-text">{errors.address_line1}</p>}
              </div>

              {/* Address Line 2 */}
              <div className="form-group">
                <label className="form-label">Address Line 2</label>
                <IonInput
                  value={formData.address_line2}
                  onIonInput={(e) => handleInputChange('address_line2', e.detail.value || '')}
                  placeholder="Apt, suite, building (optional)"
                  disabled={loading}
                />
              </div>

              {/* City, State */}
              <div className="form-row">
                <div className="form-group form-group-half">
                  <label className="form-label required">City</label>
                  <IonInput
                    value={formData.city}
                    onIonInput={(e) => handleInputChange('city', e.detail.value || '')}
                    placeholder="City"
                    className={errors.city ? 'input-error' : ''}
                    disabled={loading}
                  />
                  {errors.city && <p className="error-text">{errors.city}</p>}
                </div>
                <div className="form-group form-group-half">
                  <label className="form-label required">State</label>
                  <IonInput
                    value={formData.state}
                    onIonInput={(e) => handleInputChange('state', e.detail.value || '')}
                    placeholder="State"
                    className={errors.state ? 'input-error' : ''}
                    disabled={loading}
                  />
                  {errors.state && <p className="error-text">{errors.state}</p>}
                </div>
              </div>

              {/* Country, ZIP */}
              <div className="form-row">
                <div className="form-group form-group-half">
                  <label className="form-label required">Country</label>
                  <IonInput
                    value={formData.country}
                    onIonInput={(e) => handleInputChange('country', e.detail.value || '')}
                    placeholder="Country"
                    className={errors.country ? 'input-error' : ''}
                    disabled={loading}
                  />
                  {errors.country && <p className="error-text">{errors.country}</p>}
                </div>
                <div className="form-group form-group-half">
                  <label className="form-label required">ZIP Code</label>
                  <IonInput
                    value={formData.zip_code}
                    onIonInput={(e) => handleInputChange('zip_code', e.detail.value || '')}
                    placeholder="ZIP"
                    className={errors.zip_code ? 'input-error' : ''}
                    disabled={loading}
                  />
                  {errors.zip_code && <p className="error-text">{errors.zip_code}</p>}
                </div>
              </div>

              {/* Coordinates Section */}
              <div className="section-header">
                <h3>Coordinates</h3>
                <p className="section-description">Latitude and longitude help donors find your location on the map</p>
              </div>

              {/* Latitude, Longitude */}
              <div className="form-row">
                <div className="form-group form-group-half">
                  <label className="form-label required">Latitude</label>
                  <IonInput
                    type="number"
                    value={formData.latitude}
                    onIonInput={(e) => handleInputChange('latitude', e.detail.value || '')}
                    placeholder="-90 to 90"
                    className={errors.latitude ? 'input-error' : ''}
                    disabled={loading}
                  />
                  {errors.latitude && <p className="error-text">{errors.latitude}</p>}
                </div>
                <div className="form-group form-group-half">
                  <label className="form-label required">Longitude</label>
                  <IonInput
                    type="number"
                    value={formData.longitude}
                    onIonInput={(e) => handleInputChange('longitude', e.detail.value || '')}
                    placeholder="-180 to 180"
                    className={errors.longitude ? 'input-error' : ''}
                    disabled={loading}
                  />
                  {errors.longitude && <p className="error-text">{errors.longitude}</p>}
                </div>
              </div>

              {/* Map Picker Toggle */}
              <IonItem lines="none" className="map-toggle-item">
                <IonLabel>Use Map to Pick Location</IonLabel>
                <IonToggle checked={useMapPicker} onIonChange={(e) => setUseMapPicker(e.detail.checked)} disabled={loading} />
              </IonItem>

              {/* Map Picker */}
              {useMapPicker && (
                <div className="map-picker-container">
                  <div className="map-instructions">
                    <p>
                      <strong>📍 Click on the map to drop a pin</strong> at your location. The coordinates will be auto-filled and address details
                      will be suggested.
                    </p>
                    <IonButton size="small" fill="outline" onClick={handleUseCurrentLocation} disabled={gettingLocation}>
                      {gettingLocation ? (
                        <>
                          <IonSpinner name="crescent" />
                          <span style={{ marginLeft: '8px' }}>Getting location...</span>
                        </>
                      ) : (
                        '📍 Use My Current Location'
                      )}
                    </IonButton>
                  </div>

                  <div className="map-wrapper">
                    <MapContainer
                      center={mapPosition}
                      zoom={13}
                      style={{ height: '400px', width: '100%', borderRadius: '8px' }}
                      key={`${mapPosition[0]}-${mapPosition[1]}`}>
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <MapClickHandler />
                      {markerPosition && <Marker position={markerPosition} />}
                    </MapContainer>
                  </div>

                  {markerPosition && (
                    <div className="map-coordinates-display">
                      <p>
                        <strong>Selected Location:</strong> {markerPosition[0].toFixed(6)}, {markerPosition[1].toFixed(6)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {!useMapPicker && (
                <div className="coordinates-help">
                  <p>
                    <strong>Tip:</strong> Enable "Use Map to Pick Location" above to visually select your location, or you can find coordinates using{' '}
                    <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer">
                      Google Maps
                    </a>
                    . Right-click on your location and select "What's here?"
                  </p>
                </div>
              )}

              {/* Default Meal Capacities Section */}
              <div className="section-header">
                <h3>Default Meal Capacities</h3>
                <p className="section-description">Set default daily capacity for each meal type. You can override these for specific dates later.</p>
              </div>

              {/* Breakfast & Lunch Capacity */}
              <div className="form-row">
                <div className="form-group form-group-half">
                  <label className="form-label">🌅 Breakfast Capacity</label>
                  <IonInput
                    type="number"
                    value={formData.default_breakfast_capacity}
                    onIonInput={(e) => handleInputChange('default_breakfast_capacity', e.detail.value || '0')}
                    placeholder="100"
                    min="0"
                    disabled={loading}
                  />
                  <p className="help-text">Meals per day</p>
                </div>
                <div className="form-group form-group-half">
                  <label className="form-label">☀️ Lunch Capacity</label>
                  <IonInput
                    type="number"
                    value={formData.default_lunch_capacity}
                    onIonInput={(e) => handleInputChange('default_lunch_capacity', e.detail.value || '0')}
                    placeholder="200"
                    min="0"
                    disabled={loading}
                  />
                  <p className="help-text">Meals per day</p>
                </div>
              </div>

              {/* Snacks & Dinner Capacity */}
              <div className="form-row">
                <div className="form-group form-group-half">
                  <label className="form-label">🥤 Snacks Capacity</label>
                  <IonInput
                    type="number"
                    value={formData.default_snacks_capacity}
                    onIonInput={(e) => handleInputChange('default_snacks_capacity', e.detail.value || '0')}
                    placeholder="50"
                    min="0"
                    disabled={loading}
                  />
                  <p className="help-text">Meals per day</p>
                </div>
                <div className="form-group form-group-half">
                  <label className="form-label">🌙 Dinner Capacity</label>
                  <IonInput
                    type="number"
                    value={formData.default_dinner_capacity}
                    onIonInput={(e) => handleInputChange('default_dinner_capacity', e.detail.value || '0')}
                    placeholder="150"
                    min="0"
                    disabled={loading}
                  />
                  <p className="help-text">Meals per day</p>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="section-header">
                <h3>Contact Information</h3>
                <p className="section-description">Optional contact details for this location</p>
              </div>

              {/* Contact Person */}
              <div className="form-group">
                <label className="form-label">Contact Person</label>
                <IonInput
                  value={formData.contact_person}
                  onIonInput={(e) => handleInputChange('contact_person', e.detail.value || '')}
                  placeholder="Name of contact person"
                  disabled={loading}
                />
              </div>

              {/* Contact Phone */}
              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                <IonInput
                  type="tel"
                  value={formData.contact_phone}
                  onIonInput={(e) => handleInputChange('contact_phone', e.detail.value || '')}
                  placeholder="+1 (555) 123-4567"
                  className={errors.contact_phone ? 'input-error' : ''}
                  disabled={loading}
                />
                {errors.contact_phone && <p className="error-text">{errors.contact_phone}</p>}
              </div>

              {/* Operating Hours */}
              <div className="form-group">
                <label className="form-label">Operating Hours</label>
                <IonTextarea
                  value={formData.operating_hours}
                  onIonInput={(e) => handleInputChange('operating_hours', e.detail.value || '')}
                  placeholder="e.g., Mon-Fri: 9AM-5PM, Sat: 10AM-2PM"
                  rows={3}
                  disabled={loading}
                />
              </div>

              {/* Form Actions */}
              <div className="form-actions">
                <IonButton expand="block" color="medium" fill="outline" onClick={handleCancel} disabled={loading}>
                  Cancel
                </IonButton>
                <IonButton expand="block" onClick={handleSubmit} disabled={loading}>
                  {loading ? (
                    <>
                      <IonSpinner name="crescent" />
                      <span style={{ marginLeft: '8px' }}>{isEditMode ? 'Updating...' : 'Creating...'}</span>
                    </>
                  ) : (
                    <span>{isEditMode ? 'Update Location' : 'Create Location'}</span>
                  )}
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        color={toastColor}
        position="top"
      />
    </IonPage>
  );
};

export default AddEditLocation;
