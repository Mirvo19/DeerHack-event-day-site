// Form Submission Handler
document.addEventListener('DOMContentLoaded', () => {
    
    const form = document.getElementById('submission-form');
    const submitBtn = document.getElementById('submit-btn');
    const messageContainer = document.getElementById('message-container');
    const message = document.getElementById('message');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Disable submit button
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
        
        // Get form data
        const formData = {
            team_name: document.getElementById('team-name').value.trim(),
            project_name: document.getElementById('project-name').value.trim(),
            project_description: document.getElementById('project-description').value.trim(),
            github_link: document.getElementById('github-link').value.trim()
        };
        
        try {
            // Submit to backend API
            const response = await fetch('/api/submissions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                // Success
                showMessage('success', 'Project submitted successfully! 🎉');
                form.reset();
                
                // Redirect to submissions page after 2 seconds
                setTimeout(() => {
                    window.location.href = '/submissions.html';
                }, 2000);
            } else {
                // Error
                showMessage('error', result.error || 'Failed to submit project. Please try again.');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Project';
            }
        } catch (error) {
            console.error('Submission error:', error);
            showMessage('error', 'Network error. Please check your connection and try again.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Project';
        }
    });
    
    function showMessage(type, text) {
        messageContainer.classList.remove('hidden');
        message.textContent = text;
        
        if (type === 'success') {
            message.className = 'p-4 rounded-lg text-center font-medium bg-green-600 bg-opacity-80 text-white';
        } else {
            message.className = 'p-4 rounded-lg text-center font-medium bg-red-600 bg-opacity-80 text-white';
        }
        
        // Auto-hide error messages after 5 seconds
        if (type === 'error') {
            setTimeout(() => {
                messageContainer.classList.add('hidden');
            }, 5000);
        }
    }
    
    // Validate GitHub URL on input
    const githubInput = document.getElementById('github-link');
    githubInput.addEventListener('input', () => {
        const value = githubInput.value.trim();
        if (value && !value.startsWith('http://') && !value.startsWith('https://')) {
            githubInput.setCustomValidity('Please enter a valid URL starting with http:// or https://');
        } else {
            githubInput.setCustomValidity('');
        }
    });
});
