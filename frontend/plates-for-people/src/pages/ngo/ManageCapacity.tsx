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
  IonSegment,
  IonSegmentButton,
  IonLabel,
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
import {
  getCapacity,
  setCapacity,
  deleteCapacity,
  formatMealType,
  getMealTypeIcon,
  type MealType,
  type MealTypeCapacity,
} from '../../services/capacityService';
import type { NGOLocation } from '../../types';
import './ManageCapacity.css';

interface CalendarDay {
  date: Date;
  dateString: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  capacity?: MealTypeCapacity;
}

const ManageCapacity: React.FC = () => {
  const router = useIonRouter();
  const [locations, setLocations] = useState<NGOLocation[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('breakfast');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [capacityData, setCapacityData] = useState<Map<string, MealTypeCapacity>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [formCapacity, setFormCapacity] = useState<number>(0);
  const [formNotes, setFormNotes] = useState<string>('');
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
  }, [selectedLocationId, currentDate, selectedMealType]);

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
      const daysInMonth = endDate.getDate();

      const capacityMap = new Map<string, MealTypeCapacity>();

      // Load capacity for each day in the month
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dateString = formatDate(date);

        try {
          const token = localStorage.getItem('accessToken') || undefined;
          const capacityData = (await getCapacity(selectedLocationId, dateString, selectedMealType, token)) as MealTypeCapacity;

          capacityMap.set(dateString, capacityData);
        } catch (error) {
          // If no capacity set for this date, skip silently
          console.debug(`No capacity for ${dateString}`);
        }
      }

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
    setFormCapacity(day.capacity?.capacity || 0);
    setFormNotes(day.capacity?.notes || '');
    setShowModal(true);
  };

  const handleSaveCapacity = async () => {
    if (!selectedLocationId || !selectedDay) return;

    if (formCapacity <= 0) {
      showToastMessage('Capacity must be greater than 0', 'danger');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        showToastMessage('Authentication required. Please login again.', 'danger');
        setLoading(false);
        return;
      }

      console.log(
        'Saving capacity for location:',
        selectedLocationId,
        'date:',
        selectedDay.dateString,
        'meal:',
        selectedMealType,
        'capacity:',
        formCapacity,
      );

      await setCapacity(
        selectedLocationId,
        {
          date: selectedDay.dateString,
          meal_type: selectedMealType,
          capacity: formCapacity,
          notes: formNotes || undefined,
        },
        token,
      );

      showToastMessage('Capacity set successfully!', 'success');

      setShowModal(false);
      await loadCapacityData();
    } catch (error: any) {
      console.error('Error saving capacity:', error);
      const status = error.response?.status;
      const detail = error.response?.data?.detail;

      let errorMessage = 'Failed to save capacity';
      if (status === 404) {
        errorMessage = 'Location not found or does not belong to your organization';
      } else if (status === 401 || status === 403) {
        errorMessage = 'Authentication required. Please login again.';
      } else if (detail) {
        errorMessage = detail;
      }

      showToastMessage(errorMessage, 'danger');
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

  const getCapacityStatus = (capacity?: MealTypeCapacity): string => {
    if (!capacity) return 'not-set';
    const available = capacity.available || 0;
    const total = capacity.capacity || 0;
    if (total === 0) return 'not-set';
    const utilization = (total - available) / total;
    if (utilization >= 1) return 'full';
    if (utilization >= 0.8) return 'high';
    if (utilization >= 0.5) return 'medium';
    return 'low';
  };

  const renderCapacityIndicator = (day: CalendarDay) => {
    if (!day.isCurrentMonth || !day.capacity) return null;

    const status = getCapacityStatus(day.capacity);
    const confirmed = (day.capacity.capacity || 0) - (day.capacity.available || 0);
    return (
      <div className={`capacity-indicator ${status}`}>
        <span className="capacity-text">
          {confirmed}/{day.capacity.capacity}
        </span>
        {day.capacity.is_manual && <span className="manual-badge">M</span>}
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
                  placeholder="Choose a location">
                  {locations.map((location) => (
                    <IonSelectOption key={location.id} value={location.id}>
                      {location.location_name}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </div>
            </IonCardContent>
          </IonCard>

          {/* Meal Type Selector */}
          <IonCard>
            <IonCardContent>
              <div className="meal-type-selector">
                <label className="selector-label">Meal Type</label>
                <IonSegment value={selectedMealType} onIonChange={(e) => setSelectedMealType(e.detail.value as MealType)} scrollable>
                  <IonSegmentButton value="breakfast">
                    <IonLabel>{getMealTypeIcon('breakfast')} Breakfast</IonLabel>
                  </IonSegmentButton>
                  <IonSegmentButton value="lunch">
                    <IonLabel>{getMealTypeIcon('lunch')} Lunch</IonLabel>
                  </IonSegmentButton>
                  <IonSegmentButton value="snacks">
                    <IonLabel>{getMealTypeIcon('snacks')} Snacks</IonLabel>
                  </IonSegmentButton>
                  <IonSegmentButton value="dinner">
                    <IonLabel>{getMealTypeIcon('dinner')} Dinner</IonLabel>
                  </IonSegmentButton>
                </IonSegment>
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
                <div className="legend-item">
                  <span className="manual-badge" style={{ padding: '2px 6px', fontSize: '10px' }}>
                    M
                  </span>
                  <span>Manual Override</span>
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
                    onClick={() => handleDayClick(day)}>
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
                  <strong>Tip:</strong> Click on any future date to set or update capacity. The color indicates how full each day is based on current
                  bookings.
                </div>
              </div>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>

      {/* Set Capacity Modal */}
      <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)} className="modal-set-capacity">
        <IonHeader>
          <IonToolbar>
            <IonTitle>{selectedDay?.capacity ? 'Update Capacity' : 'Set Capacity'}</IonTitle>
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
                  <span>
                    {selectedDay.date.toLocaleDateString('default', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                <div className="modal-meal-type">
                  <span className="meal-type-badge">
                    {getMealTypeIcon(selectedMealType)} {formatMealType(selectedMealType)}
                  </span>
                  {selectedDay.capacity?.is_manual && (
                    <IonChip color="primary" outline>
                      <IonLabel>Manual Override</IonLabel>
                    </IonChip>
                  )}
                </div>

                {selectedDay.capacity && (
                  <div className="capacity-stats">
                    <div className="stat-item">
                      <IonIcon icon={peopleOutline} />
                      <span>Confirmed: {(selectedDay.capacity.capacity || 0) - (selectedDay.capacity.available || 0)}</span>
                    </div>
                    <div className="stat-item">
                      <span>Available: {selectedDay.capacity.available || 0}</span>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label required">Capacity</label>
                  <IonInput
                    type="number"
                    value={formCapacity}
                    style={{ color: '#000' }}
                    onIonInput={(e) => setFormCapacity(parseInt(e.detail.value || '0'))}
                    placeholder="Enter capacity"
                    min="1"
                  />
                  <p className="helper-text">Maximum number of {formatMealType(selectedMealType).toLowerCase()} donations on this date</p>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <IonTextarea
                    value={formNotes}
                    onIonInput={(e) => setFormNotes(e.detail.value || '')}
                    placeholder="Optional notes (e.g., special events, holidays)"
                    rows={3}
                  />
                </div>

                <IonButton expand="block" onClick={handleSaveCapacity} disabled={loading} className="save-button">
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
