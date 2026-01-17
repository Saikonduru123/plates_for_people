import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonModal,
  IonInput,
  IonTextarea,
  IonToast,
  IonIcon,
  IonChip,
  useIonRouter,
} from '@ionic/react';
import {
  chevronBackOutline,
  chevronForwardOutline,
  addOutline,
  calendarOutline,
  peopleOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
} from 'ionicons/icons';
import { ngoService } from '../../services/ngoService';
import type { NGOLocation, NGOLocationCapacity, SetCapacityFormData } from '../../types';
import './ManageCapacity.css';

interface CalendarDay {
  date: Date;
  dateString: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  capacity?: NGOLocationCapacity;
}

const ManageCapacity: React.FC = () => {
  const router = useIonRouter();
  const [locations, setLocations] = useState<NGOLocation[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [capacityData, setCapacityData] = useState<Map<string, NGOLocationCapacity>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [formData, setFormData] = useState<SetCapacityFormData>({
    date: '',
    max_capacity: 0,
    notes: '',
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('success');

  useEffect(() => {
    loadLocations();
  }, []);

  useEffect(() => {
    if (selectedLocationId) {
      loadCapacityData();
    }
  }, [selectedLocationId, currentDate]);

  useEffect(() => {
    generateCalendar();
  }, [currentDate, capacityData]);

  const loadLocations = async () => {
    try {
      const data = await ngoService.getLocations();
      const activeLocations = data.filter((loc) => loc.is_active);
      setLocations(activeLocations);
      if (activeLocations.length > 0 && !selectedLocationId) {
        setSelectedLocationId(activeLocations[0].id);
      }
    } catch (error: any) {
      console.error('Error loading locations:', error);
      showToastMessage('Failed to load locations', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const loadCapacityData = async () => {
    if (!selectedLocationId) return;

    setLoading(true);
    try {
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const startDateString = formatDate(startDate);
      const endDateString = formatDate(endDate);

      const capacities = await ngoService.getCapacityRange(
        selectedLocationId,
        startDateString,
        endDateString
      );

      const capacityMap = new Map<string, NGOLocationCapacity>();
      capacities.forEach((cap) => {
        capacityMap.set(cap.date, cap);
      });
      setCapacityData(capacityMap);
    } catch (error: any) {
      console.error('Error loading capacity data:', error);
      showToastMessage('Failed to load capacity data', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      const dateString = formatDate(date);
      days.push({
        date,
        dateString,
        isCurrentMonth: false,
        isToday: false,
        capacity: capacityData.get(dateString),
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = formatDate(date);
      const isToday = date.getTime() === today.getTime();
      days.push({
        date,
        dateString,
        isCurrentMonth: true,
        isToday,
        capacity: capacityData.get(dateString),
      });
    }

    // Next month days to complete the grid
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      const dateString = formatDate(date);
      days.push({
        date,
        dateString,
        isCurrentMonth: false,
        isToday: false,
        capacity: capacityData.get(dateString),
      });
    }

    setCalendarDays(days);
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const showToastMessage = (message: string, color: 'success' | 'danger') => {
    setToastMessage(message);
    setToastColor(color);
    setShowToast(true);
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (day: CalendarDay) => {
    if (!day.isCurrentMonth) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (day.date < today) {
      showToastMessage('Cannot set capacity for past dates', 'danger');
      return;
    }

    setSelectedDay(day);
    setFormData({
      date: day.dateString,
      max_capacity: day.capacity?.max_capacity || 0,
      notes: day.capacity?.notes || '',
    });
    setShowModal(true);
  };

  const handleSaveCapacity = async () => {
    if (!selectedLocationId || !selectedDay) return;

    if (formData.max_capacity <= 0) {
      showToastMessage('Capacity must be greater than 0', 'danger');
      return;
    }

    setLoading(true);
    try {
      if (selectedDay.capacity) {
        // Update existing capacity
        await ngoService.updateCapacity(selectedLocationId, selectedDay.dateString, {
          max_capacity: formData.max_capacity,
          notes: formData.notes || undefined,
        });
        showToastMessage('Capacity updated successfully!', 'success');
      } else {
        // Create new capacity
        await ngoService.setCapacity(selectedLocationId, {
          date: formData.date,
          max_capacity: formData.max_capacity,
          notes: formData.notes || undefined,
        });
        showToastMessage('Capacity set successfully!', 'success');
      }

      setShowModal(false);
      await loadCapacityData();
    } catch (error: any) {
      console.error('Error saving capacity:', error);
      showToastMessage(
        error.response?.data?.detail || 'Failed to save capacity',
        'danger'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (event: CustomEvent) => {
    await loadCapacityData();
    event.detail.complete();
  };

  const getMonthName = (): string => {
    return currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const getCapacityStatus = (capacity?: NGOLocationCapacity): string => {
    if (!capacity) return 'not-set';
    const utilization = capacity.current_bookings / capacity.max_capacity;
    if (utilization >= 1) return 'full';
    if (utilization >= 0.8) return 'high';
    if (utilization >= 0.5) return 'medium';
    return 'low';
  };

  const renderCapacityIndicator = (day: CalendarDay) => {
    if (!day.isCurrentMonth || !day.capacity) return null;

    const status = getCapacityStatus(day.capacity);
    return (
      <div className={`capacity-indicator ${status}`}>
        <span className="capacity-text">
          {day.capacity.current_bookings}/{day.capacity.max_capacity}
        </span>
      </div>
    );
  };

  if (loading && locations.length === 0) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/ngo/dashboard" />
            </IonButtons>
            <IonTitle>Manage Capacity</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <p>Loading locations...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (locations.length === 0) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/ngo/dashboard" />
            </IonButtons>
            <IonTitle>Manage Capacity</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="empty-state">
            <IonIcon icon={calendarOutline} className="empty-icon" />
            <h3>No Active Locations</h3>
            <p>
              You need to have at least one active location before you can manage capacity.
              <br />
              Add a location first to get started.
            </p>
            <IonButton routerLink="/ngo/locations/add" color="primary">
              <IonIcon slot="start" icon={addOutline} />
              Add Location
            </IonButton>
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
            <IonBackButton defaultHref="/ngo/dashboard" />
          </IonButtons>
          <IonTitle>Manage Capacity</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="manage-capacity-container">
          {/* Location Selector */}
          <IonCard>
            <IonCardContent>
              <div className="location-selector">
                <label className="selector-label">Select Location</label>
                <IonSelect
                  value={selectedLocationId}
                  onIonChange={(e) => setSelectedLocationId(e.detail.value)}
                  interface="popover"
                  placeholder="Choose a location"
                >
                  {locations.map((location) => (
                    <IonSelectOption key={location.id} value={location.id}>
                      {location.location_name}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </div>
            </IonCardContent>
          </IonCard>

          {/* Calendar Controls */}
          <IonCard>
            <IonCardHeader>
              <div className="calendar-header">
                <IonButton fill="clear" onClick={handlePreviousMonth}>
                  <IonIcon slot="icon-only" icon={chevronBackOutline} />
                </IonButton>
                <IonCardTitle className="month-title">{getMonthName()}</IonCardTitle>
                <IonButton fill="clear" onClick={handleNextMonth}>
                  <IonIcon slot="icon-only" icon={chevronForwardOutline} />
                </IonButton>
              </div>
              <div className="calendar-actions">
                <IonButton size="small" fill="outline" onClick={handleToday}>
                  Today
                </IonButton>
              </div>
            </IonCardHeader>

            <IonCardContent>
              {/* Legend */}
              <div className="capacity-legend">
                <div className="legend-item">
                  <div className="legend-indicator not-set"></div>
                  <span>Not Set</span>
                </div>
                <div className="legend-item">
                  <div className="legend-indicator low"></div>
                  <span>Low (&lt;50%)</span>
                </div>
                <div className="legend-item">
                  <div className="legend-indicator medium"></div>
                  <span>Medium (50-80%)</span>
                </div>
                <div className="legend-item">
                  <div className="legend-indicator high"></div>
                  <span>High (80-100%)</span>
                </div>
                <div className="legend-item">
                  <div className="legend-indicator full"></div>
                  <span>Full</span>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="calendar-grid">
                {/* Day headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="calendar-day-header">
                    {day}
                  </div>
                ))}

                {/* Calendar days */}
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${
                      day.isToday ? 'today' : ''
                    } ${getCapacityStatus(day.capacity)}`}
                    onClick={() => handleDayClick(day)}
                  >
                    <div className="day-number">{day.date.getDate()}</div>
                    {renderCapacityIndicator(day)}
                  </div>
                ))}
              </div>
            </IonCardContent>
          </IonCard>

          {/* Instructions */}
          <IonCard className="info-card">
            <IonCardContent>
              <div className="info-content">
                <IonIcon icon={alertCircleOutline} className="info-icon" />
                <div className="info-text">
                  <strong>Tip:</strong> Click on any future date to set or update capacity.
                  The color indicates how full each day is based on current bookings.
                </div>
              </div>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>

      {/* Set Capacity Modal */}
      <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>
              {selectedDay?.capacity ? 'Update Capacity' : 'Set Capacity'}
            </IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowModal(false)}>Close</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="modal-content">
            {selectedDay && (
              <>
                <div className="modal-date">
                  <IonIcon icon={calendarOutline} />
                  <span>{selectedDay.date.toLocaleDateString('default', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}</span>
                </div>

                {selectedDay.capacity && (
                  <div className="current-bookings">
                    <IonIcon icon={peopleOutline} />
                    <span>
                      Current Bookings: {selectedDay.capacity.current_bookings}
                    </span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label required">Maximum Capacity</label>
                  <IonInput
                    type="number"
                    value={formData.max_capacity}
                    onIonInput={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        max_capacity: parseInt(e.detail.value || '0'),
                      }))
                    }
                    placeholder="Enter maximum capacity"
                    min="1"
                  />
                  <p className="helper-text">
                    Maximum number of donations this location can accept on this date
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <IonTextarea
                    value={formData.notes}
                    onIonInput={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        notes: e.detail.value || '',
                      }))
                    }
                    placeholder="Optional notes (e.g., special events, holidays)"
                    rows={3}
                  />
                </div>

                <IonButton
                  expand="block"
                  onClick={handleSaveCapacity}
                  disabled={loading}
                  className="save-button"
                >
                  {loading ? (
                    <>
                      <IonSpinner name="crescent" />
                      <span style={{ marginLeft: '8px' }}>Saving...</span>
                    </>
                  ) : (
                    <>
                      <IonIcon slot="start" icon={checkmarkCircleOutline} />
                      {selectedDay.capacity ? 'Update Capacity' : 'Set Capacity'}
                    </>
                  )}
                </IonButton>
              </>
            )}
          </div>
        </IonContent>
      </IonModal>

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

export default ManageCapacity;
