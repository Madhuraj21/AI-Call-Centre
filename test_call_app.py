from flask import Flask, request, jsonify, send_from_directory, g, session
from twilio.twiml.voice_response import VoiceResponse, Say
from twilio.jwt.access_token import AccessToken
from twilio.jwt.access_token.grants import VoiceGrant
from twilio.rest import Client
from flask_cors import CORS
import os
import sqlite3
from datetime import datetime, timedelta
from functools import wraps
import logging
from dotenv import load_dotenv
import psycopg2 # Import psycopg2
import psycopg2.extras # Import psycopg2.extras for DictCursor

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
# Configure CORS to allow requests from the Next.js frontend
CORS(app, resources={
    r"/*": {
        "origins": "*", # Allow all origins temporarily
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})
# Replace with a real secret key in production!
app.secret_key = os.environ.get('SECRET_KEY', 'a_very_secret_key_for_dev')

# Database configuration - Use DATABASE_URL environment variable for PostgreSQL
DATABASE_URL = os.environ.get('DATABASE_URL')

if not DATABASE_URL:
    logger.error("DATABASE_URL environment variable is not set.")
    # In a real app, you might want to raise an error or exit here
    # For now, let's allow it to run, but db operations will fail.

def get_db():
    """Get database connection for PostgreSQL."""
    if not DATABASE_URL:
        logger.error("Cannot connect to database, DATABASE_URL is not set.")
        return None # Or raise an exception
        
    if not hasattr(g, '_database'):
        try:
            # Connect to PostgreSQL using the URL
            # Use DictCursor to fetch rows as dictionaries
            g._database = psycopg2.connect(DATABASE_URL)
        except Exception as e:
            logger.error(f"Database connection error: {str(e)}")
            # Store the error on g so we don't try to reconnect repeatedly
            g._database_error = e
            raise # Re-raise the exception after logging
    
    # If there was a connection error on a previous call within the same request context
    if hasattr(g, '_database_error') and g._database_error is not None:
         raise g._database_error # Re-raise the stored error
         
    return g._database

def close_connection(exception=None):
    """Close database connection for PostgreSQL."""
    db = getattr(g, '_database', None)
    if db is not None:
        try:
            db.close()
            logger.info("Database connection closed.")
        except Exception as e:
            logger.error(f"Error closing database connection: {str(e)}")
    # Clear any stored error on this context
    if hasattr(g, '_database_error'):
        del g._database_error

# Register the close_connection function with the app teardown
app.teardown_appcontext(close_connection)

def init_db():
    """Initialize PostgreSQL database tables if they don't exist."""
    if not DATABASE_URL:
        logger.error("Cannot initialize database, DATABASE_URL is not set.")
        return
        
    try:
        # Connect and create tables outside of request context
        with app.app_context():
            db = get_db()
            if db is None: # Handle case where get_db returns None due to missing URL
                 logger.error("Failed to get DB connection for initialization.")
                 return
                 
            cursor = db.cursor(cursor_factory=psycopg2.extras.DictCursor)
            
            # Create agents table with PostgreSQL syntax (SERIAL for auto-increment)
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS agents (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    phone_number VARCHAR(255) NOT NULL UNIQUE,
                    status VARCHAR(50) NOT NULL DEFAULT 'offline',
                    last_status_update TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            ''')
            
            # Create calls table with PostgreSQL syntax
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS calls (
                    id SERIAL PRIMARY KEY,
                    call_sid VARCHAR(255) UNIQUE,
                    caller_number VARCHAR(255) NOT NULL,
                    agent_id INTEGER REFERENCES agents(id),
                    start_time TIMESTAMP WITH TIME ZONE,
                    end_time TIMESTAMP WITH TIME ZONE,
                    duration INTEGER, -- in seconds
                    status VARCHAR(50),
                    recording_url VARCHAR(255),
                    ai_interaction_summary TEXT
                );
            ''')
            
            db.commit()
            logger.info("PostgreSQL database tables checked/created.")
            
            # Add mock agents only if the table is empty
            cursor.execute("SELECT COUNT(*) FROM agents;")
            count = cursor.fetchone()[0]
            if count == 0:
                mock_agents = [
                    ("Sarah Johnson", "+919325484855", "available"),
                    ("Mike Chen", "+15552345678", "offline"),
                    ("Emily Rodriguez", "+15553456789", "available"),
                    ("David Kim", "+15554567890", "offline"),
                ]
                # Use executemany with a list of tuples
                cursor.executemany(
                    "INSERT INTO agents (name, phone_number, status) VALUES (%s, %s, %s);",
                    mock_agents
                )
                db.commit()
                logger.info("PostgreSQL database initialized with mock agents.")
            else:
                logger.info("PostgreSQL agents table already contains data.")
                
    except Exception as e:
        logger.error(f"PostgreSQL database initialization error: {str(e)}")
        # Depending on severity, you might want to exit the app here
        # import sys
        # sys.exit(1)
        # For now, we log and let the app try to run (though db operations will fail)

# Initialize database when app starts (ensure this runs on import by Gunicorn)
init_db()

# Add error handler for PostgreSQL errors
@app.errorhandler(psycopg2.Error)
def handle_db_error(error):
    logger.error(f"PostgreSQL database error: {str(error)}")
    # Ensure connection is closed in case of error during request
    close_connection()
    return jsonify({
        "error": "Database error occurred",
        "details": str(error)
    }), 500

# Add error handler for JSON responses
@app.errorhandler(Exception)
def handle_error(error):
    response = {
        "error": str(error),
        "status_code": getattr(error, 'code', 500)
    }
    return jsonify(response), getattr(error, 'code', 500)

# Add a decorator to ensure JSON responses
def json_response(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            result = f(*args, **kwargs)
            if isinstance(result, tuple):
                response, status_code = result
            else:
                response, status_code = result, 200
            return jsonify(response), status_code
        except Exception as e:
            return handle_error(e)
    return decorated_function

# Twilio credentials
# Load from environment variables for security
TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN')

# TODO: Add error handling if environment variables are not set in production
if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
    logger.error("TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN environment variables are not set.")
    # Depending on requirements, you might want to raise an exception or exit here

# Initialize Twilio client
# Ensure credentials are not None before initializing
client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN else None

@app.route("/voice", methods=['GET', 'POST'])
def voice():
    """
    This endpoint is called by Twilio when an outbound call connects (from /request_call).
    It initiates the conversation by asking for the user's name.
    """
    resp = VoiceResponse()
    # Use <Gather> to collect the user's name
    gather = resp.gather(input='speech', action='/gather_name', method='POST', speechTimeout='auto')
    gather.say("Welcome to our call center. To help us direct your call, please state your full name.", voice='woman', language='en-US')
    return str(resp)

@app.route("/gather_name", methods=['POST'])
def gather_name():
    """
    Processes the collected name and asks for the user's age.
    """
    resp = VoiceResponse()
    if 'SpeechResult' in request.form:
        name = request.form['SpeechResult']
        # Store name and CallSid in session for later use
        session['caller_name'] = name
        session['call_sid'] = request.form.get('CallSid') # Store CallSid from Twilio request

        gather = resp.gather(input='speech', action='/gather_age', method='POST', speechTimeout='auto')
        gather.say(f"Thank you, {name}. Now, please state your age.", voice='woman', language='en-US')
    else:
        resp.say("I didn't catch your name. Please state your full name.", voice='woman', language='en-US')
        resp.redirect('/voice') # Redirect back to ask for name again
    return str(resp)

@app.route("/gather_age", methods=['POST'])
def gather_age():
    """
    Processes the collected age, confirms the information, and attempts to transfer to an available agent.
    """
    resp = VoiceResponse()
    name = session.get('caller_name', 'caller') # Get name from session
    call_sid = session.get('call_sid') # Get CallSid from session

    if 'SpeechResult' in request.form:
        age = request.form['SpeechResult']
        print(f"Collected Name: {name}, Age: {age}")

        db = get_db()
        cursor = db.cursor()

        # Update call record with collected AI interaction summary
        if call_sid:
            ai_summary = f"Name: {name}, Age: {age}"
            cursor.execute("UPDATE calls SET ai_interaction_summary = %s WHERE call_sid = %s", (ai_summary, call_sid))
            db.commit()
            print(f"Updated call {call_sid} with AI summary.")


        cursor.execute("SELECT id, phone_number FROM agents WHERE status = %s LIMIT 1", ('available',))
        agent = cursor.fetchone()

        if agent:
            agent_id = agent['id']
            agent_phone_number = agent['phone_number']
            # Update agent status to 'on_call'
            cursor.execute("UPDATE agents SET status = %s, last_status_update = CURRENT_TIMESTAMP WHERE id = %s", ('on_call', agent_id))
            # Link call record to agent
            if call_sid:
                 cursor.execute("UPDATE calls SET agent_id = %s, status = %s WHERE call_sid = %s", (agent_id, 'transferred', call_sid))
                 db.commit()
                 print(f"Linked call {call_sid} to agent {agent_id} and updated status to transferred.")


            resp.say(f"Thank you, {name}. You stated your age as {age}. Please wait while I connect you to an available agent.", voice='woman', language='en-US')
            resp.dial(agent_phone_number)
            print(f"Attempting to connect to agent: {agent_phone_number}")
        else:
            resp.say("Thank you, {name}. You stated your age as {age}. Unfortunately, no agents are currently available. Please try again later.", voice='woman', language='en-US')
            resp.hangup()
            print("No agents available. Hanging up.")

        # Clear session data after processing
        session.pop('caller_name', None)
        session.pop('call_sid', None)

    else:
        resp.say("I didn't catch your age. Please state your age.", voice='woman', language='en-US')
        # Redirect back to ask for age again, name is in session
        resp.redirect('/gather_age')
    return str(resp)

@app.route("/token", methods=['GET'])
@json_response
def get_token():
    """Generate a Twilio Access Token for the client."""
    try:
        # Generate a unique identity for the client
        identity = f"agent_{datetime.now().timestamp()}"
        
        # Create an Access Token
        token = AccessToken(
            TWILIO_ACCOUNT_SID,
            TWILIO_AUTH_TOKEN,
            identity=identity
        )
        
        # Create a Voice grant and add it to the token
        voice_grant = VoiceGrant(
            outgoing_application_sid=TWILIO_ACCOUNT_SID,
            incoming_allow=True
        )
        token.add_grant(voice_grant)
        
        # Generate the token
        token_str = token.to_jwt()
        
        logger.info(f"Successfully generated token for identity: {identity}")
        return {
            "token": token_str,
            "identity": identity,
            "expires_in": 3600  # Token expiration in seconds
        }
    except Exception as e:
        logger.error(f"Error generating token: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route("/api/agents", methods=['GET'])
@json_response
def get_agents():
    """Retrieve a list of all agents."""
    try:
        db = get_db()
        cursor = db.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute("SELECT id, name, phone_number, status, last_status_update FROM agents")
        agents = cursor.fetchall()
        # Convert to list of standard Python dictionaries
        agents_list = [dict(agent) for agent in agents]
        return {"data": agents_list}
    except Exception as e:
        # Use logger for better visibility on Render
        logger.error(f"Error fetching agents: {e}")
        # Re-raise the exception to trigger the app's error handler
        raise

@app.route("/api/agents/<int:agent_id>/status", methods=['PUT'])
@json_response
def update_agent_status(agent_id):
    """Update an agent's status."""
    data = request.get_json()
    if not data:
        raise ValueError("No JSON data provided")
        
    status = data.get('status')
    if not status or status not in ['available', 'on_call', 'unavailable', 'offline']:
        raise ValueError("Invalid status provided")

    db = get_db()
    cursor = db.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cursor.execute(
        'UPDATE agents SET status = %s, last_status_update = %s WHERE id = %s',
        (status, datetime.now(), agent_id)
    )
    db.commit()

    if cursor.rowcount == 0:
        raise ValueError("Agent not found")

    # Fetch the updated agent using the DictCursor
    cursor.execute('SELECT id, name, phone_number, status, last_status_update FROM agents WHERE id = %s', (agent_id,))
    agent = cursor.fetchone()
    return agent

@app.route("/request_call", methods=['POST'])
def request_call():
    """Initiate an outbound call to the provided number."""
    data = request.get_json()
    to_phone_number = data.get('phoneNumber') or data.get('phone_number')
    if not to_phone_number:
        return jsonify({"error": "Phone number is required"}), 400
    TWILIO_PHONE_NUMBER = "+19787836427" # Your Twilio US number
    # Replace with your deployed backend URL on Render (e.g., https://your-app-name.onrender.com)
    DEPLOYED_BACKEND_URL = "https://ai-call-centre-backend.onrender.com"

    try:
        call = client.calls.create(
            to=to_phone_number,
            from_=TWILIO_PHONE_NUMBER,
            # Replace with your deployed backend URL + /voice endpoint
            url=f"{DEPLOYED_BACKEND_URL}/voice",
            # Replace with your deployed backend URL + /twilio_status_callback endpoint
            status_callback=f"{DEPLOYED_BACKEND_URL}/twilio_status_callback",
            status_callback_event=['initiated', 'ringing', 'answered', 'completed', 'failed', 'no-answer', 'busy', 'canceled']
        )
        db = get_db()
        cursor = db.cursor()
        cursor.execute("INSERT INTO calls (call_sid, caller_number, start_time, status) VALUES (%s, %s, %s, %s)", (call.sid, to_phone_number, datetime.now(), 'initiated'))
        db.commit()
        print(f"Logged initiated call for {to_phone_number} with CallSid: {call.sid}")
        return jsonify({"message": f"Call initiated successfully! Call SID: {call.sid}"}), 200
    except Exception as e:
        print(f"Error initiating call for {to_phone_number}: {e}")
        return jsonify({"error": f"Error initiating call: {e}"}), 500

@app.route('/api/calls', methods=['GET'])
def get_calls():
    """Return all call logs."""
    db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT * FROM calls ORDER BY start_time DESC")
    calls = cursor.fetchall()
    return jsonify([dict(call) for call in calls]), 200

@app.route('/api/metrics/daily_calls', methods=['GET'])
@json_response
def get_daily_calls():
    """Return call statistics for today and yesterday."""
    db = get_db()
    # Ensure DictCursor is used
    cursor = db.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    # Get today's date in UTC
    today = datetime.utcnow().date()
    yesterday = today - timedelta(days=1)
    
    # Get total calls for today
    cursor.execute("""
        SELECT COUNT(*) as total
        FROM calls
        WHERE start_time::DATE = %s
    """, (today,))
    today_calls = cursor.fetchone()['total']
    
    # Get total calls for yesterday
    cursor.execute("""
        SELECT COUNT(*) as total
        FROM calls
        WHERE start_time::DATE = %s
    """, (yesterday,))
    yesterday_calls = cursor.fetchone()['total']
    
    # Calculate percentage change
    change = 0
    if yesterday_calls > 0:
        change = ((today_calls - yesterday_calls) / yesterday_calls) * 100
    
    return {
        'total': today_calls,
        'change': round(change, 1)
    }

@app.route('/api/metrics/avg_call_duration', methods=['GET'])
@json_response
def get_avg_call_duration():
    """Return average call duration for completed calls."""
    db = get_db()
    # Ensure DictCursor is used
    cursor = db.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    # Get average duration for completed calls in the last 24 hours
    # Use EXTRACT(EPOCH FROM ...) for duration in seconds in PostgreSQL
    cursor.execute("""
        SELECT AVG(EXTRACT(EPOCH FROM (end_time - start_time))) as avg_duration
        FROM calls
        WHERE status = 'completed'
        AND start_time >= CURRENT_TIMESTAMP - INTERVAL '1 day'
        AND end_time IS NOT NULL -- Ensure end_time is not null for duration calculation
    """)
    result = cursor.fetchone()
    # Handle None if no completed calls
    avg_duration = result['avg_duration'] if result and result['avg_duration'] is not None else 0
    
    # Get average duration for completed calls in the previous 24 hours
     # Use EXTRACT(EPOCH FROM ...) for duration in seconds in PostgreSQL
    cursor.execute("""
        SELECT AVG(EXTRACT(EPOCH FROM (end_time - start_time))) as avg_duration
        FROM calls
        WHERE status = 'completed'
        AND start_time >= CURRENT_TIMESTAMP - INTERVAL '2 days'
        AND start_time < CURRENT_TIMESTAMP - INTERVAL '1 day'
        AND end_time IS NOT NULL -- Ensure end_time is not null for duration calculation
    """)
    result = cursor.fetchone()
    # Handle None if no completed calls in previous period
    prev_avg_duration = result['avg_duration'] if result and result['avg_duration'] is not None else 0
    
    # Calculate percentage change
    change = 0
    if prev_avg_duration > 0:
        change = ((avg_duration - prev_avg_duration) / prev_avg_duration) * 100
    
    return {
        'seconds': round(avg_duration),
        'change': round(change, 1)
    }

@app.route('/api/metrics/agent_availability', methods=['GET'])
@json_response
def get_agent_availability():
    """Return current agent availability statistics."""
    db = get_db()
    # Ensure DictCursor is used
    cursor = db.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    # Get total number of agents
    cursor.execute("SELECT COUNT(*) as total FROM agents")
    total_agents = cursor.fetchone()['total']
    
    # Get count of agents by status
    cursor.execute("""
        SELECT status, COUNT(*) as count
        FROM agents
        GROUP BY status
    """)
    status_counts = {row['status']: row['count'] for row in cursor.fetchall()}
    
    return {
        'available': status_counts.get('available', 0),
        'on_call': status_counts.get('on_call', 0),
        'offline': status_counts.get('offline', 0),
        'total': total_agents
    }

@app.route("/")
def index():
    """Serve the request_callback.html file."""
    return send_from_directory('.', 'request_callback.html')

if __name__ == "__main__":
    app.run(debug=True)