// Fetch and Display Submissions
document.addEventListener('DOMContentLoaded', () => {
    
    const loadingEl = document.getElementById('loading');
    const noSubmissionsEl = document.getElementById('no-submissions');
    const submissionsListEl = document.getElementById('submissions-list');
    
    // Check authentication before loading submissions
    checkAuthAndFetch();
    
    async function checkAuthAndFetch() {
        try {
            const authResponse = await fetch('/submissions/api/auth/status');
            const authData = await authResponse.json();
            
            if (!authData.logged_in) {
                // Not authenticated, redirect to submissions login
                window.location.href = '/submissions/login';
                return;
            }
            
            // Display logged-in user email
            const userEmailEl = document.getElementById('user-email');
            if (userEmailEl && authData.email) {
                userEmailEl.textContent = authData.email;
            }
            
            // Authenticated, proceed to fetch submissions
            fetchSubmissions();
        } catch (error) {
            console.error('Error checking authentication:', error);
            window.location.href = '/submissions/login';
        }
    }
    
    async function fetchSubmissions() {
        try {
            const response = await fetch('/api/submissions');
            
            if (response.status === 401) {
                // Session expired or not authenticated
                window.location.href = '/submissions/login';
                return;
            }
            
            if (!response.ok) {
                throw new Error('Failed to fetch submissions');
            }
            
            const submissions = await response.json();
            
            // Hide loading
            loadingEl.classList.add('hidden');
            
            if (submissions.length === 0) {
                noSubmissionsEl.classList.remove('hidden');
                return;
            }
            
            // Group submissions by team name
            const groupedSubmissions = groupByTeam(submissions);
            
            // Display submissions
            displaySubmissions(groupedSubmissions);
            submissionsListEl.classList.remove('hidden');
            
        } catch (error) {
            console.error('Error fetching submissions:', error);
            loadingEl.classList.add('hidden');
            submissionsListEl.innerHTML = `
                <div class="text-center py-12">
                    <svg class="mx-auto h-24 w-24 text-red-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 class="text-xl font-semibold mb-2" style="font-family: 'Orbitron', sans-serif;">Error Loading Submissions</h3>
                    <p class="text-gray-400">Please try refreshing the page</p>
                </div>
            `;
            submissionsListEl.classList.remove('hidden');
        }
    }
    
    function groupByTeam(submissions) {
        const grouped = {};
        
        submissions.forEach(submission => {
            const teamName = submission.team_name;
            if (!grouped[teamName]) {
                grouped[teamName] = [];
            }
            grouped[teamName].push(submission);
        });
        
        return grouped;
    }
    
    function displaySubmissions(groupedSubmissions) {
        const teamNames = Object.keys(groupedSubmissions).sort();
        
        submissionsListEl.innerHTML = teamNames.map(teamName => {
            const teamSubmissions = groupedSubmissions[teamName];
            
            return `
                <div class="team-section p-6 rounded-lg shadow-lg">
                    <h2 class="text-2xl md:text-3xl font-bold mb-4 text-blue-400" style="font-family: 'Orbitron', sans-serif;">
                        🏆 ${escapeHtml(teamName)}
                    </h2>
                    <div class="space-y-4">
                        ${teamSubmissions.map((submission, index) => createProjectCard(submission, index + 1)).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    function createProjectCard(submission, index) {
        const formattedDate = new Date(submission.created_at).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return `
            <div class="project-card p-5 rounded-lg">
                <div class="flex items-start gap-4 mb-3">
                    <div class="submission-index flex-shrink-0">
                        ${index}
                    </div>
                    <div class="flex-1">
                        <div class="flex justify-between items-start mb-3">
                            <h3 class="text-xl font-semibold text-white" style="font-family: 'Orbitron', sans-serif;">
                                ${escapeHtml(submission.project_name)}
                            </h3>
                            <span class="text-xs text-gray-400">${formattedDate}</span>
                        </div>
                        
                        <p class="text-gray-300 mb-4 leading-relaxed">
                            ${escapeHtml(submission.project_description)}
                        </p>
                        
                        <div class="flex items-center justify-between gap-4">
                            <div class="flex items-center gap-2">
                        <svg class="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                            <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd"/>
                        </svg>
                        <a href="${escapeHtml(submission.github_link)}" target="_blank" rel="noopener noreferrer" class="github-link font-medium hover:underline">
                            View on GitHub →
                        </a>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="editSubmission(${submission.id})" class="btn-edit py-2 px-4 rounded-lg text-sm font-bold text-white">
                            Edit
                        </button>
                        <button onclick="deleteSubmission(${submission.id}, '${escapeHtml(submission.project_name)}')" class="btn-delete py-2 px-4 rounded-lg text-sm font-bold text-white">
                            Delete
                        </button>
                    </div>
                </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
});

// CRUD Operations (Global functions for onclick handlers)
window.editSubmission = async function(id) {
    try {
        const response = await fetch(`/api/submissions/${id}`);
        if (!response.ok) throw new Error('Failed to fetch submission');
        
        const submission = await response.json();
        
        // Populate form
        document.getElementById('edit-id').value = submission.id;
        document.getElementById('edit-team-name').value = submission.team_name;
        document.getElementById('edit-project-name').value = submission.project_name;
        document.getElementById('edit-project-description').value = submission.project_description;
        document.getElementById('edit-github-link').value = submission.github_link;
        
        // Show modal
        const modal = document.getElementById('edit-modal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    } catch (error) {
        console.error('Error loading submission:', error);
        alert('Error loading submission for editing');
    }
};

window.deleteSubmission = async function(id, projectName) {
    if (!confirm(`Are you sure you want to delete "${projectName}"?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/submissions/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete submission');
        
        alert('Submission deleted successfully');
        location.reload();
    } catch (error) {
        console.error('Error deleting submission:', error);
        alert('Error deleting submission');
    }
};

// Handle edit form submission
document.addEventListener('DOMContentLoaded', () => {
    const editForm = document.getElementById('edit-form');
    const cancelBtn = document.getElementById('cancel-edit');
    const modal = document.getElementById('edit-modal');
    const logoutBtn = document.getElementById('logout-btn');
    
    // Logout functionality
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                const response = await fetch('/submissions/api/auth/logout', {
                    method: 'POST'
                });
                
                if (response.ok) {
                    window.location.href = '/submissions/login';
                } else {
                    console.error('Logout failed');
                }
            } catch (error) {
                console.error('Error during logout:', error);
            }
        });
    }
    
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('edit-id').value;
        const data = {
            team_name: document.getElementById('edit-team-name').value,
            project_name: document.getElementById('edit-project-name').value,
            project_description: document.getElementById('edit-project-description').value,
            github_link: document.getElementById('edit-github-link').value
        };
        
        try {
            const response = await fetch(`/api/submissions/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) throw new Error('Failed to update submission');
            
            alert('Submission updated successfully');
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            location.reload();
        } catch (error) {
            console.error('Error updating submission:', error);
            alert('Error updating submission');
        }
    });
    
    cancelBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    });
    
    // Close modal on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    });
});
