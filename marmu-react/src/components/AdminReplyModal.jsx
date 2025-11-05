import { useState } from 'react';
import { API_BASE_URL } from '../App';

function AdminReplyModal({ feedback, onClose, onReplySent }) {
  const [replyMessage, setReplyMessage] = useState('');
  const [sendEmail, setSendEmail] = useState(false); // <-- new state
  const [loading, setLoading] = useState(false);

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) {
      alert('Please enter a reply message.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/feedback/${feedback.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reply: replyMessage, sendEmail }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✅ ${data.message}`);
        onReplySent(); 
        onClose();
      } else {
        const data = await response.json();
        alert(`⚠️ Failed to send reply: ${data.message || response.statusText}`);
      }
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!feedback) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Reply to Feedback from {feedback.user}</h3>
        <p><strong>Client Feedback:</strong> {feedback.message}</p>
        <form onSubmit={handleReplySubmit}>
          <textarea
            rows={5}
            placeholder="Write your reply here..."
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            required
          />
          <label>
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
            />
            Send reply via email
          </label>
          <div className="modal-actions">
            <button type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reply'}
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

export default AdminReplyModal;
