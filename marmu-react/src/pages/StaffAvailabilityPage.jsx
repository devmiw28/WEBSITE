// pages/StaffAvailabilityPage.jsx
import { useState, useEffect } from "react";
import { API_BASE_URL } from "../App";
import { useAuth } from "../context/AuthContext";

export default function StaffAvailabilityPage() {
    const { user } = useAuth(); // contains fullname, id, role
    const [date, setDate] = useState("");
    const [selectedTimes, setSelectedTimes] = useState([]);
    const [role, setRole] = useState(""); // for admin
    const [staffList, setStaffList] = useState([]);
    const [selectedStaff, setSelectedStaff] = useState("");

    useEffect(() => {
        if (user.role === "Admin" && role) {
            fetch(`${API_BASE_URL}/admin/staff?role=${role}`)
                .then((res) => res.json())
                .then((data) => setStaffList(data))
                .catch((err) => console.error("Error loading staff:", err));
        }
    }, [role, user.role]);


    const handleToggleTime = (time) => {
        setSelectedTimes((prev) =>
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

        if (!date || selectedTimes.length === 0) {
            alert("Please select a date and at least one time slot.");
            return;
        }

        const res = await fetch(`${API_BASE_URL}/staff/availability`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                staff_id: staffId,
                available_date: date,
                available_times: selectedTimes,
            }),
        });

        const data = await res.json();
        alert(data.message || "Error saving availability");
        setSelectedTimes([]);
        setDate("");
    };

    const timeSlots = [
        "09:00", "10:00", "11:00",
        "13:00", "14:00", "15:00",
        "16:00", "17:00"
    ];

    return (
        <div className="availability-page">
            <h2>🗓️ Set Staff Availability</h2>

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
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />

            {/* ⏰ Time Slots */}
            <div className="time-grid">
                {timeSlots.map((time) => (
                    <button
                        key={time}
                        className={selectedTimes.includes(time) ? "selected" : ""}
                        onClick={() => handleToggleTime(time)}
                    >
                        {time}
                    </button>
                ))}
            </div>

            <button onClick={handleSave}>Save Availability</button>
        </div>
    );
}
