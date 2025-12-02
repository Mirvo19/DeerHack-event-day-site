document.addEventListener('DOMContentLoaded', () => {
    const authContainer = document.getElementById('auth-container');
    const dashboardContainer = document.getElementById('dashboard-container');
    
    // --- WebSocket Connection for Live Updates ---
    const socket = io();
    
    socket.on('connect', () => {
        console.log('Admin connected to WebSocket server');
    });
    
    socket.on('refresh_page', (data) => {
        console.log('Refresh event received in admin:', data);
        // Optionally reload audit logs or show notification
        // For now, just log - admins usually don't need auto-refresh
    });
    
    socket.on('disconnect', () => {
        console.log('Admin disconnected from WebSocket server');
    });
    
    // --- API Client ---
    // A simple wrapper for jQuery AJAX calls
    const apiClient = {
        login: (email, password) => $.ajax({
            url: '/admin/api/auth/login',
            type: 'POST',
            data: JSON.stringify({ email, password }),
            contentType: 'application/json'
        }),
        logout: () => $.post('/admin/api/auth/logout'),
        getStatus: () => $.get('/admin/api/auth/status'),
        
        getConfig: () => $.get('/admin/api/config'),
        updateConfig: (data) => $.ajax({
            url: '/admin/api/config',
            type: 'POST',
            data: JSON.stringify(data),
            contentType: 'application/json'
        }),
        
        getTeams: () => $.get('/admin/api/teams'),
        updateTeams: (teams) => $.ajax({
            url: '/admin/api/teams',
            type: 'POST',
            data: JSON.stringify({ teams }),
            contentType: 'application/json'
        }),
        addTeam: (name) => $.ajax({
            url: '/admin/api/teams',
            type: 'POST',
            data: JSON.stringify({ name }),
            contentType: 'application/json'
        }),
        deleteTeam: (id) => $.ajax({
            url: `/admin/api/teams/${id}`,
            type: 'DELETE'
        }),
        
        playAction: (action) => $.ajax({
            url: '/admin/api/action/play',
            type: 'POST',
            data: JSON.stringify(action),
            contentType: 'application/json'
        }),
        
        getAuditLogs: () => $.get('/admin/api/audit')
    };

    // --- Authentication Manager ---
    function initAuth() {
        apiClient.getStatus().done(res => {
            if (res.logged_in) {
                showDashboard(res.email);
            } else {
                showLoginForm();
            }
        }).fail(() => showLoginForm());
    }

    function showLoginForm() {
        authContainer.innerHTML = `
            <div class="min-h-screen flex items-center justify-center p-4">
                <div class="login-container max-w-md w-full p-8 rounded-lg shadow-2xl">
                    <h1 class="text-4xl font-bold mb-2 text-center gradient-header" style="font-family: 'Orbitron', sans-serif;">
                        Admin Panel
                    </h1>
                    <p class="text-gray-400 text-center mb-8">Access the event control center</p>
                    
                    <form id="login-form" class="space-y-4">
                        <div>
                            <label for="email" class="block text-sm font-medium mb-2">Email</label>
                            <input 
                                type="email" 
                                id="email" 
                                class="input-field w-full px-4 py-3 rounded-lg text-white" 
                                placeholder="admin@example.com"
                                required
                            >
                        </div>
                        <div>
                            <label for="password" class="block text-sm font-medium mb-2">Password</label>
                            <input 
                                type="password" 
                                id="password" 
                                class="input-field w-full px-4 py-3 rounded-lg text-white" 
                                placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
                                required
                            >
                        </div>
                        <br>
                        <br>
                        <p id="login-error" class="text-red-400 text-sm hidden"></p>
                        <button 
                            type="submit" 
                            class="login-btn w-full py-3 px-6 rounded-lg font-bold text-white"
                            style="font-family: 'Orbitron', sans-serif;"
                        >
                            Login
                        </button>
                    </form>
                    
                </div>
            </div>
        `;
        dashboardContainer.classList.add('hidden');
        authContainer.classList.remove('hidden');

        $('#login-form').on('submit', e => {
            e.preventDefault();
            const email = $('#email').val();
            const password = $('#password').val();
            const errorEl = $('#login-error');
            errorEl.addClass('hidden');
            
            apiClient.login(email, password)
                .done(() => {
                    window.location.reload();
                })
                .fail(res => {
                    errorEl.text(res.responseJSON?.error || 'Login failed.').removeClass('hidden');
                });
        });
    }

    function showDashboard(username) {
        authContainer.classList.add('hidden');
        dashboardContainer.classList.remove('hidden');
        renderDashboard(username);
    }

    // --- Dashboard Rendering and Logic ---
    function renderDashboard(email) {
        dashboardContainer.innerHTML = `
            <div class="mb-8">
                <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h1 class="text-4xl md:text-5xl font-bold gradient-header" style="font-family: 'Orbitron', sans-serif;">
                        Admin Dashboard
                    </h1>
                    <div class="flex items-center gap-4">
                        <span class="text-gray-400 text-sm">Welcome, <span class="text-blue-400 font-semibold">${email}</span></span>
                        <button id="logout-btn" class="btn-danger py-2 px-6 rounded-lg font-bold text-white">
                            Logout
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- Timer Controls -->
                <div class="admin-card p-6 rounded-lg col-span-1 md:col-span-2">
                    <h2 class="section-title text-2xl mb-4 text-blue-400">⏱️ Timer Controls</h2>
                    <div class="flex flex-wrap items-center gap-2 mb-4">
                        <input type="number" id="timer-duration" class="input-field p-3 rounded-lg w-32 text-white" placeholder="Seconds">
                        <button id="set-timer-btn" class="btn-primary py-2 px-4 rounded-lg font-semibold text-white">Set Duration</button>
                        <button id="start-timer-btn" class="btn-success py-2 px-4 rounded-lg font-semibold text-white">Start</button>
                        <button id="pause-timer-btn" class="btn-warning py-2 px-4 rounded-lg font-semibold text-white">Pause</button>
                        <button id="reset-timer-btn" class="btn-danger py-2 px-4 rounded-lg font-semibold text-white">Reset</button>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                            <label class="text-sm block mb-2 font-medium">Timer Font Size (px)</label>
                            <input type="number" id="timer-font-size" class="input-field p-2 rounded-lg w-full text-white" min="24" max="200" value="64">
                        </div>
                        <div>
                            <label class="text-sm block mb-2 font-medium">Timer Color</label>
                            <input type="color" id="timer-color" class="input-field p-2 rounded-lg w-full h-12" value="#ffffff">
                        </div>
                    </div>
                    <button id="update-timer-style-btn" class="btn-primary py-2 px-4 rounded-lg mt-4 w-full font-semibold">Update Timer Style</button>
                </div>

                <!-- Team Management -->
                <div class="admin-card p-6 rounded-lg row-span-2">
                    <h2 class="section-title text-2xl mb-4 text-green-400">👥 Teams</h2>
                    <div id="teams-list" class="mb-4 space-y-2"></div>
                    <div class="flex items-center gap-2">
                        <input type="text" id="new-team-name" class="input-field p-3 rounded-lg flex-1 text-white" placeholder="New Team Name">
                        <button id="add-team-btn" class="btn-success py-3 px-4 rounded-lg font-semibold text-white">Add</button>
                    </div>
                </div>

                <!-- Event Note -->
                <div class="admin-card p-6 rounded-lg">
                    <h2 class="section-title text-2xl mb-4 text-yellow-400">📝 Event Note</h2>
                    <textarea id="event-note" class="input-field w-full p-3 rounded-lg text-white" rows="3" placeholder="Enter event announcement..."></textarea>
                    <div class="grid grid-cols-2 gap-3 mt-3">
                        <div>
                            <label class="text-sm block mb-2 font-medium">Font Size (px)</label>
                            <input type="number" id="note-font-size" class="input-field p-2 rounded-lg w-full text-white" min="12" max="120" value="36">
                        </div>
                        <div>
                            <label class="text-sm block mb-2 font-medium">Glow Color</label>
                            <input type="color" id="note-glow-color" class="input-field p-2 rounded-lg w-full h-10" value="#3b82f6">
                        </div>
                        <div>
                            <label class="text-sm block mb-2 font-medium">Glow Intensity</label>
                            <input type="range" id="note-glow-intensity" class="w-full" min="0" max="100" value="80">
                            <span class="text-xs text-gray-400" id="glow-intensity-value">80%</span>
                        </div>
                        <div class="flex items-end">
                            <label class="flex items-center cursor-pointer">
                                <input type="checkbox" id="note-bold" class="mr-2 w-4 h-4" checked>
                                <span class="text-sm font-medium">Bold Text</span>
                            </label>
                        </div>
                    </div>
                    <button id="update-note-btn" class="btn-primary py-2 px-4 rounded-lg mt-3 w-full font-semibold">Update Note</button>
                </div>
                
                <!-- Actions -->
                <div class="admin-card p-6 rounded-lg">
                    <h2 class="section-title text-2xl mb-4 text-purple-400">🎬 Actions</h2>
                    <button id="play-sound-btn" class="btn-purple py-3 px-4 rounded-lg w-full mb-3 font-semibold text-white">🔊 Play Alert Sound</button>
                    <div class="flex items-center gap-2">
                         <input type="text" id="tts-message" class="input-field p-3 rounded-lg flex-1 text-white" placeholder="TTS message">
                         <button id="send-tts-btn" class="btn-indigo py-3 px-4 rounded-lg font-semibold text-white">Send</button>
                    </div>
                </div>

                <!-- Layout Editor -->
                <div class="admin-card p-6 rounded-lg col-span-1 md:col-span-3">
                    <h2 class="section-title text-2xl mb-4 text-indigo-400">🎨 Layout Editor</h2>
                    <div id="layout-preview" class="relative h-96 bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
                         <div id="preview-timer" class="resize-drag draggable absolute bg-blue-500 bg-opacity-50 flex items-center justify-center border border-blue-300 rounded" style="top: 5%; left: 5%; width: 25%; height: 60%;">Timer</div>
                         <div id="preview-teams" class="resize-drag draggable absolute bg-green-500 bg-opacity-50 flex items-center justify-center border border-green-300 rounded" style="top: 5%; left: 70%; width: 25%; height: 80%;">Teams</div>
                         <div id="preview-note" class="resize-drag draggable absolute bg-yellow-500 bg-opacity-50 flex items-center justify-center border border-yellow-300 rounded" style="top: 70%; left: 5%; width: 40%; height: 15%;">Note</div>
                    </div>
                    <div class="mt-4 flex flex-wrap gap-3">
                        <button id="save-layout-btn" class="btn-primary py-2 px-6 rounded-lg font-semibold">Save Layout</button>
                         <select id="layout-preset" class="input-field p-2 rounded-lg text-white">
                            <option value="">Select Preset</option>
                            <option value="default">Default</option>
                            <option value="timer-focus">Timer Focus</option>
                         </select>
                    </div>
                </div>

                 <!-- Audit Log -->
                <div class="admin-card p-6 rounded-lg col-span-1 md:col-span-3">
                    <h2 class="section-title text-2xl mb-4 text-red-400">📋 Audit Log</h2>
                    <div id="audit-log" class="h-64 overflow-y-auto bg-gray-900 p-4 rounded-lg font-mono text-sm border border-gray-700"></div>
                </div>
            </div>
        `;
        
        loadInitialData();
        attachEventListeners();
        initLayoutEditor();
    }
    
    // --- Data Loading & State ---
    let currentConfig = {};
    let currentTeams = [];

    // --- Error Handler ---
    const handleApiError = (res) => alert(`Error: ${res.responseJSON?.error || 'An unknown error occurred.'}`);

    function loadInitialData() {
        apiClient.getConfig().done(config => {
            currentConfig = config;
            $('#event-note').val(config.note);
            $('#timer-duration').val(config.timer_duration_seconds);
            $('#note-font-size').val(config.note_font_size || 36);
            $('#note-glow-color').val(config.note_glow_color || '#3b82f6');
            $('#note-glow-intensity').val(config.note_glow_intensity || 80);
            $('#glow-intensity-value').text((config.note_glow_intensity || 80) + '%');
            $('#note-bold').prop('checked', config.note_bold !== false);
            $('#timer-font-size').val(config.timer_font_size || 64);
            $('#timer-color').val(config.timer_color || '#ffffff');
            // ... update other controls based on config
        });
        
        apiClient.getTeams().done(teams => {
            currentTeams = teams;
            renderTeamsList(teams);
        });

        apiClient.getAuditLogs().done(logs => {
            renderAuditLogs(logs);
        });
    }

    function renderTeamsList(teams) {
        const list = $('#teams-list');
        list.empty();
        teams.forEach((team, index) => {
            list.append(`
                <div class="flex items-center justify-between bg-gray-800 p-2 rounded mb-2">
                    <span>${team.name}</span>
                    <button class="delete-team-btn text-red-500" data-id="${team.id}">X</button>
                </div>
            `);
        });
    }

    function renderAuditLogs(logs) {
        const logContainer = $('#audit-log');
        logContainer.empty();
        logs.forEach(log => {
            logContainer.append(`
                <div class="mb-1">
                    <span class="text-gray-400">${new Date(log.created_at).toLocaleString()}</span>
                    <span class="text-yellow-400">${log.admin_username}</span>:
                    <span>${log.action_type}</span>
                    <span class="text-gray-500">${JSON.stringify(log.details)}</span>
                </div>
            `);
        });
    }

    // --- Event Listeners ---
    function attachEventListeners() {
        $('#logout-btn').on('click', () => {
            apiClient.logout().done(() => window.location.reload());
        });

        // Timer
        $('#set-timer-btn').on('click', () => {
            const duration = parseInt($('#timer-duration').val());
            if (isNaN(duration) || duration < 0) {
                return alert('Please enter a valid duration in seconds.');
            }
            apiClient.updateConfig({ timer_duration_seconds: duration, timer_remaining: duration })
                .fail(handleApiError);
        });
        $('#start-timer-btn').on('click', () => {
            // Server will now calculate the end time
            apiClient.updateConfig({ timer_state: 'running' })
                .fail(handleApiError);
        });
        $('#pause-timer-btn').on('click', () => {
             apiClient.getConfig().done(config => {
                const endsAt = new Date(config.timer_ends_at).getTime();
                const remaining = Math.max(0, Math.round((endsAt - Date.now())/1000));
                apiClient.updateConfig({ timer_state: 'paused', timer_remaining: remaining })
                    .fail(handleApiError);
             }).fail(handleApiError);
        });
        $('#reset-timer-btn').on('click', () => {
            apiClient.getConfig().done(config => {
                apiClient.updateConfig({ timer_state: 'stopped', timer_remaining: config.timer_duration_seconds })
                    .fail(handleApiError);
            }).fail(handleApiError);
        });

        // Timer Style
        $('#update-timer-style-btn').on('click', () => {
            const fontSize = parseInt($('#timer-font-size').val()) || 64;
            const color = $('#timer-color').val();
            
            apiClient.updateConfig({ 
                timer_font_size: fontSize,
                timer_color: color
            })
                .fail(handleApiError);
        });

        // Note
        $('#note-glow-intensity').on('input', function() {
            $('#glow-intensity-value').text($(this).val() + '%');
        });
        
        $('#update-note-btn').on('click', () => {
            const fontSize = parseInt($('#note-font-size').val()) || 36;
            const glowColor = $('#note-glow-color').val();
            const glowIntensity = parseInt($('#note-glow-intensity').val()) || 80;
            const isBold = $('#note-bold').is(':checked');
            
            apiClient.updateConfig({ 
                note: $('#event-note').val(),
                note_font_size: fontSize,
                note_glow_color: glowColor,
                note_glow_intensity: glowIntensity,
                note_bold: isBold
            })
                .fail(handleApiError);
        });

        // Teams
        $('#add-team-btn').on('click', () => {
            const name = $('#new-team-name').val();
            if (name) {
                apiClient.addTeam(name)
                    .done(loadInitialData)
                    .fail(handleApiError);
                $('#new-team-name').val('');
            }
        });
        $('body').on('click', '.delete-team-btn', function() {
            const teamId = $(this).data('id');
            if (confirm('Are you sure you want to delete this team?')) {
                apiClient.deleteTeam(teamId)
                    .done(loadInitialData)
                    .fail(handleApiError);
            }
        });

        // Actions
        $('#play-sound-btn').on('click', () => {
            apiClient.playAction({ type: 'sound', payload: { url: '/assets/sounds/alert.mp3' } })
                .fail(handleApiError);
        });
        $('#send-tts-btn').on('click', () => {
            const text = $('#tts-message').val();
            if (text) {
                apiClient.playAction({ type: 'tts', payload: { text } })
                    .fail(handleApiError);
                $('#tts-message').val('');
            }
        });
    }

    // --- Layout Editor (interact.js) ---
    function initLayoutEditor() {
        const layoutPresets = {
            'default': {
                timer: { position: { top: '5%', left: '5%' }, size: { width: '25%', height: '60%' } },
                teams: { position: { top: '5%', left: '70%' }, size: { width: '25%', height: '80%' } },
                note: { position: { top: '70%', left: '5%' }, size: { width: '40%', height: '15%' } }
            },
            'timer-focus': {
                timer: { position: { top: '25%', left: '35%' }, size: { width: '30%', height: '50%' } },
                teams: { position: { top: '5%', left: '70%' }, size: { width: '25%', height: '90%' } },
                note: { position: { top: '5%', left: '5%' }, size: { width: '30%', height: '15%' } }
            }
        };

        function applyLayout(layout) {
            if (!layout) return;
            ['timer', 'teams', 'note'].forEach(key => {
                const el = $(`#preview-${key}`);
                if (layout[key]) {
                    // Clear previous inline styles related to position/size
                    el.css({ top: '', right: '', bottom: '', left: '', width: '', height: '', transform: '' });
                    // Apply new styles - ensure position is absolute
                    el.css({ position: 'absolute', ...layout[key].position, ...layout[key].size });
                }
            });
        }

        interact('.resize-drag')
            .draggable({
                listeners: {
                    move(event) {
                        const target = event.target;
                        const top = (parseFloat(target.style.top) || target.offsetTop) + event.dy;
                        const left = (parseFloat(target.style.left) || target.offsetLeft) + event.dx;
                        // Reset other positioning properties to avoid conflicts
                        $(target).css({ right: '', bottom: '', transform: '' });
                        target.style.top = `${top}px`;
                        target.style.left = `${left}px`;
                    }
                },
                modifiers: [interact.modifiers.restrictRect({ restriction: 'parent' })]
            })
            .resizable({
                edges: { top: true, left: true, bottom: true, right: true },
                listeners: {
                    move(event) {
                        const target = event.target;
                        Object.assign(target.style, {
                            width: `${event.rect.width}px`,
                            height: `${event.rect.height}px`,
                        });
                    }
                },
                modifiers: [interact.modifiers.restrictSize({ min: { width: 100, height: 50 } })]
            });

        $('#save-layout-btn').on('click', () => {
            const preview = $('#layout-preview');
            const parentWidth = preview.width();
            const parentHeight = preview.height();

            const getResponsiveStyles = (id) => {
                const el = $(`#${id}`);
                const top = parseFloat(el.css('top')) / parentHeight * 100;
                const left = parseFloat(el.css('left')) / parentWidth * 100;
                const width = parseFloat(el.css('width')) / parentWidth * 100;
                const height = parseFloat(el.css('height')) / parentHeight * 100;

                return {
                    position: { top: `${top}%`, left: `${left}%` },
                    size: { width: `${width}%`, height: `${height}%` }
                };
            };

            const newLayout = {
                timer: getResponsiveStyles('preview-timer'),
                teams: getResponsiveStyles('preview-teams'),
                note: getResponsiveStyles('preview-note')
            };
            
            apiClient.updateConfig({ layout: newLayout })
                .done(() => alert('Layout saved successfully!'))
                .fail(handleApiError);
        });

        $('#layout-preset').on('change', function() {
            const presetName = $(this).val();
            if (presetName && layoutPresets[presetName]) {
                applyLayout(layoutPresets[presetName]);
            }
        });
        
        // Load initial layout from config, or use default
        apiClient.getConfig().done(config => {
            const initialLayout = config.layout || layoutPresets['default'];
            applyLayout(initialLayout);
        }).fail(() => {
            applyLayout(layoutPresets['default']);
        });
    }
    
    // --- Initial Load ---
    initAuth();
});
