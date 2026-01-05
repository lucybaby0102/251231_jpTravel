new WOW().init();

$(function () {

	const $window = $(window);
	const $document = $(document);
	const $body = $('body');
	let windowH = $window.height();

	// (你原本的：hamburger / nav)
	// =========================
	const $header = $('.js-header');
	const $hamburgerBtn = $('.js-hamburgerBtn');
	const $navList = $('.js-navList');
	const hero = document.querySelector('.placevedio'); // 或你實際的 section
	const heroText = document.querySelector('.word-group');


	$document.on('click', '.js-hamburgerBtn, .js-navList >li', function () {
		$hamburgerBtn.toggleClass('is-active');
		$header.toggleClass('blend-mode');
		$navList.toggleClass('is-navList');
		$body.toggleClass('is-scroll');
	});


	// 補丁：slide 太少時自動複製（保證跑馬燈不會停）
	// =========================
	function ensureEnoughSlides(swiperSelector, multiplier = 4) {
		const swiperEl = document.querySelector(swiperSelector);
		if (!swiperEl) return;

		const wrapper = swiperEl.querySelector('.swiper-wrapper');
		if (!wrapper) return;

		const slides = Array.from(wrapper.children);
		const originalCount = slides.length;
		if (originalCount === 0) return;

		// ⚠️ 若圖片尚未載入，offsetWidth 會是 0，先跳過
		const totalWidth = slides.reduce((sum, s) => sum + s.offsetWidth, 0);
		if (totalWidth === 0) return;

		const viewportWidth = window.innerWidth;
		const minTotalWidth = viewportWidth * multiplier;

		let currentWidth = totalWidth;
		let i = 0;

		while (currentWidth < minTotalWidth) {
			const clone = slides[i % originalCount].cloneNode(true);
			wrapper.appendChild(clone);
			currentWidth += slides[i % originalCount].offsetWidth;
			i++;
		}
	}

	
	
	

	// 圖片載入完再 update，避免 auto 寬度算錯導致 loop 看起來停住
	window.addEventListener('load', () => {
		ensureEnoughSlides('.topicsSwiper', 5);
		// topicsSwiper.update();

		// Swiper：topics 無限跑馬燈（真正一直循環）
		// =========================
		const topicsSwiper = new Swiper('.topicsSwiper', {
			slidesPerView: 'auto',
			spaceBetween: 24,

			loop: true,
			loopAdditionalSlides: 10,       // slidesPerView:auto 時很重要
			loopPreventsSliding: false,

			speed: 15000,
			autoplay: {
				delay: 0,
				disableOnInteraction: false,
				// pauseOnMouseEnter: true,
			},

			freeMode: true,
			freeModeMomentum: false,

			grabCursor: true,

			breakpoints: {
				0:    { spaceBetween: 16 },
				768:  { spaceBetween: 20 },
				1024: { spaceBetween: 24 },
			}
		});

		// hover 暫停 / 繼續
		const topicsEl = document.querySelector('.topicsSwiper');
		if (topicsEl && topicsSwiper.autoplay) {
			topicsEl.addEventListener('mouseenter', () => {
				topicsSwiper.autoplay.stop();
			});

			topicsEl.addEventListener('mouseleave', () => {
				topicsSwiper.autoplay.start();
			});
		}
	});
	



	// mainVisual blur（沿用你的效果，但不要重複綁多套 scroll）
	// =========================
	const $mainVisualConcept = $('.js-mainVisual_concept');
	const $mainVisualInner = $('.js-mainVisual_inner');
	let mainVisualConceptTop = $mainVisualConcept.length ? $mainVisualConcept.offset().top : 0;

	// =========================
	// story 三方向滑入（不動你效果）
	// =========================
	const storySection = document.querySelector('.story');
	const storyFigures = storySection ? storySection.querySelectorAll('.photo-group figure') : null;

	if (storyFigures && storyFigures.length) {
		storyFigures.forEach((fig, i) => {
		if (i === 0) {          // 左 → 右
			fig.style.setProperty('--from-x', '-220px');
			fig.style.setProperty('--from-y', '0px');
		} else if (i === 1) {   // 下 → 上
			fig.style.setProperty('--from-x', '0px');
			fig.style.setProperty('--from-y', '220px');
		} else if (i === 2) {   // 右 → 左
			fig.style.setProperty('--from-x', '220px');
			fig.style.setProperty('--from-y', '0px');
		}
		fig.classList.add('is-reveal');
		});
	}

	let storyActive = false;
	if (storySection && storyFigures && storyFigures.length) {
		const io = new IntersectionObserver((entries) => {
		entries.forEach((e) => {
			storyActive = e.isIntersecting;
			if (storyActive) requestTick();
		});
		}, { threshold: 0.1 });

		io.observe(storySection);
	}

	// 共用 scroll manager（只留一套，避免衝突）
	// =========================
	let lastY = window.scrollY;
	let speedBoost = 0;
	let ticking = false;

	function clamp(n, min, max) {
		return Math.max(min, Math.min(max, n));
	}

	function requestTick() {
		if (!ticking) {
		ticking = true;
		requestAnimationFrame(update);
		}
	}

	function update() {
		ticking = false;

		// A) blur
		if ($mainVisualInner.length) {
		const scrollY = window.scrollY || 0;
		const blurPx = (scrollY * 0.01).toFixed(2);
		if (scrollY + windowH > mainVisualConceptTop) {
			$mainVisualInner.css({ 'backdrop-filter': `blur(${blurPx}px)` });
		}
		}

		// B) story 進場
		if (storyActive && storySection && storyFigures && storyFigures.length) {
		const rect = storySection.getBoundingClientRect();
		const vh = window.innerHeight;

		const start = vh * 0.85;
		const end = -vh * 0.15;
		const t = (start - rect.top) / (start - end);
		const progress = clamp(t, 0, 1);

		storyFigures.forEach((fig, i) => {
			const fromX = parseFloat(getComputedStyle(fig).getPropertyValue('--from-x')) || 0;
			const fromY = parseFloat(getComputedStyle(fig).getPropertyValue('--from-y')) || 0;

			const delay = i * 0.12;
			const p = clamp((progress - delay) / (1 - delay), 0, 1);
			const eased = 1 - Math.pow(1 - p, 1 + speedBoost);

			fig.style.setProperty('--tx', `${fromX * (1 - eased)}px`);
			fig.style.setProperty('--ty', `${fromY * (1 - eased)}px`);
			fig.style.setProperty('--op', eased.toFixed(3));
		});

			requestTick();
		}

		// C) HERO 文字：放大＋模糊＋淡出（新增）
		// =========================
		if (hero) {
			const heroText = hero.querySelector('.word-group');
			const h = hero.offsetHeight;
			if (heroText && h > 0) {
				const rect = hero.getBoundingClientRect();

				const start = 0.15;
				const end = 0.85;

				const raw = -rect.top / h;
				const tt = (raw - start) / (end - start);
				const progress = clamp(tt, 0, 1);

				const scale = 1 + progress * 0.45;
				const blur = progress * 16;
				const opacity = 1 - progress * 1.2;
				const y = progress * -40;

				heroText.style.transform = `translateY(${y}px) scale(${scale})`;
				heroText.style.filter = `blur(${blur}px)`;
				heroText.style.opacity = clamp(opacity, 0, 1);
			}
		}
	}

	window.addEventListener('scroll', () => {
		const y = window.scrollY;
		const dy = Math.abs(y - lastY);
		lastY = y;

		const target = clamp(dy / 80, 0, 2.5);
		speedBoost = speedBoost * 0.85 + target * 0.15;

		requestTick();
	}, { passive: true });

	window.addEventListener('resize', () => {
		windowH = $window.height();
		mainVisualConceptTop = $mainVisualConcept.length ? $mainVisualConcept.offset().top : 0;
		requestTick();
	}, { passive: true });

	requestTick();

	
	
	const festival = document.querySelector(".festival");
	if (festival) {
		const tabs = document.querySelectorAll(".tabBlock_nav .nav-link");

		function setFestivalBg(url) {
			if (!url) return;

			festival.style.setProperty("--festival-bg-url",`url("${url}")`);

			festival.classList.add("is-bg-active");

			// tab 切換後，保險 refresh 一下 ScrollTrigger
			if (window.ScrollTrigger) {
				ScrollTrigger.refresh();
			}
		}

	// 初始背景
	const active = document.querySelector(".tabBlock_nav .nav-link.active");
		if (active && active.dataset.bg) {
			setFestivalBg(active.dataset.bg);
		}

		// Tab 切換
		tabs.forEach((tab) => {
			tab.addEventListener("shown.bs.tab", (e) => {
			const bg = e.target.dataset.bg;
			if (bg) setFestivalBg(bg);
			});
		});
	}
	
	// GSAP ScrollTrigger 視差
	gsap.registerPlugin(ScrollTrigger);

	gsap.to("#FESTIVAL .festivalBg", {
		y: -120,
		ease: "none",
		scrollTrigger: {
			trigger: "#FESTIVAL",
			start: "top bottom",
			end: "bottom top",
			scrub: true
		}
	});

	//背景縮放用 GSAP tween
	let breatheTween;

	function startBreathe() {
		if (breatheTween) breatheTween.kill();
		breatheTween = gsap.to("#FESTIVAL .festivalBg_img", {
			scale: 1.18,
			duration: 6,
			ease: "sine.inOut",
			yoyo: true,
			repeat: -1
		});
	}

	// 初始化跑一次
	startBreathe();
	
});

