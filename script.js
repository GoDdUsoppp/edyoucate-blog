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
});
