from flask import Flask, request, session, jsonify, send_from_directory
from flask_cors import CORS
import mysql.connector, smtplib, hashlib, random, re, os, glob
from datetime import datetime, timedelta
from collections import Counter
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv
from db_config import DB_CONFIG
from werkzeug.security import generate_password_hash

# =========================================
# INITIAL SETUP
# =========================================
load_dotenv()
app = Flask(__name__)
CORS(app, supports_credentials=True)
app.secret_key = os.getenv("SECRET_KEY", "supersecretkey")  # Ensure sessions work

# =========================================
# CONFIGURATION
# =========================================
YOUR_GMAIL = os.getenv("GMAIL_ADDRESS")
YOUR_APP_PASSWORD = os.getenv("GMAIL_APP")
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
OTP_EXPIRY_MINUTES = 5

otp_storage = {}  # In-memory OTP store

# =========================================
# HELPER FUNCTIONS
# =========================================
def get_connection():
    return mysql.connector.connect(**DB_CONFIG)

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def is_valid_email(email):
    return re.match(r'^[a-zA-Z0-9._%+-]+@gmail\.com$', email)

# Basic password strength check
def is_strong_password(pw: str) -> bool:
    if not pw or len(pw) < 8:
        return False
    if not re.search(r"[A-Za-z]", pw):
        return False
    if not re.search(r"\d", pw):
        return False
    return True

# =====================================================
# ✉️ Send OTP Email (Styled)
# =====================================================
def send_email_otp(email, subject, otp):
    html_body = f"""
    <html>
        <body style="font-family: Arial, sans-serif; background-color: #333; padding: 20px;">
            <div style="max-width: 600px; margin: auto; background: #333; padding: 30px; border-radius: 8px;  border: 4px solid goldenrod; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                <h2 style="color: goldenrod; text-align: center;">Marmu Barber & Tattoo Shop</h2>
                <p style="font-size: 16px; color: #333;">Hi there,</p>
                <p style="font-size: 16px; color: #333;">Use the following One-Time Password (OTP) to reset your password:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <span style="font-size: 32px; font-weight: bold; color: #ffffff; background-color: #333; padding: 15px 25px; border-radius: 4px;  border: 2px solid goldenrod; letter-spacing: 5px;">
                        {otp}
                    </span>
                </div>

                <p style="font-size: 14px; color: #777;">
                    This code is valid for <strong>{OTP_EXPIRY_MINUTES} minutes</strong>. Please do not share this code with anyone.
                </p>

                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #999; text-align: center;">Thank you for choosing Marmu Barber & Tattoo Shop.</p>
            </div>
        </body>
        </html>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"Marmu Barber & Tattoo Shop <{YOUR_GMAIL}>"
    msg["To"] = email
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(YOUR_GMAIL, YOUR_APP_PASSWORD)
            server.send_message(msg)
        print(f"✅ OTP email sent successfully to {email}")
    except Exception as e:
        print(f"❌ Failed to send OTP email: {e}")


# =====================================================
# 💬 Send Feedback Reply Email (Styled)
# =====================================================
def send_feedback_reply_email(to_email, username, reply):
    subject = "Reply to Your Feedback - Marmu Barber & Tattoo Shop"

    html_body = f"""
 <html>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
    <div 
        style="max-width: 600px; margin: auto; background: #333; padding: 30px; border: 1px solid goldenrod; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
        <h2 style="color: goldenrod; text-align: center;">Marmu Barber & Tattoo Shop</h2>
        <p style="font-size: 16px; color: #333;">Hi {username},</p>
        <p style="font-size: 16px; color: #333;">Thank you for your feedback! We truly appreciate your time and support.
        </p>

        <div
            style="background-color: #333; padding: 15px 20px; border: 2px solid goldenrod; margin: 25px 0; border-radius: 5px;">
            <p style="font-size: 15px; color: antiquewhite; margin: 0;">
                <strong>Our Reply:</strong><br>
                {reply}
            </p>
        </div>

        <p style="font-size: 15px; color: #333;">
            We hope to see you again soon at <strong>Marmu Barber & Tattoo Shop</strong>!
        </p>

        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="font-size: 12px; color: #999; text-align: center;">
            &copy; 2025 Marmu Barber & Tattoo Shop. All rights reserved.
        </p>
    </div>
</body>
</html>

    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"Marmu Barber & Tattoo Shop <{YOUR_GMAIL}>"
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(YOUR_GMAIL, YOUR_APP_PASSWORD)
            server.send_message(msg)
        print(f"✅ Feedback reply email sent to {to_email}")
    except Exception as e:
        print(f"❌ Failed to send feedback reply email: {e}")

