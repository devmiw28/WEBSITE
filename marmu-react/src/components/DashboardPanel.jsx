// components/DashboardPanel.jsx
import React from 'react';
import MonthlyReportChart from './MonthlyReportChart';

export default function DashboardPanel({
  summary,
  monthlyReport,
  totalClients,
  notifications,
  artistPerformance,
}) {
  if (!summary || !monthlyReport) return <p>Loading Appointment Dashboard...</p>;

  return (
    <div className="dashboard-panel">
      <h2>Appointment Dashboard</h2>

      {/* Top stat cards */}
      <div className="stats-cards">
        <div className="card total-appointments">
          <h3>Total Appointments 🗓️</h3>
          <p className="stat-number">{summary.totalAppointments ?? 0}</p>
        </div>

        <div className="card pending-appointments">
          <h3>Pending Appointments ⏳</h3>
          <p className="stat-number">{summary.pendingAppointments ?? 0}</p>
        </div>

        <div className="card approved-appointments">
          <h3>Approved Appointments ✅</h3>
          <p className="stat-number">{summary.approvedAppointments ?? 0}</p>
        </div>

        {/* NEW: Total Clients */}
        <div className="card total-clients">
          <h3>Total Clients 👥</h3>
          <p className="stat-clients">{totalClients ?? 0}</p>
        </div>
      </div>

      {/* Monthly service breakdown (list + chart side-by-side) */}
      <div className="monthly-report">
        <h3>Monthly Service Breakdown 📈</h3>
        <div className="report-content">
          <ul className="service-list">
            <li>✂️ Haircut: <strong>{monthlyReport.haircut}</strong></li>
            <li>🎨 Tattoo: <strong>{monthlyReport.tattoo}</strong></li>
          </ul>

          <div className="chart-container">
            <MonthlyReportChart data={monthlyReport} />
          </div>
        </div>
      </div>

      {/* New row: Artist performance + System Status */}
      <div style={{ display: 'flex', gap: '20px', marginTop: '20px', flexWrap: 'wrap' }}>
        {/* Artist Performance */}
        <div className="card" style={{ flex: 1, minWidth: 300 }}>
          <h3 style={{ marginTop: 0 }}>Top Performing Artists ✂️</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px 6px', color: '#bbb' }}>Artist</th>
                <th style={{ textAlign: 'right', padding: '8px 6px', color: '#bbb' }}>Completed</th>
              </tr>
            </thead>
            <tbody>
              {artistPerformance && artistPerformance.length > 0 ? (
                artistPerformance.map((a, idx) => (
                  <tr key={idx} style={{ borderTop: '1px solid #3a3a3a' }}>
                    <td style={{ padding: '10px 6px' }}>{a.artist_name}</td>
                    <td style={{ padding: '10px 6px', textAlign: 'right' }}>{a.total_jobs}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} style={{ padding: '12px', color: '#888' }}>No data yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* System Status / Notifications */}
        <div className="card" style={{ flex: 1, minWidth: 260 }}>
          <h3 style={{ marginTop: 0 }}>System Status / Notifications ⚙️</h3>
          <div style={{ paddingTop: 6 }}>
            <p style={{ margin: '8px 0' }}>🟢 <strong>Database:</strong> Connected</p>
            <p style={{ margin: '8px 0' }}>🔔 <strong>Pending Appointments:</strong> {notifications?.pending_appointments ?? 0}</p>
            <p style={{ margin: '8px 0' }}>💬 <strong>New Feedback:</strong> {notifications?.new_feedback ?? 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
