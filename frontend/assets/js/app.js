document.addEventListener('DOMContentLoaded', () => {
    const SUPABASE_URL = window.SUPABASE_URL;
    const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY;
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.error("Supabase URL and Anon Key are required. Make sure they are injected into the HTML template.");
        alert("Application is not configured. Please check server logs.");
        return;
    }

    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    const socket = io();
    
    socket.on('connect', () => {
        console.log('Connected to WebSocket server');
    });
    
    socket.on('refresh_page', (data) => {
        console.log('Refresh event received:', data);
        window.location.reload();
    });
    
    socket.on('disconnect', () => {
        console.log('Disconnected from WebSocket server');
    });
    
    let timerInterval = null;
    let lastActionCounter = -1;
    let shuffleInterval = null;

    const timerDisplay = document.getElementById('timer-display');
    const progressRing = document.getElementById('timer-progress-ring');
    const teamList = document.getElementById('team-list');
    const eventNote = document.getElementById('event-note');
    const alertSound = document.getElementById('alert-sound');
    
    const timerContainer = document.getElementById('timer-container');
    const teamsContainer = document.getElementById('teams-container');
    const noteContainer = document.getElementById('note-container');

    async function fetchInitialData() {
        try {
            const { data: teams, error: teamsError } = await supabase.from('teams').select('*').order('order_index');
            if (teamsError) throw teamsError;
            renderTeams(teams);

            const { data: config, error: configError } = await supabase.from('event_config').select('*').eq('id', 1).single();
            if (configError) throw configError;
            handleConfigUpdate(config);
        } catch (error) {
            console.error("Error fetching initial data:", error);
        }
    }

    supabase
        .channel('public:teams')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, payload => {
            console.log('Team change received!', payload);
            fetchInitialData();
        })
        .subscribe();

    supabase
        .channel('public:event_config')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'event_config' }, payload => {
            console.log('Config change received!', payload);
            handleConfigUpdate(payload.new);
        })
        .subscribe();

    function renderTeams(teams) {
        teamList.innerHTML = '';
        if (!teams || teams.length === 0) {
            teamList.innerHTML = '<p class="text-gray-400">No teams yet.</p>';
            teamList.classList.remove('scrolling');
            return;
        }
        
        const visibleTeams = teams.filter(team => team.visible);
        
        visibleTeams.forEach(team => {
            const teamElement = document.createElement('div');
            teamElement.className = 'bg-gray-800 p-3 rounded-md text-xl mb-2';
            teamElement.textContent = team.name;
            teamList.appendChild(teamElement);
        });
        
        visibleTeams.forEach(team => {
            const teamElement = document.createElement('div');
            teamElement.className = 'bg-gray-800 p-3 rounded-md text-xl mb-2';
            teamElement.textContent = team.name;
            teamList.appendChild(teamElement);
        });
        
        teamList.classList.add('scrolling');
    }

    function handleConfigUpdate(config) {
        updateTimer(config);
        
        const timerFontSize = config.timer_font_size || 64;
        const timerColor = config.timer_color || '#ffffff';
        timerDisplay.style.fontSize = timerFontSize + 'px';
        timerDisplay.style.color = timerColor;
        
        eventNote.textContent = config.note || '';
        
        const fontSize = config.note_font_size || 36;
        eventNote.style.fontSize = fontSize + 'px';
        
        if (config.note_bold !== false) {
            eventNote.classList.add('font-bold');
        } else {
            eventNote.classList.remove('font-bold');
        }
        
        const glowColor = config.note_glow_color || '#3b82f6';
        const glowIntensity = (config.note_glow_intensity || 80) / 100;
        
        const hexToRgb = (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        };
        
        const rgb = hexToRgb(glowColor);
        if (rgb) {
            const glow1 = `0 0 20px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${glowIntensity * 0.8})`;
            const glow2 = `0 0 40px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${glowIntensity * 0.6})`;
            const glow3 = `0 0 60px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${glowIntensity * 0.4})`;
            eventNote.style.textShadow = `${glow1}, ${glow2}, ${glow3}`;
        }

        if (config.layout) {
            updateLayout(config.layout);
        }

        if (config.action_counter > lastActionCounter) {
            lastActionCounter = config.action_counter;
            handleAction(config.last_action_payload);
        }

        handleShuffle(config.shuffle_enabled, config.shuffle_interval_seconds);
    }
    
    function updateLayout(layout) {
        if (layout.timer) {
            Object.assign(timerContainer.style, { position: 'absolute', ...layout.timer.position, ...layout.timer.size });
            const timerElement = timerContainer.querySelector('.relative');
            if (timerElement && layout.timer.size) {
                timerElement.style.width = layout.timer.size.width;
                timerElement.style.height = layout.timer.size.height;
            }
        }
        if (layout.teams) {
            Object.assign(teamsContainer.style, { position: 'absolute', ...layout.teams.position, ...layout.teams.size });
        }
        if (layout.note) {
            Object.assign(noteContainer.style, { position: 'absolute', ...layout.note.position, ...layout.note.size });
        }
    }

    function handleAction(action) {
        if (!action) return;
        
        const playPromise = alertSound.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn("Audio playback failed. User interaction might be required.", error);
            });
        }
        
        if (action.type === 'sound' && action.payload.url) {
            alertSound.src = action.payload.url;
            alertSound.play();
        } else if (action.type === 'tts' && action.payload.text) {
            const utterance = new SpeechSynthesisUtterance(action.payload.text);
            speechSynthesis.speak(utterance);
        }
    }

    function handleShuffle(enabled, interval) {
        if (shuffleInterval) clearInterval(shuffleInterval);
        if (enabled) {
            shuffleInterval = setInterval(() => {
                const teams = Array.from(teamList.children);
                teams.sort(() => Math.random() - 0.5);
                teams.forEach(team => teamList.appendChild(team));
            }, (interval || 300) * 1000);
        }
    }

    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    progressRing.style.strokeDasharray = `${circumference} ${circumference}`;

    function updateTimer(config) {
        clearInterval(timerInterval);
        
        const { timer_state, timer_ends_at, timer_remaining, timer_duration_seconds } = config;

        const duration = timer_duration_seconds || 1;

        if (timer_state === 'running') {
            const endTime = new Date(timer_ends_at).getTime();
            timerInterval = setInterval(() => {
                const now = new Date().getTime();
                const timeLeft = Math.max(0, Math.round((endTime - now) / 1000));
                
                const hours = Math.floor(timeLeft / 3600);
                const minutes = Math.floor((timeLeft % 3600) / 60);
                const seconds = timeLeft % 60;
                
                timerDisplay.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                
                const progress = timeLeft / duration;
                const offset = circumference - progress * circumference;
                progressRing.style.strokeDashoffset = offset;

                if (timeLeft <= 0) {
                    clearInterval(timerInterval);
                    timerDisplay.textContent = "00:00:00";
                    progressRing.style.strokeDashoffset = circumference;
                    alertSound.play().catch(e => console.log("Playback failed:", e));
                }
            }, 1000);
        } else if (timer_state === 'paused' || timer_state === 'stopped') {
            const timeLeft = timer_remaining || (timer_state === 'stopped' ? duration : 0);
            const hours = Math.floor(timeLeft / 3600);
            const minutes = Math.floor((timeLeft % 3600) / 60);
            const seconds = timeLeft % 60;
            timerDisplay.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            
            const progress = timeLeft / duration;
            const offset = circumference - progress * circumference;
            progressRing.style.strokeDashoffset = offset;
        }
    }

    function initThreeJS() {
        const container = document.getElementById('three-bg');
        const canvas = document.createElement('canvas');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        
        const fontSize = 14;
        const columns = Math.floor(canvas.width / fontSize);
        const drops = [];
        
        for (let i = 0; i < columns; i++) {
            drops[i] = Math.random() * canvas.height / fontSize;
        }
        
        const blueShades = [
            'rgba(30, 58, 138, 0.6)',
            'rgba(37, 99, 235, 0.6)',
            'rgba(59, 130, 246, 0.6)',
            'rgba(96, 165, 250, 0.6)',
            'rgba(147, 197, 253, 0.6)'
        ];
        
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+-=[]{}|;:,.<>?';
        
        function draw() {
            ctx.fillStyle = 'rgba(17, 24, 39, 0.08)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.font = fontSize + 'px monospace';
            
            for (let i = 0; i < drops.length; i++) {
                const char = characters[Math.floor(Math.random() * characters.length)];
                
                const color = blueShades[Math.floor(Math.random() * blueShades.length)];
                ctx.fillStyle = color;
                
                const x = i * fontSize;
                const y = drops[i] * fontSize;
                ctx.fillText(char, x, y);
                
                if (y > canvas.height && Math.random() > 0.95) {
                    drops[i] = 0;
                }
                
                drops[i] += 0.3;
            }
        }
        
        setInterval(draw, 80);
        
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            const newColumns = Math.floor(canvas.width / fontSize);
            drops.length = newColumns;
            for (let i = 0; i < newColumns; i++) {
                if (drops[i] === undefined) {
                    drops[i] = Math.random() * canvas.height / fontSize;
                }
            }
        });
    }

    fetchInitialData();
    initThreeJS();
});
