document.addEventListener('DOMContentLoaded', () => {
    // =========================================================================
    // 1. Smart Header - Slides out of the way on scroll down, reappears on scroll up
    // =========================================================================
    let lastScrollY = window.scrollY;
    const header = document.querySelector('.site-header');
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileNavDrawer = document.getElementById('mobileNavDrawer');
    const mobileNavOverlay = document.getElementById('mobileNavOverlay');
    const mobileNavClose = document.getElementById('mobileNavClose');

    window.addEventListener('scroll', () => {
        if (!header) return;

        // Never hide header when mobile drawer menu is open
        if (mobileNavDrawer && mobileNavDrawer.classList.contains('active')) {
            return;
        }

        const currentScrollY = window.scrollY;

        // Near top of page: always visible without shadow
        if (currentScrollY <= 15) {
            header.classList.remove('header-hidden');
            header.classList.remove('scrolled');
        }
        // Scrolling down: hide menubar so it doesn't get stuck over page content
        else if (currentScrollY > lastScrollY && currentScrollY > 80) {
            header.classList.add('header-hidden');
        }
        // Scrolling up: smoothly reappear with subtle shadow
        else if (currentScrollY < lastScrollY) {
            header.classList.remove('header-hidden');
            header.classList.add('scrolled');
        }

        lastScrollY = currentScrollY;
    }, { passive: true });

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
    // =========================================================================
    // 7. Simplified Consultation Form (Service Dropdown & Dynamic Sub-Options)
    // =========================================================================
    const consultForm = document.getElementById('consultationForm');
    const serviceSelect = document.getElementById('consultService');
    const requirementSelect = document.getElementById('consultRequirement');
    const requirementLabel = document.getElementById('requirementLabel');
    const requirementPrefixIcon = document.getElementById('requirementPrefixIcon');
    const btnMainText = document.getElementById('btnMainText');

    const businessMeta = {
        'open_schooling': {
            name: 'Open Schooling',
            label: 'Select Open Schooling Program',
            icon: '<i class="fa-solid fa-graduation-cap"></i>',
            btnText: 'Get Open Schooling Guidance on WhatsApp',
            courses: [
                { val: 'Class 10th (Secondary) Admission & Coaching', text: 'Class 10th (Secondary) Admission & Coaching' },
                { val: 'Class 12th Senior Secondary (Science / Commerce / Arts)', text: 'Class 12th Senior Secondary (Science / Commerce / Arts)' },
                { val: 'On-Demand Examination (ODE - Fast Result)', text: 'On-Demand Examination (ODE - Fast Result)' },
                { val: 'Failed / Dropout Support (Stream 2 / TOC)', text: 'Failed / Dropout Support (Stream 2 / Credit Transfer)' },
                { val: 'Improvement Exam / Extra Subject Addition', text: 'Improvement Exam / Extra Subject Addition' },
                { val: 'General Open Schooling Consultation', text: 'General Open Schooling Consultation' }
            ]
        },
        'online_distance': {
            name: 'Online Distance',
            label: 'Select Degree / Course Level',
            icon: '<i class="fa-solid fa-building-columns"></i>',
            btnText: 'Explore Distance Degrees on WhatsApp',
            courses: [
                { val: "Bachelor's Degree (BBA / BCA / B.Com / BA / B.Sc)", text: "Bachelor's Degree (BBA / BCA / B.Com / BA / B.Sc)" },
                { val: "Master's Degree (MBA / MCA / M.Com / MA / M.Sc)", text: "Master's Degree (MBA / MCA / M.Com / MA / M.Sc)" },
                { val: "Executive MBA for Working Adults", text: "Executive MBA (Fast-Track for Working Professionals)" },
                { val: "Post-Graduate & Professional Diplomas", text: "Post-Graduate & Professional Diplomas" },
                { val: "UGC-DEB University Selection & Fees Guidance", text: "UGC-DEB University Selection & Fees Guidance" },
                { val: "Credit Transfer & Lateral Entry Admission", text: "Credit Transfer & Lateral Entry Admission" }
            ]
        },
        'eng_med_admission': {
            name: 'Engineering and Medical Admission',
            label: 'Select Admission Stream / Quota',
            icon: '<i class="fa-solid fa-user-doctor"></i>',
            btnText: 'Get Admission Guidance on WhatsApp',
            courses: [
                { val: 'Engineering Admission (B.Tech / BE - Top Colleges)', text: 'Engineering Admission (B.Tech / BE - Top Colleges)' },
                { val: 'Medical Admission (MBBS / BDS / BAMS / BHMS)', text: 'Medical Admission (MBBS / BDS / BAMS / BHMS)' },
                { val: 'NEET & JEE Counseling & Cutoff Guidance', text: 'NEET & JEE Counseling & Cutoff Guidance' },
                { val: 'Management / Institutional Quota Counseling', text: 'Management / Institutional Quota Counseling' },
                { val: 'Direct Admission & Fee Structure Assistance', text: 'Direct Admission & Fee Structure Assistance' },
                { val: 'College Shortlisting & Verification Support', text: 'College Shortlisting & Verification Support' }
            ]
        },
        'career_counseling': {
            name: 'Career Counseling',
            label: 'Select Career Counseling Service',
            icon: '<i class="fa-solid fa-compass"></i>',
            btnText: 'Book Free Career Counseling on WhatsApp',
            courses: [
                { val: 'Post-10th Stream Selection Guidance', text: 'Post-10th Stream Selection Guidance' },
                { val: 'Post-12th Career Path & College Selection', text: 'Post-12th Career Path & College Selection' },
                { val: 'Higher Education & Career Switch Roadmap', text: 'Higher Education & Career Switch Roadmap' },
                { val: 'Psychometric & Aptitude Assessment', text: 'Psychometric & Aptitude Assessment' },
                { val: '1-on-1 Personalized Career Mentorship', text: '1-on-1 Personalized Career Mentorship' },
                { val: 'Study Abroad & Global Degree Counseling', text: 'Study Abroad & Global Degree Counseling' }
            ]
        },
        'dmit_report': {
            name: 'DMIT Report',
            label: 'Select DMIT Assessment Type',
            icon: '<i class="fa-solid fa-brain"></i>',
            btnText: 'Book DMIT Test & Report on WhatsApp',
            courses: [
                { val: 'Comprehensive DMIT Brain Mapping Analysis', text: 'Comprehensive DMIT Brain Mapping Analysis' },
                { val: 'Multiple Intelligence & Learning Style Test', text: 'Multiple Intelligence & Learning Style Test' },
                { val: 'Child & Student Potential Assessment (Age 4-18)', text: 'Child & Student Potential Assessment (Age 4-18)' },
                { val: 'Inborn Talents & Brain Dominance Report', text: 'Inborn Talents & Brain Dominance Report' },
                { val: 'Adult Career Strengths & Profiling', text: 'Adult Career Strengths & Profiling' },
                { val: 'Full DMIT Report with Expert Counseling Session', text: 'Full DMIT Report with Expert Counseling Session' }
            ]
        }
    };

    const serviceContainer = document.getElementById('serviceDropdownContainer');
    const serviceTrigger = document.getElementById('serviceDropdownTrigger');
    const serviceSelectedLabel = document.getElementById('serviceSelectedLabel');
    const serviceOptionsList = document.getElementById('serviceOptionsList');

    const requirementContainer = document.getElementById('requirementDropdownContainer');
    const requirementTrigger = document.getElementById('requirementDropdownTrigger');
    const requirementSelectedLabel = document.getElementById('requirementSelectedLabel');
    const requirementOptionsList = document.getElementById('requirementOptionsList');

    function selectRequirementOption(val, text) {
        if (requirementSelect) {
            requirementSelect.value = val;
        }
        if (requirementSelectedLabel) {
            requirementSelectedLabel.textContent = text;
        }
        if (requirementOptionsList) {
            const options = requirementOptionsList.querySelectorAll('.custom-select-option');
            options.forEach(opt => {
                const isMatch = opt.getAttribute('data-value') === val;
                opt.classList.toggle('active', isMatch);
                opt.setAttribute('aria-selected', isMatch ? 'true' : 'false');
            });
        }
        if (requirementContainer) {
            requirementContainer.classList.remove('open');
            if (requirementTrigger) requirementTrigger.setAttribute('aria-expanded', 'false');
        }
    }

    function updateServiceRequirements(serviceKey) {
        const meta = businessMeta[serviceKey] || businessMeta['open_schooling'];

        if (serviceSelect && serviceSelect.value !== serviceKey) {
            serviceSelect.value = serviceKey;
        }

        if (serviceSelectedLabel) {
            serviceSelectedLabel.textContent = meta.name;
        }

        // Highlight matching option in custom service options list
        if (serviceOptionsList) {
            const options = serviceOptionsList.querySelectorAll('.custom-select-option');
            options.forEach(opt => {
                const isMatch = opt.getAttribute('data-value') === serviceKey;
                opt.classList.toggle('active', isMatch);
                opt.setAttribute('aria-selected', isMatch ? 'true' : 'false');
            });
        }

        if (requirementLabel) {
            requirementLabel.innerHTML = `${meta.label} <span class="required-star">*</span>`;
        }
        if (requirementPrefixIcon) {
            requirementPrefixIcon.innerHTML = meta.icon;
        }
        if (btnMainText) {
            btnMainText.textContent = meta.btnText;
        }

        // Sync hidden native select
        if (requirementSelect) {
            requirementSelect.innerHTML = '';
            meta.courses.forEach(opt => {
                const optElem = document.createElement('option');
                optElem.value = opt.val;
                optElem.textContent = opt.text;
                requirementSelect.appendChild(optElem);
            });
            if (meta.courses.length > 0) {
                requirementSelect.value = meta.courses[0].val;
            }
        }

        // Set default requirement label
        if (requirementSelectedLabel && meta.courses.length > 0) {
            requirementSelectedLabel.textContent = meta.courses[0].text;
        }

        // Populate custom requirement options list
        if (requirementOptionsList) {
            requirementOptionsList.innerHTML = '';
            meta.courses.forEach((course, index) => {
                const li = document.createElement('li');
                li.className = `custom-select-option ${index === 0 ? 'active' : ''}`;
                li.setAttribute('data-value', course.val);
                li.setAttribute('role', 'option');
                li.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
                li.innerHTML = `<span class="option-text">${course.text}</span><span class="option-check"><i class="fa-solid fa-check"></i></span>`;

                li.addEventListener('click', (e) => {
                    e.stopPropagation();
                    selectRequirementOption(course.val, course.text);
                });

                requirementOptionsList.appendChild(li);
            });
        }
    }

    // Toggle service dropdown
    if (serviceTrigger && serviceContainer) {
        serviceTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            if (requirementContainer) {
                requirementContainer.classList.remove('open');
                if (requirementTrigger) requirementTrigger.setAttribute('aria-expanded', 'false');
            }
            const isOpen = serviceContainer.classList.toggle('open');
            serviceTrigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
    }

    // Toggle requirement dropdown
    if (requirementTrigger && requirementContainer) {
        requirementTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            if (serviceContainer) {
                serviceContainer.classList.remove('open');
                if (serviceTrigger) serviceTrigger.setAttribute('aria-expanded', 'false');
            }
            const isOpen = requirementContainer.classList.toggle('open');
            requirementTrigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
    }

    // Select service option
    if (serviceOptionsList) {
        const serviceOptions = serviceOptionsList.querySelectorAll('.custom-select-option');
        serviceOptions.forEach(opt => {
            opt.addEventListener('click', (e) => {
                e.stopPropagation();
                const serviceKey = opt.getAttribute('data-value');
                updateServiceRequirements(serviceKey);
                if (serviceContainer) {
                    serviceContainer.classList.remove('open');
                    if (serviceTrigger) serviceTrigger.setAttribute('aria-expanded', 'false');
                }
            });
        });
    }

    // Close any open custom dropdown on click outside
    document.addEventListener('click', (e) => {
        if (serviceContainer && !serviceContainer.contains(e.target)) {
            serviceContainer.classList.remove('open');
            if (serviceTrigger) serviceTrigger.setAttribute('aria-expanded', 'false');
        }
        if (requirementContainer && !requirementContainer.contains(e.target)) {
            requirementContainer.classList.remove('open');
            if (requirementTrigger) requirementTrigger.setAttribute('aria-expanded', 'false');
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (serviceContainer) {
                serviceContainer.classList.remove('open');
                if (serviceTrigger) serviceTrigger.setAttribute('aria-expanded', 'false');
            }
            if (requirementContainer) {
                requirementContainer.classList.remove('open');
                if (requirementTrigger) requirementTrigger.setAttribute('aria-expanded', 'false');
            }
        }
    });

    // Default initialization based on current page URL
    const pageUrl = window.location.pathname.toLowerCase();
    let initialService = 'open_schooling';
    if (pageUrl.includes('distance-learning')) {
        initialService = 'online_distance';
    } else if (serviceSelect && serviceSelect.value) {
        initialService = serviceSelect.value;
    }
    updateServiceRequirements(initialService);

    if (consultForm) {
        consultForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const nameInput = document.getElementById('consultName');
            const phoneInput = document.getElementById('consultPhone');
            const cityInput = document.getElementById('consultCity');

            const name = nameInput ? nameInput.value.trim() : '';
            const phone = phoneInput ? phoneInput.value.trim() : '';
            const serviceKey = serviceSelect ? serviceSelect.value : 'open_schooling';
            const meta = businessMeta[serviceKey] || businessMeta['open_schooling'];
            const serviceLabel = meta.name;
            const requirement = requirementSelect && requirementSelect.value 
                ? requirementSelect.value 
                : 'General Inquiry';
            const city = cityInput && cityInput.value.trim() ? cityInput.value.trim() : 'Surat';

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
🏢 *Service:* ${serviceLabel}
🎯 *Requirement / Program:* ${requirement}
📍 *City / Location:* ${city}

Please connect with me with complete details, fee structure, and admission guidance. Thank you!`;

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

