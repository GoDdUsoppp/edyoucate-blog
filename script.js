document.addEventListener('DOMContentLoaded', () => {
    let lastScrollY = window.scrollY;
    const header = document.querySelector('.site-header');

    window.addEventListener('scroll', () => {
        // If scrolling down and past the header height, hide it
        if (window.scrollY > lastScrollY && window.scrollY > 100) {
            header.classList.add('header-hidden');
        } 
        // If scrolling up, show it
        else if (window.scrollY < lastScrollY) {
            header.classList.remove('header-hidden');
        }
        lastScrollY = window.scrollY;
    });

    // Tag Filtering Logic
    const filterBtns = document.querySelectorAll('.filter-btn');
    const allStories = document.querySelectorAll('.featured-large-card, .small-list-card, .story-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active button state
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filterCategory = btn.textContent.trim().toUpperCase();

            // Filter all stories based on category text
            allStories.forEach(story => {
                const badge = story.querySelector('.card-badge, .small-card-eyebrow');
                if (!badge) return;

                const storyCategory = badge.textContent.trim().toUpperCase();

                if (filterCategory === 'ALL STORIES' || storyCategory.includes(filterCategory)) {
                    // Show the story
                    story.style.display = '';
                } else {
                    // Hide the story
                    story.style.display = 'none';
                }
            });
        });
    });
});
