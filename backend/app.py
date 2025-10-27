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

# =====================================================
# ✉️ Send OTP Email (Styled)
# =====================================================
def send_email_otp(email, subject, otp):
    html_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
            <h2 style="color: #0078d7; text-align: center;">Marmu Barber & Tattoo Shop</h2>
            <p style="font-size: 16px; color: #333;">Hi there,</p>
            <p style="font-size: 16px; color: #333;">Use the following One-Time Password (OTP) to reset your password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <span style="font-size: 32px; font-weight: bold; color: #ffffff; background-color: #0078d7; padding: 15px 25px; border-radius: 4px; letter-spacing: 5px;">
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
    msg["From"] = YOUR_GMAIL
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
        <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
            <h2 style="color: #0078d7; text-align: center;">Marmu Barber & Tattoo Shop</h2>
            <p style="font-size: 16px; color: #333;">Hi {username},</p>
            <p style="font-size: 16px; color: #333;">Thank you for your feedback! We truly appreciate your time and support.</p>
            
            <div style="background-color: #f8f9fa; padding: 15px 20px; border-left: 4px solid #0078d7; margin: 25px 0; border-radius: 5px;">
                <p style="font-size: 15px; color: #333; margin: 0;">
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
    msg["From"] = YOUR_GMAIL
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

def send_appointment_status_email(email, fullname, status, service=None, appointment_date=None, time=None):
    try:
        subject = f"Your Appointment has been {status}"
        
        # ✅ Create a beautiful HTML email
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
            <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                <h2 style="color: #0078d7; text-align: center;">Marmu Barber & Tattoo Shop</h2>
                <p style="font-size: 16px; color: #333;">Hi {fullname},</p>
                <p style="font-size: 16px; color: #333;">
                    We wanted to let you know that your appointment has been 
                    <strong style="color: {'#28a745' if status.lower() == 'approved' else '#d9534f'};">{status}</strong>.
                </p>

                <div style="background-color: #f8f9fa; padding: 15px 20px; border-radius: 6px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Service:</strong> {service or 'N/A'}</p>
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
        msg["From"] = YOUR_GMAIL
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

        cursor.execute("""
            INSERT INTO tbl_feedback (user_id, username, stars, message, date_submitted)
            VALUES (%s, %s, %s, %s, %s)
        """, (result[0], username, stars, message, datetime.now()))
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
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT username, fullname, hash_pass, role 
            FROM tbl_users 
            WHERE username = %s OR email = %s
        """, (username_or_email, username_or_email))
        user = cursor.fetchone()

        if not user or hash_password(password) != user["hash_pass"]:
            return jsonify({"error": "Invalid username/email or password"}), 401

        session["username"] = user["username"]
        session["fullname"] = user["fullname"]
        session["role"] = user["role"]

        return jsonify({
            "message": f"Welcome, {user['fullname']}",
            "username": user["username"],
            "fullname": user["fullname"],
            "role": user["role"]
        }), 200

    except mysql.connector.Error as err:
        return jsonify({"error": f"Database error: {err}"}), 500
    finally:
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

# @app.route("/available-staff/<day>", methods=["GET"])
# def get_available_staff(day):
#     conn = get_connection()
#     cursor = conn.cursor(dictionary=True)
#     cursor.execute("""
#         SELECT staff_id, staff_name, start_time, end_time
#         FROM tbl_staff_availability
#         WHERE day_of_week = %s AND is_available = 1
#     """, (day,))
#     staff = cursor.fetchall()
#     cursor.close()
#     conn.close()
#     return jsonify(staff)

@app.route("/api/current_user")
def current_user():
    if 'username' in session:
        return jsonify({
            "username": session['username'],
            "fullname": session['fullname']
        })
    return jsonify({"error": "Not logged in"}), 401

