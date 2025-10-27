import React from 'react';
import MonthlyReportChart from './MonthlyReportChart'; // adjust the path if needed

export default function DashboardPanel({ summary, monthlyReport, onScheduleViewClick }) {
  // Graceful loading state
  if (!summary || !monthlyReport) return <p>Loading Appointment Dashboard...</p>;

  return (
    <div className="dashboard-panel">
      <h2>Appointment Dashboard ✨</h2>

      {/* Statistics Cards */}
      <div className="stats-cards">
        <div className="card total-appointments">
          <h3>Total Appointments 🗓️</h3>
          <p className="stat-number">{summary.totalAppointments}</p>
        </div>

        <div className="card pending-appointments">
          <h3>Pending Appointments ⏳</h3>
          <p className="stat-number">{summary.pendingAppointments}</p>
        </div>

        <div className="card approved-appointments">
          <h3>Approved Appointments ✅</h3>
          <p className="stat-number">{summary.approvedAppointments}</p>
        </div>
      </div>

      {/* Monthly Service Breakdown */}
      <div className="monthly-report">
        <h3>Monthly Service Breakdown 📈</h3>

        <div className="report-content">
          {/* Left: Service data list */}
          <ul className="service-list">
            <li>✂️ Haircut: <strong>{monthlyReport.haircut}</strong></li>
            <li>🎨 Tattoo: <strong>{monthlyReport.tattoo}</strong></li>
          </ul>

          {/* Right: Pie chart */}
          <div className="chart-container">
            <MonthlyReportChart data={monthlyReport} />
          </div>
        </div>
      </div>
    </div>
  );
}