def send_appointment_status_email(email, fullname, status, service=None, appointment_date=None, time=None, artist_name=None):
    try:
        subject = f"Your Appointment has been {status}"
        
        # ✅ Create a beautiful HTML email
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
            <div style="max-width: 600px; margin: auto; background: #333; padding: 30px; border-radius: 8px; border: 4px solid goldenrod; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                <h2 style="color: #0078d7; text-align: center;">Marmu Barber & Tattoo Shop</h2>
                <p style="font-size: 16px; color: #333;">Hi {fullname},</p>
                <p style="font-size: 16px; color: #333;">
                    We wanted to let you know that your appointment has been 
                    <strong style="color: {'#28a745' if status.lower() == 'approved' else '#d9534f'};">{status}</strong>.
                </p>

                <div style="background-color: #333; padding: 15px 20px; border-radius: 6px; border: 2px solid goldenrod; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Service:</strong> {service or 'N/A'}</p>
                    <p style="margin: 5px 0;"><strong>Artist:</strong> {artist_name or 'N/A'}</p>
                    <p style="margin: 5px 0;"><strong>Date:</strong> {appointment_date or 'N/A'}</p>
                    <p style="margin: 5px 0;"><strong>Time:</strong> {time or 'N/A'}</p>
                </div>

                <p style="font-size: 16px; color: #333;">
                    Thank you for choosing <strong>Marmu Barber & Tattoo Shop</strong>! 
                    We’re looking forward to serving you soon.
                </p>

                <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="font-size: 12px; color: #999; text-align: center;">
                    &copy; {fullname}, this message was sent automatically from Marmu Barber & Tattoo Shop.
                </p>
            </div>
        </body>
        </html>
        """

        # ✅ Prepare the MIME message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"Marmu Barber & Tattoo Shop <{YOUR_GMAIL}>"
        msg["To"] = email
        msg.attach(MIMEText(html_body, "html"))

        # ✅ Send using Gmail SMTP
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(YOUR_GMAIL, YOUR_APP_PASSWORD)
            server.send_message(msg)

        print(f"✅ Appointment status email sent to {email}")

    except Exception as e:
        print(f"⚠️ Failed to send email: {e}")


# =========================================
# STATIC FILES
# =========================================
@app.route('/')
def serve_index():
    return send_from_directory('../website', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if path.startswith("admin/") or path.startswith("api/"):
        return jsonify({"error": "Invalid static path"}), 404
    return send_from_directory('../website', path)

# =========================================
# FEEDBACK ENDPOINTS
# =========================================
@app.route("/feedback", methods=["GET"])
@app.route("/api/feedback", methods=["GET"])
def get_feedback():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT username, stars, message, COALESCE(reply, '') AS reply,
               DATE_FORMAT(date_submitted, '%Y-%m-%d %H:%i') AS date
        FROM tbl_feedback
        ORDER BY date_submitted DESC
    """)
    feedback = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(feedback)

