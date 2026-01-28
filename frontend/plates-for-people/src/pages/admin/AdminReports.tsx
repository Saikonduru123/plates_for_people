import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
  useIonToast,
  IonCard,
  IonCardContent,
  IonLabel,
  IonBackButton,
  IonButtons,
  IonBadge,
  IonSelect,
  IonSelectOption,
  IonInput,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import type { Donation } from '../../types';
import './AdminReports.css';

interface SystemReport {
  total_donations: number;
  completed_donations: number;
  pending_donations: number;
  total_users: number;
  active_users: number;
  verified_ngos: number;
  pending_verifications: number;
  date_range?: string;
}

const AdminReports: React.FC = () => {
  const history = useHistory();
  const [present] = useIonToast();

  const [report, setReport] = useState<SystemReport | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [selectedNGO, setSelectedNGO] = useState<string>('');
  const [selectedDonor, setSelectedDonor] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [ngoList, setNgoList] = useState<string[]>([]);
  const [donorList, setDonorList] = useState<string[]>([]);
  const [filteredDonations, setFilteredDonations] = useState<Donation[]>([]);

  useEffect(() => {
    loadDonations();
  }, []);

  useEffect(() => {
    loadReport();

    // Calculate and apply period-based dates to donations filter
    const today = new Date();
    let periodStartDate = '';
    let periodEndDate = today.toISOString().split('T')[0];

    switch (selectedPeriod) {
      case 'week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        periodStartDate = weekAgo.toISOString().split('T')[0];
        setStartDate(periodStartDate);
        setEndDate(periodEndDate);
        break;
      case 'month':
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        periodStartDate = monthAgo.toISOString().split('T')[0];
        setStartDate(periodStartDate);
        setEndDate(periodEndDate);
        break;
      case 'year':
        const yearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
        periodStartDate = yearAgo.toISOString().split('T')[0];
        setStartDate(periodStartDate);
        setEndDate(periodEndDate);
        break;
      case 'all':
      default:
        // Clear date filter for 'all time'
        setStartDate('');
        setEndDate('');
        break;
    }
  }, [selectedPeriod]);

  useEffect(() => {
    applyFilters();
  }, [donations, selectedNGO, selectedDonor, startDate, endDate]);

  // When custom date range is set, reload report with new dates
  const handleDateChange = async (newStartDate?: string, newEndDate?: string) => {
    try {
      const start = newStartDate !== undefined ? newStartDate : startDate;
      const end = newEndDate !== undefined ? newEndDate : endDate;

      // Validate date range
      if (start && end) {
        const startDateObj = new Date(start);
        const endDateObj = new Date(end);

        if (startDateObj > endDateObj) {
          present({
            message: 'Invalid date range. End date must be after or equal to start date.',
            duration: 3000,
            color: 'danger',
          });
          return;
        }
      }

      if (start && end) {
        // Both dates provided - use custom range
        const data = await adminService.getSystemReport(start, end);
        setReport(data);
      } else if (start || end) {
        // Only one date provided - use partial range
        const data = await adminService.getSystemReport(
          start || new Date('2020-01-01').toISOString().split('T')[0],
          end || new Date().toISOString().split('T')[0],
        );
        setReport(data);
      }
    } catch (err) {
      console.error('Error updating report with date range:', err);
    }
  };

  const loadReport = async () => {
    try {
      setLoading(true);
      const today = new Date();
      let startDate = new Date(today);
      let endDate = new Date(today);

      // Calculate date range based on selected period
      switch (selectedPeriod) {
        case 'week':
          startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        case 'all':
        default:
          startDate = new Date('2020-01-01');
      }

      const startStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];

      console.log(`Loading report for period: ${selectedPeriod}, from ${startStr} to ${endStr}`);
      const data = await adminService.getSystemReport(startStr, endStr);
      console.log('Report data received:', data);
      setReport(data);
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Failed to load report';
      present({
        message,
        duration: 3000,
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDonations = async () => {
    try {
      // Load donations
      const data = await adminService.getAllDonations();
      console.log('Loaded donations:', data?.length);
      console.log('Sample donation:', data?.[0]);
      setDonations(data || []);

      // Initialize filtered donations with all donations
      if (data && Array.isArray(data)) {
        setFilteredDonations(data);
      }

      // Load NGO and Donor names from dedicated API endpoints
      try {
        const [ngoNames, donorNames] = await Promise.all([
          adminService.getNGONames().catch((err) => {
            console.error('NGO names API failed:', err);
            return [];
          }),
          adminService.getDonorNames().catch((err) => {
            console.error('Donor names API failed:', err);
            return [];
          }),
        ]);

        console.log('NGO names loaded:', ngoNames?.length, ngoNames);
        console.log('Donor names loaded:', donorNames?.length, donorNames);

        setNgoList(ngoNames || []);
        setDonorList(donorNames || []);
      } catch (namesError) {
        console.error('Error loading filter lists:', namesError);
        // Fallback: extract from donations if API fails
        const uniqueNGOs = Array.from(new Set(data.map((d: any) => d.ngo_name).filter(Boolean))) as string[];
        const uniqueDonors = Array.from(new Set(data.map((d: any) => d.donor_name).filter(Boolean))) as string[];
        console.log('Using fallback - NGOs:', uniqueNGOs, 'Donors:', uniqueDonors);
        setNgoList(uniqueNGOs.sort());
        setDonorList(uniqueDonors.sort());
      }
    } catch (err: any) {
      console.error('Error loading donations:', err);
      const message = err.response?.data?.detail || 'Failed to load donations';
      present({
        message,
        duration: 3000,
        color: 'danger',
      });
      // Set empty arrays on error
      setDonations([]);
      setNgoList([]);
      setDonorList([]);
    }
  };

  const filterDonations = () => {
    // Placeholder for future filtering if needed
  };

  const applyFilters = () => {
    if (!donations || !Array.isArray(donations)) {
      console.log('No donations to filter');
      setFilteredDonations([]);
      return;
    }

    // Validate date range before filtering
    if (startDate && endDate) {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);

      if (startDateObj > endDateObj) {
        console.log('Invalid date range detected during filtering');
        setFilteredDonations([]);
        return;
      }
    }

    console.log('Starting filter with:', {
      totalDonations: donations.length,
      selectedNGO,
      selectedDonor,
      startDate,
      endDate,
    });

    let filtered = [...donations];

    // Filter by NGO
    if (selectedNGO && selectedNGO.trim() !== '') {
      console.log('Filtering by NGO:', selectedNGO);
      const beforeNGOFilter = filtered.length;
      filtered = filtered.filter((d) => {
        const ngoName = (d.ngo_name || '').trim();
        return ngoName === selectedNGO.trim();
      });
      console.log(`NGO filter: ${beforeNGOFilter} -> ${filtered.length}`);
    }

    // Filter by Donor
    if (selectedDonor && selectedDonor.trim() !== '') {
      console.log('Filtering by Donor:', selectedDonor);
      const beforeDonorFilter = filtered.length;
      filtered = filtered.filter((d) => {
        const donorName = (d.donor_name || '').trim();
        const selected = selectedDonor.trim();
        console.log(`Comparing: "${donorName}" === "${selected}" -> ${donorName === selected}`);
        return donorName === selected;
      });
      console.log(`Donor filter: ${beforeDonorFilter} -> ${filtered.length}`);
    }

    // Filter by date range
    if (startDate) {
      console.log('Filtering by start date:', startDate);
      const beforeStartFilter = filtered.length;
      filtered = filtered.filter((d) => {
        if (!d.donation_date && !d.created_at) return false;

        const donationDateStr = d.donation_date || d.created_at || '';
        const donationDate = new Date(donationDateStr);
        const filterStartDate = new Date(startDate);

        // Normalize to date only (remove time component)
        donationDate.setHours(0, 0, 0, 0);
        filterStartDate.setHours(0, 0, 0, 0);

        const result = donationDate >= filterStartDate;
        return result;
      });
      console.log(`Start date filter: ${beforeStartFilter} -> ${filtered.length}`);
    }

    if (endDate) {
      console.log('Filtering by end date:', endDate);
      const beforeEndFilter = filtered.length;
      filtered = filtered.filter((d) => {
        if (!d.donation_date && !d.created_at) return false;

        const donationDateStr = d.donation_date || d.created_at || '';
        const donationDate = new Date(donationDateStr);
        const filterEndDate = new Date(endDate);

        // Normalize donation date to start of day, filter date to end of day
        donationDate.setHours(0, 0, 0, 0);
        filterEndDate.setHours(23, 59, 59, 999);

        const result = donationDate <= filterEndDate;
        return result;
      });
      console.log(`End date filter: ${beforeEndFilter} -> ${filtered.length}`);
    }

    console.log('Final filtered donations:', filtered.length);
    setFilteredDonations(filtered);
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await loadReport();
    await loadDonations();
    event.detail.complete();
  };

  const handleExport = () => {
    if (!report) {
      present({
        message: 'No report data to export',
        duration: 2000,
        color: 'warning',
      });
      return;
    }

    // Create CSV content with summary and detailed table
    const csvRows = [
      ['Plates for People - System Report'],
      ['Generated on', new Date().toLocaleString()],
      [''],
      ['DONATION STATISTICS'],
      ['Total Donations', report.total_donations],
      ['Completed Donations', report.completed_donations],
      ['Pending Donations', report.pending_donations],
      [''],
      ['USER STATISTICS'],
      ['Total Users', report.total_users],
      ['Active Users', report.active_users],
      [''],
      ['NGO STATISTICS'],
      ['Verified NGOs', report.verified_ngos],
      ['Pending Verifications', report.pending_verifications],
      [''],
      ['Report Period', report.date_range || 'All Time'],
      [''],
      [''],
      ['DETAILED DONATIONS TABLE'],
      ['ID', 'Donor', 'NGO', 'Location', 'Meal Type', 'Quantity', 'Date', 'Status'],
    ];

    // Add filtered donations to the export
    filteredDonations.forEach((donation: any) => {
      csvRows.push([
        donation.id || '',
        donation.donor_name || '',
        donation.ngo_name || '',
        donation.location_name || '',
        donation.meal_type || '',
        donation.quantity_plates || '',
        donation.donation_date ? new Date(donation.donation_date).toLocaleDateString() : '',
        donation.status || '',
      ]);
    });

    const csvContent = csvRows.map((row) => row.join(',')).join('\n');

    // Create blob and download
    const element = document.createElement('a');
    const file = new Blob([csvContent], { type: 'text/csv' });
    element.href = URL.createObjectURL(file);
    element.download = `system-report-${new Date().getTime()}.csv`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    present({
      message: 'Report exported successfully',
      duration: 2000,
      color: 'success',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'danger';
      default:
        return 'medium';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton />
            </IonButtons>
            <IonTitle>System Reports</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <p>Loading report...</p>
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
            <IonBackButton />
          </IonButtons>
          <IonTitle>System Reports</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="admin-reports">
          {/* Unified Filters Section */}
          <div className="unified-filters-section">
            {/* Single Row: All Filters */}
            <div className="filter-row">
              {/* Period Filter Dropdown */}
              <div className="filter-group">
                <label className="filter-label">Period:</label>
                <IonSelect
                  value={selectedPeriod}
                  onIonChange={(e) => setSelectedPeriod(e.detail.value)}
                  placeholder="Choose period"
                  className="filter-select">
                  <IonSelectOption value="all">All Time</IonSelectOption>
                  <IonSelectOption value="year">1 Year</IonSelectOption>
                  <IonSelectOption value="month">1 Month</IonSelectOption>
                  <IonSelectOption value="week">1 Week</IonSelectOption>
                </IonSelect>
              </div>

              {/* NGO Filter */}
              <div className="filter-group">
                <label className="filter-label">NGO: {ngoList.length > 0 && `(${ngoList.length})`}</label>
                <IonSelect
                  value={selectedNGO}
                  onIonChange={(e) => setSelectedNGO(e.detail.value)}
                  placeholder="Select NGO"
                  className="filter-select"
                  interface="popover"
                  interfaceOptions={{
                    cssClass: 'filter-popover',
                  }}>
                  <IonSelectOption value="">All NGOs</IonSelectOption>
                  {ngoList && ngoList.length > 0 ? (
                    ngoList.map((ngo) => (
                      <IonSelectOption key={ngo} value={ngo}>
                        {ngo}
                      </IonSelectOption>
                    ))
                  ) : (
                    <IonSelectOption value="" disabled>
                      No NGOs available
                    </IonSelectOption>
                  )}
                </IonSelect>
              </div>

              {/* Donor Filter */}
              <div className="filter-group">
                <label className="filter-label">Donor: {donorList.length > 0 && `(${donorList.length})`}</label>
                <IonSelect
                  value={selectedDonor}
                  onIonChange={(e) => setSelectedDonor(e.detail.value)}
                  placeholder="Select Donor"
                  className="filter-select"
                  interface="popover"
                  interfaceOptions={{
                    cssClass: 'filter-popover',
                  }}>
                  <IonSelectOption value="">All Donors</IonSelectOption>
                  {donorList && donorList.length > 0 ? (
                    donorList.map((donor) => (
                      <IonSelectOption key={donor} value={donor}>
                        {donor}
                      </IonSelectOption>
                    ))
                  ) : (
                    <IonSelectOption value="" disabled>
                      No Donors available
                    </IonSelectOption>
                  )}
                </IonSelect>
              </div>

              {/* Date Range Filter */}
              <div className="date-range-group">
                <label className="filter-label">Date Range:</label>
                <div className="date-inputs-wrapper">
                  <IonInput
                    type="date"
                    value={startDate}
                    onIonChange={(e) => {
                      const newDate = e.detail.value || '';
                      setStartDate(newDate);
                      handleDateChange(newDate, endDate);
                    }}
                    placeholder="From"
                    className="filter-input date-input-from"
                  />
                  <span className="date-input-separator">to</span>
                  <IonInput
                    type="date"
                    value={endDate}
                    onIonChange={(e) => {
                      const newDate = e.detail.value || '';
                      setEndDate(newDate);
                      handleDateChange(startDate, newDate);
                    }}
                    placeholder="To"
                    className="filter-input date-input-to"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Report Cards */}
          <div className="report-section">
            <h2 className="section-title">Donation Statistics</h2>
            <div className="stats-grid">
              <IonCard className="stat-card">
                <IonCardContent>
                  <div className="stat-value">{report?.total_donations || 0}</div>
                  <div className="stat-label">Total Donations</div>
                </IonCardContent>
              </IonCard>

              <IonCard className="stat-card">
                <IonCardContent>
                  <div className="stat-value">{report?.completed_donations || 0}</div>
                  <div className="stat-label">Completed</div>
                </IonCardContent>
              </IonCard>

              <IonCard className="stat-card">
                <IonCardContent>
                  <div className="stat-value">{report?.pending_donations || 0}</div>
                  <div className="stat-label">Pending</div>
                </IonCardContent>
              </IonCard>
            </div>
          </div>

          {/* User Statistics */}
          <div className="report-section">
            <h2 className="section-title">User Statistics</h2>
            <div className="stats-grid">
              <IonCard className="stat-card">
                <IonCardContent>
                  <div className="stat-value">{report?.total_users || 0}</div>
                  <div className="stat-label">Total Users</div>
                </IonCardContent>
              </IonCard>

              <IonCard className="stat-card">
                <IonCardContent>
                  <div className="stat-value">{report?.active_users || 0}</div>
                  <div className="stat-label">Active Users</div>
                </IonCardContent>
              </IonCard>
            </div>
          </div>

          {/* NGO Statistics */}
          <div className="report-section">
            <h2 className="section-title">NGO Statistics</h2>
            <div className="stats-grid">
              <IonCard className="stat-card">
                <IonCardContent>
                  <div className="stat-value">{report?.verified_ngos || 0}</div>
                  <div className="stat-label">Verified NGOs</div>
                </IonCardContent>
              </IonCard>

              <IonCard className="stat-card">
                <IonCardContent>
                  <div className="stat-value">{report?.pending_verifications || 0}</div>
                  <div className="stat-label">Pending Verification</div>
                </IonCardContent>
              </IonCard>
            </div>
          </div>

          {/* Donations Table Section */}
          <div className="donations-table-section">
            <h2 className="section-title">
              All Donations ({filteredDonations.length})
              <IonButton
                size="small"
                fill="clear"
                onClick={() => {
                  console.log('=== DEBUG INFO ===');
                  console.log('Total donations:', donations.length);
                  console.log('Filtered donations:', filteredDonations.length);
                  console.log('Sample donation:', donations[0]);
                  console.log('NGO List:', ngoList);
                  console.log('Donor List:', donorList);
                  console.log('Selected NGO:', selectedNGO);
                  console.log('Selected Donor:', selectedDonor);
                  console.log('Date Range:', { startDate, endDate });
                  console.log('==================');
                }}
                style={{ marginLeft: '10px' }}>
                🔍 Debug
              </IonButton>
            </h2>

            {filteredDonations.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: '64px' }}>🍽️</div>
                <p>No donations found</p>
              </div>
            ) : (
              <div className="donations-table-wrapper">
                <table className="donations-table">
                  <thead>
                    <tr>
                      <th>Donation Date</th>
                      <th>Location</th>
                      <th>Donation</th>
                      <th>Donor</th>
                      <th>Meal Type</th>
                      <th>Plates Count</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDonations.map((donation) => (
                      <tr key={donation.id}>
                        <td>{formatDate(donation.donation_date || donation.created_at || '')}</td>
                        <td>{donation.location_name || 'N/A'}</td>
                        <td>{donation.food_type || 'Meal Donation'}</td>
                        <td>{donation.donor_name || 'Anonymous'}</td>
                        <td>{donation.meal_type?.toUpperCase() || 'N/A'}</td>
                        <td>{donation.quantity_plates || 0}</td>
                        <td>
                          <span
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '600',
                              backgroundColor: donation.status === 'completed' ? '#d4edda' : donation.status === 'pending' ? '#fff3cd' : '#f8d7da',
                              color: donation.status === 'completed' ? '#155724' : donation.status === 'pending' ? '#856404' : '#721c24',
                            }}>
                            {donation.status?.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Export Button */}
          <div className="export-section">
            <IonButton expand="block" color="primary" className="export-button" onClick={handleExport}>
              📊 Export Report
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AdminReports;
