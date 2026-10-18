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

    // Auto-filter based on current page URL
    const pathname = window.location.pathname.toLowerCase();
    if (pathname.includes('nios.html')) {
        const btn = Array.from(filterBtns).find(b => b.textContent.trim().toUpperCase() === 'NIOS');
        if (btn) btn.click();
    } else if (pathname.includes('distance-learning.html')) {
        const btn = Array.from(filterBtns).find(b => b.textContent.trim().toUpperCase() === 'DISTANCE LEARNING');
        if (btn) btn.click();
    } else if (pathname.includes('prapti-tourism.html')) {
        const btn = Array.from(filterBtns).find(b => b.textContent.trim().toUpperCase() === 'PRAPTI TOURISM');
        if (btn) btn.click();
    }

    // Sorting logic for category pages (Custom Dropdown)
    const dropdown = document.querySelector('.custom-dropdown');
    const toggle = document.querySelector('.dropdown-toggle');
    const items = document.querySelectorAll('.dropdown-item');
    const categoryGrid = document.querySelector('.category-grid');
    
    if (dropdown && toggle) {
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('open');
        });
        
        document.addEventListener('click', () => {
            dropdown.classList.remove('open');
        });
        
        items.forEach(item => {
            item.addEventListener('click', (e) => {
                // Update active state
                items.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                
                // Update button text
                const text = item.textContent;
                toggle.innerHTML = `${text} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
                
                // Perform sort
                const val = item.getAttribute('data-value');
                if (categoryGrid) {
                    const cards = Array.from(categoryGrid.querySelectorAll('.cat-card'));
                    cards.forEach((card, index) => {
                        if (val === 'newest') {
                            card.style.order = index;
                        } else if (val === 'oldest') {
                            card.style.order = cards.length - index;
                        } else if (val === 'popular') {
                            card.style.order = (index * 3) % cards.length; 
                        }
                    });
                }
            });
        });
    }
});
