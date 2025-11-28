# WebSocket Live Refresh Implementation

## Overview
This application now uses **Flask-SocketIO** to push real-time updates to all connected clients. When the backend updates data (teams, config, timer, etc.), all viewing devices automatically refresh.

## How It Works

### Backend (Flask-SocketIO)
1. **SocketIO Integration**: The Flask app is wrapped with SocketIO to enable WebSocket support
2. **Broadcast Events**: When data changes, `trigger_refresh()` broadcasts a `refresh_page` event to all connected clients
3. **Auto-triggered on**:
   - Team add/update/delete
   - Config updates (timer, notes, layout)
   - Action triggers (sound, TTS)

### Frontend (Socket.IO Client)
1. **Connection**: Each page automatically connects to the WebSocket server on load
2. **Event Listener**: Listens for `refresh_page` events from the backend
3. **Auto-refresh**: When event received, page reloads to display latest data

## Key Files Modified

### Backend
- `app.py`: Added SocketIO initialization and `trigger_refresh()` function
- `requirements.txt`: Added `flask-socketio`, `python-socketio`, `eventlet`

### Frontend
- `index.html`: Added Socket.IO client library
- `admin.html`: Added Socket.IO client library
- `app.js`: WebSocket connection and refresh handler
- `admin.js`: WebSocket connection (optional for admin notifications)

## Running the Application

### Start the Server
```bash
cd backend
python app.py
```

The server will run on `http://localhost:5000` with WebSocket support.

### How to Test
1. Open the main display page: `http://localhost:5000/`
2. Open the admin panel: `http://localhost:5000/admin/`
3. Make changes in the admin panel (add a team, update timer, etc.)
4. Watch the main display page automatically refresh to show the changes!

## Customization Options

### Change Refresh Behavior
In `app.js`, you can modify the `refresh_page` event handler:

```javascript
socket.on('refresh_page', (data) => {
    // Option 1: Full page reload (current implementation)
    window.location.reload();
    
    // Option 2: Soft refresh (update data only, no reload)
    // fetchInitialData();
    
    // Option 3: Show notification and let user manually refresh
    // showNotification("Updates available! Click to refresh.");
});
```

### Add Custom Events
You can emit custom events for specific updates:

**Backend:**
```python
# In app.py
socketio.emit('timer_update', {'state': 'running'}, broadcast=True)
```

**Frontend:**
```javascript
// In app.js
socket.on('timer_update', (data) => {
    console.log('Timer updated:', data);
    updateTimer(data);
});
```

### Control Who Receives Updates
You can use rooms to target specific groups:

**Backend:**
```python
# Join a room
@socketio.on('join_display')
def on_join_display():
    join_room('display')

# Emit to specific room
socketio.emit('refresh_page', {}, room='display')
```

## Deployment Notes

### Production Server
For production, use `gunicorn` with gevent worker:

```bash
pip install gevent gevent-websocket
gunicorn --worker-class gevent -w 1 --bind 0.0.0.0:5000 app:app
```

**Note**: 
- With WebSocket, use `-w 1` (single worker) as WebSocket connections need sticky sessions
- For Python 3.13, we use threading mode instead of eventlet (compatibility issues)
- For production on older Python versions, you can use eventlet worker class

### Environment Variables
Make sure these are set in your `.env`:
```
FLASK_SECRET_KEY=your-secret-key
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
```

## Troubleshooting

### WebSocket Connection Fails
- Check that the server is running with `socketio.run(app)` not `app.run()`
- Verify Socket.IO client version matches server version (4.5.4)
- Check browser console for connection errors

### Page Doesn't Refresh
- Verify `trigger_refresh()` is being called in backend
- Check browser console for `refresh_page` event logs
- Ensure Socket.IO client library is loaded before your custom JS

### Multiple Refreshes
- This can happen if multiple events are emitted quickly
- Consider adding a debounce/throttle mechanism if needed

## Benefits

✅ **Real-time Updates**: All devices see changes instantly  
✅ **No Polling**: Efficient WebSocket connection vs. constant API calls  
✅ **Simple Integration**: Minimal code changes required  
✅ **Scalable**: Handles multiple simultaneous viewers  
✅ **Automatic Reconnection**: Socket.IO handles reconnects automatically  

## Next Steps

- Add more granular events (e.g., `team_added`, `timer_started`)
- Implement rooms for different display groups
- Add user presence tracking (show connected devices count)
- Add offline/reconnection notifications