@app.route("/api/bookings", methods=["POST"])
def create_booking():
    data = request.get_json()
    username, fullname, service, date, time = (
        data.get("username"),
        data.get("fullname"),
        data.get("service"),
        data.get("date"),
        data.get("time"),
    )
    remarks = data.get("remarks", "")

    if not all([username, fullname, service, date, time]):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM tbl_users WHERE username=%s", (username,))
        user = cursor.fetchone()
        if not user:
            return jsonify({"error": "User not found"}), 404

        cursor.execute("""
            SELECT id FROM tbl_appointment 
            WHERE appointment_date=%s AND time=%s AND status != 'Cancelled'
        """, (date, time))
        if cursor.fetchone():
            return jsonify({"error": "This time slot is already booked"}), 409

        cursor.execute("""
            INSERT INTO tbl_appointment (user_id, fullname, service, appointment_date, time, remarks, status)
            VALUES (%s, %s, %s, %s, %s, %s, 'Pending')
        """, (user[0], fullname, service, date, time, remarks))
        conn.commit()
        return jsonify({"message": "Booking created successfully!", "status": "Pending"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
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

@app.route("/appointments/available_slots", methods=["GET"])
def get_available_slots():
    date = request.args.get("date")  # instead of "appointment_date"
    if not date:
        return jsonify({"error": "Date parameter required"}), 400

    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT time FROM tbl_appointment
            WHERE appointment_date=%s AND status != 'Cancelled'
        """, (date,))
        booked_times = [row[0] for row in cursor.fetchall()]
        return jsonify({"appointment_date": date, "booked_times": booked_times}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

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

    # total clients - adjust WHERE clause if your users table differs
    cursor.execute("SELECT COUNT(*) AS total_clients FROM tbl_users WHERE role = 'client'")
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
        WHERE status = 'Done' OR status = 'Completed'
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


@app.route("/admin/appointments", methods=["GET"])
def get_appointments():
    conn = None # Initialize conn
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, fullname, service, appointment_date, time, COALESCE(status, 'Pending') AS status FROM tbl_appointment")
        data = cursor.fetchall()
        cursor.close()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": f"Internal server error: {e}"}), 500
    finally:
        if conn:
            conn.close()

@app.route("/admin/appointments/<int:id>", methods=["PUT"])
def update_appointment(id):
    data = request.get_json()
    new_status = data.get("status")

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # ✅ Update appointment status
    cursor.execute("UPDATE tbl_appointment SET status=%s WHERE id=%s", (new_status, id))
    conn.commit()

    # ✅ Fetch user email and fullname (assuming you have user_id in tbl_appointment)
    cursor.execute("""
        SELECT a.fullname, u.email, a.service, a.appointment_date, a.time
        FROM tbl_appointment a 
        JOIN tbl_users u ON a.user_id = u.id 
        WHERE a.id = %s
    """, (id,))
    user = cursor.fetchone()

    user and new_status.lower() == {'approved', 'denied'}
        
    send_appointment_status_email(
        user.get('email'),
        user.get('fullname'),
        new_status,
        service=user.get('service'),
        appointment_date=user.get('appointment_date'),
        time=user.get('time')
    )

    cursor.close()
    conn.close()
    return jsonify({"message": f"Appointment #{id} updated to {new_status}"}), 200

@app.route("/admin/users", methods=["GET"])
def get_users():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT fullname, username, email, role FROM tbl_users")
    users = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(users)

@app.route("/admin/feedback", methods=["GET"])
def get_feedback_admin():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT id, username AS user, stars, message, COALESCE(reply, '') AS reply,
               resolved,
               DATE_FORMAT(date_submitted, '%Y-%m-%d %H:%i') AS date_submitted
        FROM tbl_feedback
        ORDER BY date_submitted DESC
    """)
    feedback = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(feedback)

@app.route('/admin/add_user', methods=['POST'])
def add_user():
    try:
        data = request.get_json()

        fullname = data.get('fullname')
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        role = data.get('role')

        
        password = generate_password_hash(password)
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
# =========================================
# MAIN ENTRY
# =========================================
if __name__ == "__main__":
    app.run(debug=True)
