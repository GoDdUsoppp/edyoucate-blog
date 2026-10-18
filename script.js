document.addEventListener('DOMContentLoaded', () => {
    // =========================================================================
    // 1. Sticky Header - Appears & remains visible whenever user scrolls
    // =========================================================================
    const header = document.querySelector('.site-header');
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileNavDrawer = document.getElementById('mobileNavDrawer');
    const mobileNavOverlay = document.getElementById('mobileNavOverlay');
    const mobileNavClose = document.getElementById('mobileNavClose');

    function handleHeaderScroll() {
        if (!header) return;
        // Never hide the menubar on scroll; keep it visible and sticky
        header.classList.remove('header-hidden');

        if (window.scrollY > 15) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }

    window.addEventListener('scroll', handleHeaderScroll, { passive: true });
    handleHeaderScroll();

    // =========================================================================
    // 2. Mobile Navigation Drawer
    // =========================================================================
    function openMobileMenu() {
        if (!mobileNavDrawer) return;
        mobileNavDrawer.classList.add('active');
        if (mobileNavOverlay) mobileNavOverlay.classList.add('active');
        if (mobileMenuToggle) {
            mobileMenuToggle.classList.add('menu-active');
            mobileMenuToggle.setAttribute('aria-expanded', 'true');
        }
        document.body.classList.add('menu-locked');
    }

    function closeMobileMenu() {
        if (!mobileNavDrawer) return;
        mobileNavDrawer.classList.remove('active');
        if (mobileNavOverlay) mobileNavOverlay.classList.remove('active');
        if (mobileMenuToggle) {
            mobileMenuToggle.classList.remove('menu-active');
            mobileMenuToggle.setAttribute('aria-expanded', 'false');
        }
        document.body.classList.remove('menu-locked');
    }

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (mobileNavDrawer.classList.contains('active')) {
                closeMobileMenu();
            } else {
                openMobileMenu();
            }
        });
    }

    if (mobileNavClose) {
        mobileNavClose.addEventListener('click', closeMobileMenu);
    }

    if (mobileNavOverlay) {
        mobileNavOverlay.addEventListener('click', closeMobileMenu);
    }

    // Close mobile menu on Escape key press
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileNavDrawer && mobileNavDrawer.classList.contains('active')) {
            closeMobileMenu();
        }
    });

    // Close mobile menu when tapping internal links
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            closeMobileMenu();
        });
    });

    // Highlight active link in header & mobile drawer based on current page
    const currentPath = window.location.pathname.toLowerCase();
    const navAnchors = document.querySelectorAll('.main-nav a, .mobile-nav-link');
    navAnchors.forEach(anchor => {
        const href = anchor.getAttribute('href');
        if (!href) return;
        const cleanHref = href.toLowerCase().split('#')[0];
        if (cleanHref && cleanHref !== 'index.html' && cleanHref !== '/' && currentPath.endsWith(cleanHref)) {
            anchor.classList.add('active');
        } else if ((cleanHref === 'index.html' || cleanHref === '') && (currentPath.endsWith('index.html') || currentPath.endsWith('/') || currentPath === '')) {
            if (anchor.textContent.trim().toUpperCase() === 'STORIES' || anchor.textContent.trim().toLowerCase().includes('all stories')) {
                anchor.classList.add('active');
            }
        }
    });

    // =========================================================================
    // 3. Homepage Filter Tabs & Real-time Search
    // =========================================================================
    const filterBtns = document.querySelectorAll('.filter-btn');
    const allStories = document.querySelectorAll('.featured-large-card, .small-list-card, .story-card');
    const searchBtn = document.getElementById('searchToggleBtn') || document.querySelector('.search-btn');
    const searchInputContainer = document.getElementById('searchInputContainer');
    const searchInput = document.getElementById('storySearchInput');
    const searchClearBtn = document.getElementById('searchClearBtn');

    let currentCategoryFilter = 'ALL STORIES';
    let currentSearchQuery = '';

    function filterStories() {
        let matchCount = 0;
        allStories.forEach(story => {
            const badge = story.querySelector('.card-badge, .small-card-eyebrow');
            const title = story.querySelector('h3, h4');
            const excerpt = story.querySelector('p');

            const categoryText = badge ? badge.textContent.trim().toUpperCase() : '';
            const titleText = title ? title.textContent.trim().toLowerCase() : '';
            const excerptText = excerpt ? excerpt.textContent.trim().toLowerCase() : '';

            const matchesCategory = (currentCategoryFilter === 'ALL STORIES' || categoryText.includes(currentCategoryFilter));
            const matchesSearch = (!currentSearchQuery || titleText.includes(currentSearchQuery) || excerptText.includes(currentSearchQuery));

            if (matchesCategory && matchesSearch) {
                story.style.display = '';
                matchCount++;
            } else {
                story.style.display = 'none';
            }
        });

        // Hide/show dividers if adjacent cards are hidden
        const dividers = document.querySelectorAll('.list-divider');
        dividers.forEach(div => {
            const prev = div.previousElementSibling;
            const next = div.nextElementSibling;
            if (prev && prev.style.display === 'none' && next && next.style.display === 'none') {
                div.style.display = 'none';
            } else {
                div.style.display = '';
            }
        });
    }

    if (filterBtns.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentCategoryFilter = btn.textContent.trim().toUpperCase();
                filterStories();
            });
        });
    }

    // Search Toggle & Live Input
    if (searchBtn && searchInputContainer) {
        searchBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = searchInputContainer.classList.toggle('open');
            searchBtn.classList.toggle('active', isOpen);
            if (isOpen && searchInput) {
                searchInput.focus();
            }
        });

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                currentSearchQuery = e.target.value.trim().toLowerCase();
                if (searchClearBtn) {
                    searchClearBtn.style.display = currentSearchQuery ? 'inline-block' : 'none';
                }
                filterStories();
            });
        }

        if (searchClearBtn && searchInput) {
            searchClearBtn.addEventListener('click', () => {
                searchInput.value = '';
                currentSearchQuery = '';
                searchClearBtn.style.display = 'none';
                filterStories();
                searchInput.focus();
            });
        }

        // Close search input if clicked outside
        document.addEventListener('click', (e) => {
            if (!searchInputContainer.contains(e.target) && !searchBtn.contains(e.target)) {
                if (!searchInput.value.trim()) {
                    searchInputContainer.classList.remove('open');
                    searchBtn.classList.remove('active');
                }
            }
        });
    }

    // =========================================================================
    // 4. Category Page Sorting Dropdown
    // =========================================================================
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
                e.stopPropagation();
                items.forEach(i => i.classList.remove('active'));
                item.classList.add('active');

                const text = item.textContent;
                toggle.innerHTML = `${text} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
                dropdown.classList.remove('open');

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

    // =========================================================================
    // 5. Mobile Story Navigation: Collapsible Table of Contents & Web Share
    // =========================================================================
    const mobileTocToggle = document.querySelector('.mobile-toc-toggle');
    const mobileTocAccordion = document.querySelector('.mobile-toc-accordion');

    if (mobileTocToggle && mobileTocAccordion) {
        mobileTocToggle.addEventListener('click', () => {
            const isCurrentlyOpen = mobileTocAccordion.classList.toggle('open');
            mobileTocToggle.setAttribute('aria-expanded', isCurrentlyOpen ? 'true' : 'false');
        });

        // Close accordion when clicking TOC anchor
        const tocLinks = mobileTocAccordion.querySelectorAll('a');
        tocLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileTocAccordion.classList.remove('open');
                mobileTocToggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // Copy link / Share handling
    const copyLinkBtn = document.getElementById('copyStoryLinkBtn');
    if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: document.title,
                        url: window.location.href
                    });
                    return;
                } catch (err) {
                    // Fall back to clipboard if user dismissed or unsupported
                }
            }

            if (navigator.clipboard) {
                try {
                    await navigator.clipboard.writeText(window.location.href);
                    const originalText = copyLinkBtn.textContent;
                    copyLinkBtn.textContent = 'Copied!';
                    setTimeout(() => {
                        copyLinkBtn.textContent = originalText;
                    }, 2000);
                } catch (err) {
                    // ignore
                }
            }
        });
    }

    // =========================================================================
    // 6. Interactive FAQ Accordion
    // =========================================================================
    const faqButtons = document.querySelectorAll('.faq-question-btn');
    faqButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const currentItem = btn.closest('.faq-item');
            if (!currentItem) return;
            const collapse = currentItem.querySelector('.faq-answer-collapse');
            const isOpen = currentItem.classList.contains('active');

            // Close all other FAQ items in this accordion
            const parentList = currentItem.closest('.faq-accordion-list');
            if (parentList) {
                const allItems = parentList.querySelectorAll('.faq-item');
                allItems.forEach(item => {
                    if (item !== currentItem && item.classList.contains('active')) {
                        item.classList.remove('active');
                        const itemBtn = item.querySelector('.faq-question-btn');
                        if (itemBtn) itemBtn.setAttribute('aria-expanded', 'false');
                        const itemCollapse = item.querySelector('.faq-answer-collapse');
                        if (itemCollapse) itemCollapse.style.maxHeight = null;
                    }
                });
            }

            // Toggle current item
            if (isOpen) {
                currentItem.classList.remove('active');
                btn.setAttribute('aria-expanded', 'false');
                if (collapse) collapse.style.maxHeight = null;
            } else {
                currentItem.classList.add('active');
                btn.setAttribute('aria-expanded', 'true');
                if (collapse) collapse.style.maxHeight = collapse.scrollHeight + 'px';
            }
        });
    });

    // =========================================================================
    // 7. Interactive Multi-Business Consultation Form (Tabs & Dynamic Content)
    // =========================================================================
    const consultForm = document.getElementById('consultationForm');
    const serviceSelect = document.getElementById('consultService');
    const requirementSelect = document.getElementById('consultRequirement');
    const serviceTabs = document.querySelectorAll('.service-tab-card');
    const selectedServiceHint = document.getElementById('selectedServiceHint');
    const requirementLabel = document.getElementById('requirementLabel');
    const requirementHint = document.getElementById('requirementHint');
    const requirementPrefixIcon = document.getElementById('requirementPrefixIcon');
    const btnMainText = document.getElementById('btnMainText');

    const businessMeta = {
        'nios': {
            hint: 'NIOS Class 10th & 12th Board',
            label: 'Select NIOS Stream / Exam Level',
            subhint: '100% Valid for Govt Jobs & NEET/JEE',
            icon: '<i class="fa-solid fa-graduation-cap"></i>',
            btnText: 'Get Free NIOS Guidance on WhatsApp',
            courses: [
                { val: 'Class 10th (Secondary) Fresh Admission', text: 'Class 10th (Secondary) Fresh Admission' },
                { val: 'Class 12th (Senior Secondary - Sci / Comm / Arts)', text: 'Class 12th (Senior Secondary - Science / Commerce / Arts)' },
                { val: 'Failed / Dropout Support (Stream 2 / TOC)', text: 'Failed / Dropout Support (Stream 2 / Credit Transfer)' },
                { val: 'On-Demand Examination (ODE)', text: 'On-Demand Examination (ODE - Instant Exams)' },
                { val: 'Improvement Exam / Extra Subject Addition', text: 'Improvement Exam / Extra Subject Addition' },
                { val: 'Study Material & Coaching Support', text: 'Study Material & Coaching Guidance' },
                { val: 'General NIOS Consultation', text: 'General NIOS Consultation & Counseling' }
            ]
        },
        'distance': {
            hint: 'UGC-DEB Approved Online & Distance Degrees',
            label: 'Select Degree / Course Level',
            subhint: 'Study While Working · Approved Degrees',
            icon: '<i class="fa-solid fa-building-columns"></i>',
            btnText: 'Explore Distance Degrees on WhatsApp',
            courses: [
                { val: "Bachelor's Degree (BBA / BCA / B.Com / BA / B.Sc)", text: "Bachelor's Degree (BBA / BCA / B.Com / BA / B.Sc)" },
                { val: "Master's Degree (MBA / MCA / M.Com / MA / M.Sc)", text: "Master's Degree (MBA / MCA / M.Com / MA / M.Sc)" },
                { val: "Executive MBA for Working Adults", text: "Executive MBA (Fast-Track for Working Professionals)" },
                { val: "Professional & PG Diplomas", text: "Professional & Post-Graduate Diplomas" },
                { val: "UGC-DEB University Selection & Fees Guidance", text: "UGC-DEB University Selection & Fees Guidance" },
                { val: "Credit Transfer & Lateral Entry Guidance", text: "Credit Transfer & Lateral Entry Guidance" }
            ]
        },
        'tourism': {
            hint: 'Prapti Tourism Educational & Group Travel',
            label: 'Select Tour Type / Package',
            subhint: 'Verified Stays, Transport & Expert Guides',
            icon: '<i class="fa-solid fa-plane-departure"></i>',
            btnText: 'Get Prapti Tour Quote on WhatsApp',
            courses: [
                { val: 'School / College Industrial & Science Excursions', text: 'School / College Industrial & Science Excursions' },
                { val: 'College Excursion / Field Study Tour', text: 'College Excursion / Field Study Tour' },
                { val: 'Heritage & National Educational Trip', text: 'Heritage & National Educational Trip' },
                { val: 'Adventure Camp & Youth Trekking Tour', text: 'Adventure Camp & Youth Trekking Tour' },
                { val: 'Customized School Group Tour Package', text: 'Customized School Group Tour Package' },
                { val: 'Corporate / Family Group Tour Itinerary', text: 'Corporate / Family Group Tour Itinerary' }
            ]
        }
    };

    function selectServiceTab(serviceKey) {
        const meta = businessMeta[serviceKey] || businessMeta['nios'];

        // Update tabs active state & accessibility
        if (serviceTabs.length > 0) {
            serviceTabs.forEach(tab => {
                const isCurrent = tab.getAttribute('data-service') === serviceKey;
                tab.classList.toggle('active', isCurrent);
                tab.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
            });
        }

        // Sync hidden select
        if (serviceSelect) {
            serviceSelect.value = serviceKey;
        }

        // Update hints, labels and button text
        if (selectedServiceHint) selectedServiceHint.textContent = meta.hint;
        if (requirementLabel) requirementLabel.innerHTML = `${meta.label} <span class="required-star">*</span>`;
        if (requirementHint) requirementHint.textContent = meta.subhint;
        if (requirementPrefixIcon) requirementPrefixIcon.innerHTML = meta.icon;
        if (btnMainText) btnMainText.textContent = meta.btnText;

        // Populate requirements dropdown
        if (requirementSelect) {
            requirementSelect.innerHTML = '';
            meta.courses.forEach(opt => {
                const optElem = document.createElement('option');
                optElem.value = opt.val;
                optElem.textContent = opt.text;
                requirementSelect.appendChild(optElem);
            });
        }
    }

    if (serviceTabs.length > 0) {
        serviceTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const serviceKey = tab.getAttribute('data-service');
                selectServiceTab(serviceKey);
            });
        });
    }

    // Default initialization based on current page URL
    const pageUrl = window.location.pathname.toLowerCase();
    let initialService = 'nios';
    if (pageUrl.includes('distance-learning')) {
        initialService = 'distance';
    } else if (pageUrl.includes('prapti-tourism')) {
        initialService = 'tourism';
    }
    selectServiceTab(initialService);

    if (consultForm) {
        consultForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const nameInput = document.getElementById('consultName');
            const phoneInput = document.getElementById('consultPhone');
            const cityInput = document.getElementById('consultCity');
            const messageInput = document.getElementById('consultMessage');

            const name = nameInput ? nameInput.value.trim() : '';
            const phone = phoneInput ? phoneInput.value.trim() : '';
            const serviceKey = serviceSelect ? serviceSelect.value : 'nios';
            const serviceTitles = {
                'nios': 'NIOS Open Schooling (Class 10th & 12th)',
                'distance': 'Distance & Online Learning (UG / PG Degrees)',
                'tourism': 'Prapti Tourism (Educational & Group Tours)'
            };
            const serviceLabel = serviceTitles[serviceKey] || 'Educational Guidance';
            const requirement = requirementSelect && requirementSelect.value 
                ? requirementSelect.value 
                : 'General Inquiry';
            const city = cityInput && cityInput.value.trim() ? cityInput.value.trim() : 'Surat';
            const message = messageInput ? messageInput.value.trim() : '';

            if (!name || !phone) {
                alert('Please enter your Name and WhatsApp number.');
                return;
            }

            // Construct crisp, professionally formatted WhatsApp message
            const waText = 
`👋 *Hello EDYOUCATE Team!*
I would like a consultation from your blog:

👤 *Full Name:* ${name}
📱 *Phone / WhatsApp:* ${phone}
🏢 *Service Domain:* ${serviceLabel}
🎯 *Requirement / Course:* ${requirement}
📍 *City / Location:* ${city}${message ? `\n💬 *Questions / Details:* ${message}` : ''}

Please connect with me with complete syllabus, fee structure, and admission guidance. Thank you!`;

            const waUrl = `https://wa.me/918866230077?text=${encodeURIComponent(waText)}`;
            
            // Open WhatsApp in new tab
            window.open(waUrl, '_blank');

            // Provide visual feedback
            const submitBtn = consultForm.querySelector('.consult-submit-btn');
            if (submitBtn) {
                const originalHtml = submitBtn.innerHTML;
                submitBtn.innerHTML = '<span class="btn-wa-icon"><i class="fa-solid fa-check"></i></span><span class="btn-text-content"><span class="btn-main-text">Opening WhatsApp...</span><span class="btn-sub-text">Redirecting to counselor</span></span>';
                submitBtn.disabled = true;
                setTimeout(() => {
                    submitBtn.innerHTML = originalHtml;
                    submitBtn.disabled = false;
                }, 3500);
            }
        });
    }
});

