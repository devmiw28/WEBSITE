// pages/StaffAvailabilityPage.jsx
import { useState, useEffect, useMemo } from "react";
import { API_BASE_URL } from "../App";
import { useAuth } from "../context/AuthContext";
import "../css/staffavailability.css";

export default function StaffAvailabilityPage() {
    const { user } = useAuth();
    const [date, setDate] = useState("");
    const [unavailableTimes, setUnavailableTimes] = useState([]);
    const [role, setRole] = useState("");
    const [staffList, setStaffList] = useState([]);
    const [selectedStaff, setSelectedStaff] = useState("");
    const [saving, setSaving] = useState(false);
    const [hasSaved, setHasSaved] = useState(false);
    const todayIso = useMemo(() => new Date().toISOString().split('T')[0], []);
    const [unavailabilityList, setUnavailabilityList] = useState([]);

    useEffect(() => {
        if (user.role === "Admin" && role) {
            fetch(`${API_BASE_URL}/api/admin/staff?role=${role}`)
                .then((res) => res.json())
                .then((data) => setStaffList(data))
                .catch((err) => console.error("Error loading staff:", err));
        }
    }, [role, user.role]);

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/staff/unavailability/list`)
            .then((res) => res.json())
            .then((data) => {
                setUnavailabilityList(data); 
            })
            .catch((err) => console.error("Error loading unavailability list:", err));
    }, []);

    const handleToggleTime = (time) => {
        if (hasSaved) setHasSaved(false);
        setUnavailableTimes((prev) =>
            prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]
        );
    };

    const handleSave = async () => {
        let staffId = user.id;

        // 🧑‍💼 Admin must choose a role and staff
        if (user.role === "Admin") {
            if (!role || !selectedStaff) {
                alert("Please select both role and staff name.");
                return;
            }
            staffId = selectedStaff;
        }

        if (!date) {
            alert("Please select a date.");
            return;
        }

        // Prevent saving availability for past dates
        if (date < todayIso) {
            alert("Please select today or a future date.");
            return;
        }

        const defaults = computeDefaultSlots(date);
        if (defaults.length === 0) {
            alert("Sunday is unavailable by default. No availability to save.");
            return;
        }

        const availableTimes = defaults.filter(t => !unavailableTimes.includes(t));
        if (availableTimes.length === 0) {
            alert("All default hours were marked unavailable; no availability to save for this date.");
            return;
        }

        setSaving(true);
        const res = await fetch(`${API_BASE_URL}/api/staff/availability`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                staff_id: staffId,
                available_date: date,
                available_times: availableTimes,
            }),
        });

        const text = await res.text();
        let data = {};
        try { data = text ? JSON.parse(text) : {}; } catch { }
        alert(data.message || `Error saving availability (${res.status})`);
        setUnavailableTimes([]);
        setHasSaved(true);
        // Optionally clear the selected date. Keeping the date selected helps review just-saved times.
        // setDate("");
        setSaving(false);
    };

    const computeDefaultSlots = (isoDate) => {
        if (!isoDate) return [];
        const d = new Date(isoDate + 'T00:00:00');
        const day = d.getDay(); // 0 Sun .. 6 Sat (local)
        if (day === 0) return [];
        const endHour = day === 6 ? 17 : 21; // Sat 9-17, Mon-Fri 9-21
        const slots = [];
        for (let h = 9; h < endHour; h++) {
            const hh = String(h).padStart(2, '0');
            slots.push(`${hh}:00`);
        }
        return slots;
    };

    const timeSlots = useMemo(() => computeDefaultSlots(date), [date]);

    return (
        <div className="availability-page">
            <h2>Set Staff Unavailability</h2>

            {/* 🧑‍💼 Admin View */}
            {user.role === "Admin" ? (
                <>
                    <label>Select Role:</label>
                    <select value={role} onChange={(e) => setRole(e.target.value)}>
                        <option value="">-- Select Role --</option>
                        <option value="Barber">Barber</option>
                        <option value="TattooArtist">Tattoo Artist</option>
                    </select>

                    {role && (
                        <>
                            <label>Select Staff:</label>
                            <select
                                value={selectedStaff}
                                onChange={(e) => setSelectedStaff(e.target.value)}
                            >
                                <option value="">-- Select {role === "Barber" ? "Barber" : "Tattoo Artist"} --</option>
                                {staffList.map((staff) => (
                                    <option key={staff.id} value={staff.id}>
                                        {staff.fullname}
                                    </option>
                                ))}
                            </select>
                        </>
                    )}
                </>
            ) : (
                // ✂️ Staff View (readonly)
                <div className="readonly-info">
                    <label>Role:</label>
                    <input type="text" value={user.role} readOnly />
                    <label>Name:</label>
                    <input type="text" value={user.fullname} readOnly />
                </div>
            )}

            {/* 📅 Date Picker */}
            <label>Select Date:</label>
            <input className="date-input" type="date" value={date} min={todayIso} onChange={(e) => { setHasSaved(false); setDate(e.target.value); }} />

            {/* ⏰ Time Slots */}
            <div className="time-grid">
                {timeSlots.map((time) => (
                    <button
                        key={time}
                        className={unavailableTimes.includes(time) ? "selected" : ""}
                        onClick={() => handleToggleTime(time)}
                    >
                        {time}
                    </button>
                ))}
            </div>

            {timeSlots.length === 0 ? (
                <p className="availability-note">Sunday is unavailable by default.</p>
            ) : (
                <>
                    <p className="availability-note">Default working hours are assumed. Click to mark UNAVAILABLE.</p>
                    {!hasSaved && (
                        <button className="save-btn" onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    )}
                </>
            )}

            {unavailabilityList.length > 0 && (
                <div className="unavailability-list">
                    <h3>Staff Unavailability Records</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Staff Name</th>
                                <th>Date</th>
                                <th>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {unavailabilityList.map((entry, index) => (
                                <tr key={index}>
                                    <td>{entry.staff_name}</td>
                                    <td>{new Date(entry.unavailable_date).toLocaleDateString("en-PH")}</td>
                                    <td>{entry.unavailable_time}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
