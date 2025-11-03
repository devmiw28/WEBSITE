// components/AdminAddUserModal.jsx
import { useState } from 'react';
import { API_BASE_URL } from '../App';

function AdminAddUserModal({ onClose, onUserAdded }) {
    const [fullname, setFullname] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (password !== confirmPassword) {
            alert('❌ Passwords do not match!');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/add_user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullname, username, email, password, role }),
            });

            const data = await response.json();

            if (response.ok) {
                alert('✅ User added successfully!');
                onUserAdded();
                onClose();
            } else {
                alert(`⚠️ ${data.error || 'Failed to add user.'}`);
            }
        } catch (err) {
            alert(`❌ ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal">
                <h3>Add New User</h3>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Full Name"
                        value={fullname}
                        onChange={(e) => setFullname(e.target.value)}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />

                    {/* Role dropdown */}
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        required
                    >
                        <option value="">-- Select Role --</option>
                        <option value="user">Client</option>
                        <option value="Admin">Admin</option>
                        <option value="Barber">Barber</option>
                        <option value="TattooArtist">Tattoo Artist</option>
                    </select>

                    <div className="modal-actions">
                        <button type="submit" disabled={loading}>
                            {loading ? 'Adding...' : 'Add User'}
                        </button>
                        <button type="button" className="cancel-btn" onClick={onClose}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AdminAddUserModal;