@app.route("/feedback", methods=["POST"])
@app.route("/api/feedback", methods=["POST"])
def post_feedback():
    data = request.get_json()
    username, stars, message = data.get("username"), data.get("stars"), data.get("message")

    if not username or not stars or not message:
        return jsonify({"error": "Missing fields"}), 400

    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM tbl_users WHERE username=%s", (username,))
        result = cursor.fetchone()
        if not result:
            return jsonify({"error": "User not found"}), 404

        # Enforce one feedback per user
        user_id = result[0]
        cursor.execute("SELECT 1 FROM tbl_feedback WHERE user_id = %s LIMIT 1", (user_id,))
        if cursor.fetchone():
            return jsonify({"error": "You have already submitted feedback."}), 409

        cursor.execute("""
            INSERT INTO tbl_feedback (user_id, username, stars, message, date_submitted)
            VALUES (%s, %s, %s, %s, %s)
        """, (user_id, username, stars, message, datetime.now()))
        conn.commit()
        return jsonify({"message": "Feedback submitted successfully!"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# =========================================
# AUTHENTICATION
# =========================================
@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username_or_email, password = data.get("username"), data.get("password")

    if not username_or_email or not password:
        return jsonify({"error": "Username/Email and password required"}), 400

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True, buffered=True)
        cursor.execute("""
            SELECT username, fullname, email, hash_pass, role 
            FROM tbl_users 
            WHERE username = %s OR email = %s
        """, (username_or_email, username_or_email))
        user = cursor.fetchone()

        if not user or hash_password(password) != user["hash_pass"]:
            return jsonify({"error": "Invalid username/email or password"}), 401

        session["username"] = user["username"]
        session["fullname"] = user["fullname"]
        session["email"] = user["email"]
        session["role"] = user["role"]

        return jsonify({
            "message": f"Welcome, {user['fullname']}",
            "username": user["username"],
            "fullname": user["fullname"],
            "email": user["email"],
            "role": user["role"]
        }), 200

    except mysql.connector.Error as err:
        return jsonify({"error": f"Database error: {err}"}), 500
    finally:
        if 'conn' in locals() and conn:
            try:
                conn.close()
            except Exception:
                pass

# =========================================
# CHANGE PASSWORD (Authenticated)
# =========================================
@app.route('/change_password', methods=['POST'])
@app.route('/api/change_password', methods=['POST'])
def change_password():
    if 'username' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401

    data = request.get_json(silent=True) or {}
    current_password = data.get('current_password')
    new_password = data.get('new_password')
    confirm_password = data.get('confirm_password')

    if not all([current_password, new_password, confirm_password]):
        return jsonify({'success': False, 'message': 'All fields are required'}), 400
    if new_password != confirm_password:
        return jsonify({'success': False, 'message': 'Passwords do not match'}), 400
    if not is_strong_password(new_password):
        return jsonify({'success': False, 'message': 'Password must be at least 8 characters and include letters and numbers'}), 400

    username = session['username']
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT hash_pass FROM tbl_users WHERE username=%s", (username,))
        row = cursor.fetchone()
        if not row:
            return jsonify({'success': False, 'message': 'User not found'}), 404

        if hash_password(current_password) != row['hash_pass']:
            return jsonify({'success': False, 'message': 'Current password is incorrect'}), 403

        if hash_password(new_password) == row['hash_pass']:
            return jsonify({'success': False, 'message': 'New password must be different from the current password'}), 400

        cursor.close()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE tbl_users SET hash_pass=%s WHERE username=%s",
            (hash_password(new_password), username)
        )
        conn.commit()
        return jsonify({'success': True, 'message': 'Password updated successfully'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error updating password: {str(e)}'}), 500
    finally:
        if conn:
            conn.close()

# =========================================
# SIGNUP WITH OTP
# =========================================
@app.route("/signup/send_otp", methods=["POST"])
def signup_send_otp():
    data = request.get_json()
    email = data.get("email")

    if not email or not is_valid_email(email):
        return jsonify({"error": "Please enter a valid Gmail address"}), 400

    otp = str(random.randint(100000, 999999))
    otp_storage[email] = {"otp": otp, "expires": datetime.now() + timedelta(minutes=OTP_EXPIRY_MINUTES)}

    try:
        send_email_otp(email, "Your OTP for Signup", otp)
        return jsonify({"message": "OTP sent successfully!"})
    except Exception as e:
        return jsonify({"error": f"Failed to send OTP: {e}"}), 500

@app.route("/signup/verify", methods=["POST"])
def signup_verify():
    data = request.get_json()
    fullname, username, email, password, confirm, otp = (
        data.get("fullname"),
        data.get("username"),
        data.get("email"),
        data.get("password"),
        data.get("confirm_password"),
        data.get("otp"),
    )

    if not all([fullname, username, email, password, confirm, otp]):
        return jsonify({"error": "All fields are required"}), 400
    if password != confirm:
        return jsonify({"error": "Passwords do not match"}), 400

    record = otp_storage.get(email)
    if not record or datetime.now() > record["expires"] or record["otp"] != otp:
        return jsonify({"error": "Invalid or expired OTP"}), 400

    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM tbl_users WHERE username=%s OR email=%s", (username, email))
        if cursor.fetchone():
            return jsonify({"error": "Username or email already exists"}), 409

        cursor.execute("""
            INSERT INTO tbl_users (fullname, username, email, hash_pass)
            VALUES (%s, %s, %s, %s)
        """, (fullname, username, email, hash_password(password)))
        conn.commit()

        del otp_storage[email]
        return jsonify({"message": "Signup successful!"}), 201
    except mysql.connector.Error as err:
        return jsonify({"error": f"Database error: {err}"}), 500
    finally:
        conn.close()

# =========================================
# FORGOT PASSWORD
# =========================================
@app.route('/api/send_otp', methods=['POST'])
def forgot_send_otp():
    email = request.json.get('email')
    if not email or not email.endswith('@gmail.com'):
        return jsonify({'success': False, 'message': 'Invalid email format'}), 400

    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM tbl_users WHERE email=%s", (email,))
        if not cursor.fetchone():
            return jsonify({'success': False, 'message': 'No account found with this email'}), 404
    finally:
        conn.close()

    otp = str(random.randint(100000, 999999))
    otp_storage[email] = {'otp': otp, 'expires_at': datetime.now() + timedelta(minutes=OTP_EXPIRY_MINUTES)}

    try:
        send_email_otp(email, "Your OTP for Password Reset", otp)
        return jsonify({'success': True, 'message': 'OTP sent successfully'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Failed to send OTP: {str(e)}'}), 500

@app.route('/api/reset_password', methods=['POST'])
def reset_password():
    data = request.json
    email, otp, new_pass, confirm = (
        data.get('email'),
        data.get('otp'),
        data.get('new_password'),
        data.get('confirm_password'),
    )

    if not all([email, otp, new_pass, confirm]):
        return jsonify({'success': False, 'message': 'All fields are required'}), 400
    if new_pass != confirm:
        return jsonify({'success': False, 'message': 'Passwords do not match'}), 400

    stored = otp_storage.get(email)
    if not stored or datetime.now() > stored['expires_at'] or otp != stored['otp']:
        return jsonify({'success': False, 'message': 'Invalid or expired OTP'}), 400

    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE tbl_users SET hash_pass=%s WHERE email=%s", (hash_password(new_pass), email))
        conn.commit()
        del otp_storage[email]
        return jsonify({'success': True, 'message': 'Password reset successful'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Database error: {str(e)}'}), 500
    finally:
        conn.close()

# =========================================
# BOOKINGS
# =========================================
@app.route("/staff/unavailability", methods=["POST"])
def add_unavailability():
    data = request.get_json()
    staff_id = data.get('staff_id')
    unavailable_date = data.get('unavailable_date')
    unavailable_times = data.get('unavailable_times', [])

    if not staff_id or not unavailable_date or not unavailable_times:
        return jsonify({"error": "Missing required fields"}), 400

    conn = get_connection()
    cursor = conn.cursor()

    # Clear any existing unavailability for this staff and date
    try:
        cursor.execute(
            "DELETE FROM tbl_staff_unavailability WHERE staff_id = %s AND unavailable_date = %s",
            (staff_id, unavailable_date),
        )
    except Exception:
        pass

    for time in unavailable_times:
        cursor.execute("""
            INSERT INTO tbl_staff_unavailability (staff_id, unavailable_date, unavailable_time)
            VALUES (%s, %s, %s)
        """, (staff_id, unavailable_date, time))

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Unavailability saved successfully"}), 201

@app.route("/staff/<service>", methods=["GET"])
def get_staff_by_service(service):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Map service to role
    role = None
    if service.lower() == "haircut":
        role = "Barber"
    elif service.lower() == "tattoo":
        role = "TattooArtist"

    if not role:
        return jsonify([]), 200

    cursor.execute("SELECT id, fullname FROM tbl_users WHERE role = %s", (role,))
    staff = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(staff), 200

@app.route("/current_user")
@app.route("/api/current_user")
def current_user():
    if 'username' in session:
        return jsonify({
            "username": session['username'],
            "fullname": session['fullname']
        })
    return jsonify({"error": "Not logged in"}), 401

@app.route("/bookings", methods=["POST"])
@app.route("/api/bookings", methods=["POST"])
def create_booking():
    data = request.get_json()
    
    # Check if required fields are present
    required_fields = ["username", "fullname", "service", "date", "time", "staff_id"]
    missing_fields = [field for field in required_fields if field not in data]
    if missing_fields:
        return jsonify({"error": f"Missing fields: {', '.join(missing_fields)}"}), 400

    username = data.get("username")
    fullname = data.get("fullname")
    service = data.get("service")
    date = data.get("date")
    time = data.get("time")
    staff_id = data.get("staff_id")
    remarks = data.get("remarks", "")

    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Check if the user exists
        cursor.execute("SELECT id FROM tbl_users WHERE username=%s", (username,))
        user = cursor.fetchone()
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Check if staff exists
        cursor.execute("SELECT fullname FROM tbl_users WHERE id=%s", (staff_id,))
        artist = cursor.fetchone()
        if not artist:
            return jsonify({"error": "Artist not found"}), 404

        artist_name = artist[0] if artist else None

        # Check if time slot is already booked
        cursor.execute("""
            SELECT id FROM tbl_appointment 
            WHERE appointment_date=%s AND time=%s AND artist_id=%s AND status != 'Cancelled'
        """, (date, time, staff_id))
        if cursor.fetchone():
            return jsonify({"error": "This time slot is already booked"}), 409

        # Enforce booking limits: one haircut and one tattoo per user every 14 days
        try:
            cursor.execute("SELECT COUNT(*) FROM tbl_appointment WHERE user_id = %s AND service = %s AND appointment_date >= DATE_SUB(CURDATE(), INTERVAL 14 DAY) AND status != 'Cancelled'", (user[0], service))
            recent_count = cursor.fetchone()[0]
            if recent_count and recent_count >= 1:
                return jsonify({"error": f"You can only book one {service} every 2 weeks."}), 400
        except Exception:
            # If anything goes wrong with the check, continue (defensive)
            pass

        cursor.execute("""
            INSERT INTO tbl_appointment 
                (user_id, fullname, service, appointment_date, time, remarks, status, artist_id, artist_name)
            VALUES (%s, %s, %s, %s, %s, %s, 'Pending', %s, %s)
        """, (user[0], fullname, service, date, time, remarks, staff_id, artist_name))

        # Mark slot as booked in availability table
        cursor.execute("""
            UPDATE tbl_staff_unavailability
            SET is_booked = TRUE
            WHERE staff_id = %s AND unavailable_date = %s AND unavailable_time = %s
        """, (staff_id, date, time))

        conn.commit()
        return jsonify({"message": "Booking created successfully!", "status": "Pending"}), 201
    except Exception as e:
        print(f"Error creating booking: {e}")
        return jsonify({"error": "An error occurred while processing your request."}), 500
    finally:
        conn.close()

@app.route("/appointments/<username>", methods=["GET"])
def get_user_appointments(username):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, fullname, service, appointment_date, time, remarks, status
            FROM tbl_appointment
            WHERE user_id = (SELECT id FROM tbl_users WHERE username = %s)
            ORDER BY appointment_date DESC, time DESC
        """, (username,))
        return jsonify(cursor.fetchall()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/appointments/<int:appointment_id>/cancel', methods=['POST'])
@app.route('/api/appointments/<int:appointment_id>/cancel', methods=['POST'])
def cancel_appointment(appointment_id):
    # Check if the user is logged in
    if 'username' not in session:
        return jsonify({'error': 'Not authenticated'}), 401

    username = session['username']
    conn = None

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True, buffered=True)

        # Step 1: Fetch the appointment details
        cursor.execute("SELECT * FROM tbl_appointment WHERE id = %s", (appointment_id,))
        apt = cursor.fetchone()
        if not apt:
            return jsonify({'error': 'Appointment not found'}), 404

        # Step 2: Verify that the logged-in user owns this appointment
        cursor.execute("SELECT id FROM tbl_users WHERE username = %s", (username,))
        user_row = cursor.fetchone()
        if not user_row or apt['user_id'] != user_row['id']:
            return jsonify({'error': 'Not authorized to cancel this appointment'}), 403

        # Step 3: Check if the appointment is in a cancellable state
        if apt['status'] in ('Cancelled', 'Completed', 'Abandoned', 'Done'):
            return jsonify({'error': 'Appointment already in a terminal state, cannot be cancelled'}), 400

        # Step 4: Update appointment status to 'Cancelled'
        cursor.execute("UPDATE tbl_appointment SET status = 'Cancelled' WHERE id = %s", (appointment_id,))

        # Step 5: Free up the staff's unavailability slot
        try:
            cursor.execute("""
                UPDATE tbl_staff_unavailability 
                SET unavailable_time = NULL 
                WHERE staff_id = %s AND unavailable_date = %s AND unavailable_time = %s
            """, (apt['artist_id'], apt['appointment_date'], apt['time']))
        except Exception as e:
            return jsonify({'error': f"Failed to free up the time slot: {str(e)}"}), 500

        # Commit changes to the database
        conn.commit()

        # Step 6: Optionally send notification email to the user
        try:
            cursor.execute("SELECT email, fullname FROM tbl_users WHERE id = %s", (apt['user_id'],))
            u = cursor.fetchone()
            if u and u.get('email'):
                send_appointment_status_email(
                    email=u['email'], 
                    fullname=u['fullname'], 
                    status='Cancelled', 
                    service=apt.get('service'), 
                    appointment_date=apt.get('appointment_date'), 
                    time=apt.get('time'), 
                    artist_name=apt.get('artist_name')
                )
        except Exception as e:
            # Log or handle the email failure as needed (no action is taken for now)
            pass

        return jsonify({'message': 'Appointment cancelled successfully'}), 200

    except Exception as e:
        return jsonify({'error': f"Error while cancelling the appointment: {str(e)}"}), 500

    finally:
        if conn:
            conn.close()


@app.route("/appointments/available_slots", methods=["GET"])
def get_available_slots():
    date = request.args.get("date")
    staff_id = request.args.get("staff_id")

    if not date or not staff_id:
        return jsonify({"error": "Missing parameters"}), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Fetch unavailable times from tbl_staff_unavailability
    cursor.execute(
        """
        SELECT unavailable_time FROM tbl_staff_unavailability
        WHERE staff_id = %s AND unavailable_date = %s
        ORDER BY unavailable_time ASC
        """,
        (staff_id, date),
    )
    rows = cursor.fetchall()
    unavailable_times = {row["unavailable_time"] for row in rows}

    # Default available slots based on the weekday
    try:
        dt = datetime.strptime(date, "%Y-%m-%d")
        weekday = dt.weekday()  # 0=Monday .. 6=Sunday
    except Exception:
        cursor.close()
        conn.close()
        return jsonify({"available_times": []})

    # Sunday is unavailable by default
    if weekday == 6:
        cursor.close()
        conn.close()
        return jsonify({"available_times": []})

    start_hour = 9
    # Default hours: Mon-Fri 09:00-21:00 (last start 20:00), Sat 09:00-17:00 (last start 16:00)
    end_hour = 17 if weekday == 5 else 21  # Saturday index=5
    default_slots = [f"{h%12 or 12}:{m:02d} {'AM' if h < 12 else 'PM'}" for h in range(start_hour, end_hour) for m in [0]]  # 12-hour format

    # Fetch booked times from tbl_appointment to exclude those
    cursor.execute(
        """
        SELECT time FROM tbl_appointment
        WHERE appointment_date = %s AND artist_id = %s AND status != 'Cancelled'
        """,
        (date, staff_id),
    )
    booked = {row["time"] for row in cursor.fetchall()}

    # Convert unavailable times to 12-hour format with AM/PM
    unavailable_times_12hr = set(
        [datetime.strptime(time, "%H:%M").strftime("%I:%M %p") for time in unavailable_times]
    )

    # Convert booked times to 12-hour format with AM/PM
    booked_12hr = set(
        [datetime.strptime(time, "%H:%M").strftime("%I:%M %p") for time in booked]
    )

    # Combine unavailable times and booked times to get available slots
    all_unavailable_times = unavailable_times_12hr | booked_12hr  # Union of both sets
    available_times = [t for t in default_slots if t not in all_unavailable_times]

    cursor.close()
    conn.close()

    return jsonify({"available_times": available_times})

# =========================================
# ADMIN ENDPOINTS
# =========================================
def is_admin_authenticated():
    # Placeholder: Implement your session/token/cookie check here
    return False

@app.route("/admin/dashboard-data", methods=["GET"])
def admin_dashboard_data():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    # Di napapasa yug value
    # total clients - adjust WHERE clause if your users table differs
    cursor.execute("SELECT COUNT(*) AS total_clients FROM tbl_users WHERE role = 'user'")
    total_clients = cursor.fetchone().get('total_clients', 0)

    # notifications: pending appointments, new feedback (no reply)
    cursor.execute("SELECT COUNT(*) AS pending_appointments FROM tbl_appointment WHERE status = 'Pending'")
    pending = cursor.fetchone().get('pending_appointments', 0)

    cursor.execute("SELECT COUNT(*) AS new_feedback FROM tbl_feedback WHERE reply IS NULL OR reply = ''")
    new_feedback = cursor.fetchone().get('new_feedback', 0)

    # artist performance: name + completed jobs
    cursor.execute("""
        SELECT COALESCE(artist_name, 'Unassigned') AS artist_name, COUNT(*) AS total_jobs
        FROM tbl_appointment
        WHERE status IN ('Done', 'Completed')
        GROUP BY artist_name
        ORDER BY total_jobs DESC
        LIMIT 10
    """)

    artist_performance = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify({
        "total_clients": total_clients,
        "notifications": {
            "pending_appointments": pending,
            "new_feedback": new_feedback
        },
        "artist_performance": artist_performance
    })

@app.route("/admin/appointments/summary", methods=["GET"])
def appointments_summary():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # ✅ More efficient single SQL query instead of looping in Python
    cursor.execute("""
        SELECT 
            COUNT(*) AS totalAppointments,
            SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pendingAppointments,
            SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) AS approvedAppointments
        FROM tbl_appointment
    """)
    summary = cursor.fetchone()

    # ✅ Ensure default values in case of None
    result = {
        "totalAppointments": summary["totalAppointments"] or 0,
        "pendingAppointments": summary["pendingAppointments"] or 0,
        "approvedAppointments": summary["approvedAppointments"] or 0
    }

    cursor.close()
    conn.close()

    return jsonify(result)

@app.route("/admin/appointments/monthly-report", methods=["GET"])
def monthly_report():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # ✅ Defensive: handle missing or invalid dates
    cursor.execute("""
        SELECT service, COUNT(*) AS count
        FROM tbl_appointment
        WHERE appointment_date IS NOT NULL
          AND MONTH(appointment_date) = MONTH(CURRENT_DATE())
          AND YEAR(appointment_date) = YEAR(CURRENT_DATE())
        GROUP BY service
    """)
    report = cursor.fetchall()

    # ✅ Include all services, even if none found
    result = {"haircut": 0, "tattoo": 0}

    for row in report:
        key = (row["service"] or "").strip().lower()
        if key in result:
            result[key] = row["count"]

    cursor.close()
    conn.close()

    return jsonify(result)

@app.route("/admin/staff", methods=["GET"])
def get_staff_by_role():
    role = request.args.get("role")
    if not role:
        return jsonify([])

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id, fullname FROM tbl_users WHERE LOWER(role) = %s", (role,))
    staff = cursor.fetchall()
    cursor.close()
    conn.close()

    return jsonify(staff)

@app.route("/admin/appointments", methods=["GET"])
def get_appointments():
    conn = None
    try:
        # Query params
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        q = request.args.get('q')
        artist = request.args.get('artist')
        sort = request.args.get('sort', 'date')

        offset = max(page - 1, 0) * per_page

        def normalize_status(value):
            mapping = {
                'pending': 'Pending',
                'approved': 'Approved',
                'denied': 'Denied',
                'cancelled': 'Cancelled',
                'completed': 'Completed',
                'abandoned': 'Abandoned',
                'done': 'Done',
                'all': 'All'
            }
            return mapping.get(value.lower(), value.capitalize())

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        where_clauses = []
        params = []

        status = (request.args.get('status') or '').strip().lower()
        exclude_history = request.args.get('exclude_history')
        history_only = request.args.get('history_only')

        if status and status != 'all':
            where_clauses.append("COALESCE(a.status, 'Pending') = %s")
            params.append(status.capitalize())
        elif history_only == '1':
            # only history statuses
            where_clauses.append("COALESCE(a.status, 'Pending') IN ('Completed','Abandoned','Done')")
        elif exclude_history == '1':
            # exclude history statuses
            where_clauses.append("COALESCE(a.status, 'Pending') NOT IN ('Completed','Abandoned','Done')")

        # ✅ Search query
        if q:
            like_q = f"%{q}%"
            where_clauses.append("""
                (a.fullname LIKE %s OR a.service LIKE %s OR 
                 a.artist_name LIKE %s OR CAST(a.id AS CHAR) LIKE %s)
            """)
            params.extend([like_q, like_q, like_q, like_q])

        # ✅ Artist filter
        if artist:
            where_clauses.append("a.artist_name = %s")
            params.append(artist.strip())

        where_sql = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""

        # ✅ Sorting
        sort_map = {
            'date': 'a.appointment_date ASC, a.time ASC',
            'date_desc': 'a.appointment_date DESC, a.time DESC',
            'name': 'a.fullname ASC',
            'service': 'a.service ASC',
            'artist': 'a.artist_name ASC'
        }
        order_sql = sort_map.get(sort, sort_map['date'])

        # ✅ Total count
        count_sql = f"SELECT COUNT(*) AS total FROM tbl_appointment a {where_sql}"
        cursor.execute(count_sql, tuple(params))
        row = cursor.fetchone()
        total = row['total'] if row and 'total' in row else 0

        # ✅ Final query with DISTINCT
        sql = f"""
            SELECT DISTINCT
                a.id, 
                a.fullname, 
                a.service, 
                a.artist_name,
                a.appointment_date, 
                a.time, 
                COALESCE(a.status, 'Pending') AS status
            FROM tbl_appointment a
            {where_sql}
            ORDER BY {order_sql}
            LIMIT %s OFFSET %s
        """

        exec_params = params + [per_page, offset]
        cursor.execute(sql, tuple(exec_params))
        data = cursor.fetchall()
        cursor.close()

        return jsonify({
            "data": data,
            "total": total,
            "page": page,
            "per_page": per_page
        })

    except Exception as e:
        print("Error in get_appointments:", e)
        return jsonify({"error": f"Internal server error: {e}"}), 500
    finally:
        if conn:
            conn.close()

@app.route("/admin/appointments/<int:id>", methods=["PUT"])
def update_appointment(id):
    data = request.get_json(silent=True) or {}
    new_status = data.get("status")

    if not new_status:
        return jsonify({"error": "Missing status field"}), 400

    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("UPDATE tbl_appointment SET status = %s WHERE id = %s", (new_status, id))
        conn.commit()

        cursor.execute(
            """
            SELECT 
                a.fullname, 
                u.email, 
                a.service,
                a.artist_name,
                a.appointment_date, 
                a.time
            FROM tbl_appointment a 
            JOIN tbl_users u ON a.user_id = u.id 
            WHERE a.id = %s
            """,
            (id,),
        )
        user = cursor.fetchone()

        if user and new_status.lower() in ("approved", "denied"):
            send_appointment_status_email(
                email=user["email"],
                fullname=user["fullname"],
                status=new_status,
                artist_name=user["artist_name"],
                service=user["service"],
                appointment_date=user["appointment_date"],
                time=user["time"],
            )

        return jsonify({"message": f"Appointment #{id} updated to {new_status}"}), 200

    except Exception as e:
        print("Error in update_appointment:", e)
        return jsonify({"error": f"Internal server error: {e}"}), 500
    finally:
        try:
            if cursor:
                cursor.close()
        except Exception:
            pass
        try:
            if conn:
                conn.close()
        except Exception:
            pass

@app.route("/staff/unavailability/list", methods=["GET"])
def get_staff_unavailability_list():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT tsu.*, tu.fullname AS staff_name
        FROM tbl_staff_unavailability tsu
        JOIN tbl_users tu ON tsu.staff_id = tu.id
        WHERE tu.role IN ('Barber', 'TattooArtist')
    """)

    results = cursor.fetchall()
    cursor.close()
    conn.close()

    return jsonify(results), 200

@app.route("/admin/users", methods=["GET"])
def get_users():
    conn = None
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        sort = request.args.get('sort', 'name')
        filter_value = request.args.get('filter')

        offset = max(page - 1, 0) * per_page

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        where_clauses = []
        params = []

        if filter_value and filter_value != 'all':
            where_clauses.append("u.role = %s")
            params.append(filter_value)

        where_sql = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""

        sort_map = {
            'name': 'u.fullname ASC',
            'name_desc': 'u.fullname DESC',
            'username': 'u.username ASC',
            'username_desc': 'u.username DESC',
            'role': 'u.role ASC',
            'role_desc': 'u.role DESC',
        }
        order_sql = sort_map.get(sort, sort_map['name'])

        count_sql = f"SELECT COUNT(*) AS total FROM tbl_users u {where_sql}"
        cursor.execute(count_sql, tuple(params))
        total = cursor.fetchone()['total']

        sql = f"""
            SELECT u.id, u.fullname, u.username, u.email, u.role
            FROM tbl_users u
            {where_sql}
            ORDER BY {order_sql}
            LIMIT %s OFFSET %s
        """
        cursor.execute(sql, (*params, per_page, offset))
        data = cursor.fetchall()

        return jsonify({
            "data": data,
            "total": total,
            "page": page,
            "per_page": per_page
        })
    except Exception as e:
        print("Error in get_users:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()

@app.route("/admin/feedback", methods=["GET"])
def get_feedback_admin():
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 50))
        status = request.args.get('status')
        q = request.args.get('q')
        sort = request.args.get('sort', 'date')

        offset = max(page - 1, 0) * per_page

        conn = get_connection()
        cursor = conn.cursor(dictionary=True, buffered=True)

        where_clauses = []
        params = []
        if status == 'resolved':
            where_clauses.append('resolved = 1')
        elif status == 'pending':
            where_clauses.append('resolved = 0')
        if q:
            like_q = f"%{q}%"
            where_clauses.append('(username LIKE %s OR message LIKE %s)')
            params.extend([like_q, like_q])

        where_sql = 'WHERE ' + ' AND '.join(where_clauses) if where_clauses else ''

        sort_map = {
            'date': "date_submitted DESC",
            'rating': "stars DESC"
        }
        order_sql = sort_map.get(sort, sort_map['date'])

        count_sql = f"SELECT COUNT(*) AS total FROM tbl_feedback {where_sql}"
        cursor.execute(count_sql, tuple(params))
        row = cursor.fetchone()
        total = row['total'] if row and 'total' in row else 0

        sql = f"""
            SELECT id, username AS user, stars, message, COALESCE(reply, '') AS reply,
                   resolved,
                   DATE_FORMAT(date_submitted, '%%Y-%%m-%%d %%H:%%i') AS date_submitted
            FROM tbl_feedback
            {where_sql}
            ORDER BY {order_sql}
            LIMIT %s OFFSET %s
        """
        exec_params = params + [per_page, offset]
        cursor.execute(sql, tuple(exec_params))
        feedback = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify({"data": feedback, "total": total, "page": page, "per_page": per_page})
    except Exception as e:
        print("Error in get_feedback_admin:", e)
        return jsonify({"error": str(e)}), 500

@app.route('/admin/add_user', methods=['POST'])
def add_user():
    try:
        data = request.get_json()

        fullname = data.get('fullname')
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        role = data.get('role')

        password = hash_password(password)
        # ✅ Check required fields
        if not all([fullname, username, email, password, role]):
            return jsonify({"error": "Missing required fields"}), 400

        # ✅ Connect to database
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()

        # ✅ Insert user
        query = """
            INSERT INTO tbl_users (fullname, username, email, hash_pass, role)
            VALUES (%s, %s, %s, %s, %s)
        """
        cursor.execute(query, (fullname, username, email, password, role))
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({"message": "User added successfully"}), 201

    except mysql.connector.Error as db_err:
        print("❌ MySQL Error:", db_err)
        return jsonify({"error": str(db_err)}), 500
    except Exception as e:
        print("❌ Server Error:", e)
        return jsonify({"error": str(e)}), 500

@app.route("/admin/feedback/<int:feedback_id>/reply", methods=["POST"])
def admin_reply_feedback(feedback_id):
    data = request.get_json()
    reply = data.get("reply")
    send_email = data.get("sendEmail", False)

    if not reply:
        return jsonify({"message": "Reply cannot be empty."}), 400

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # Check if feedback exists
        cursor.execute("SELECT username, user_id FROM tbl_feedback WHERE id = %s", (feedback_id,))
        feedback = cursor.fetchone()
        if not feedback:
            return jsonify({"message": "Feedback not found."}), 404

        # Save reply to database
        cursor.execute("""
            UPDATE tbl_feedback
            SET reply = %s, resolved = 1
            WHERE id = %s
        """, (reply, feedback_id))
        conn.commit()

        # Optionally send an email if checkbox is checked
        if send_email:
            cursor.execute("SELECT email FROM tbl_users WHERE id = %s", (feedback["user_id"],))
            user = cursor.fetchone()
            if user and user["email"]:
                send_feedback_reply_email(user["email"], feedback["username"], reply)
            else:
                return jsonify({
                    "message": "Reply saved, but user has no email associated."
                }), 200

        return jsonify({"message": "Reply saved successfully!"}), 200

    except Exception as e:
        print("Error in /admin/feedback/reply:", e)
        return jsonify({"message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route("/admin/feedback/<int:feedback_id>/resolve", methods=["POST"])
def toggle_feedback_resolved(feedback_id):
    data = request.get_json()
    resolved_status = 1 if data.get("resolved") else 0 

    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE tbl_feedback
            SET resolved = %s
            WHERE id = %s
        """, (resolved_status, feedback_id))
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"message": "Feedback not found."}), 404

        return jsonify({"message": f"Feedback status updated to resolved={resolved_status}"}), 200

    except Exception as e:
        print("Error in /admin/feedback/resolve:", e)
        return jsonify({"message": str(e)}), 500
    finally:
        if 'conn' in locals() and conn.is_connected():
            cursor.close()
            conn.close()

            
# =========================================
# SERVICES
# =========================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
REACT_PUBLIC_PATH = os.path.join(BASE_DIR, "../marmu-react/public/assets")

# ✅ Serve static images directly
@app.route('/assets/<path:filename>')
def serve_assets(filename):
    return send_from_directory(REACT_PUBLIC_PATH, filename)

# ✅ Return list of tattoo + haircut images
@app.route("/services/images", methods=["GET"])
@app.route("/api/services/images", methods=["GET"])
def get_service_images():
    tattoo_folder = os.path.join(REACT_PUBLIC_PATH, "tattoo_images")
    haircut_folder = os.path.join(REACT_PUBLIC_PATH, "haircut_images")

    def get_images(folder, service_type):
        images = []
        if not os.path.exists(folder):
            return []
        for filename in os.listdir(folder):
            if filename.lower().endswith(".png"):  # ✅ Only .png files
                name = os.path.splitext(filename)[0].replace("_", " ").replace("-", " ").title()
                image_url = f"http://localhost:5000/assets/{service_type}_images/{filename}"
                images.append({"name": name, "image": image_url})
        return sorted(images, key=lambda x: x["name"])

    tattoos = get_images(tattoo_folder, "tattoo")
    haircuts = get_images(haircut_folder, "haircut")

    return jsonify({
        "tattoos": tattoos,
        "haircuts": haircuts,
        "total": len(tattoos) + len(haircuts)
    }), 200

if __name__ == "__main__":
    app.run(debug=True)
