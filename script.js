const EDULEARN_WISP_KEY = 'wispUrl';
if (!localStorage.getItem(EDULEARN_WISP_KEY)) {
	localStorage.setItem(EDULEARN_WISP_KEY, "wss://geometryislife.bostoncareercounselor.com/wisp/");
}

(function globalEduNav() {
	const path = window.location.pathname.toLowerCase();
	if (path === '/' || path === '/index.html' || path.includes('/login') || path.endsWith('login.html') || path.startsWith('/g2games/')) return;
	if (document.querySelector('#edulearn-global-navbar')) return;

	function ensureFontAwesome() {
		if (document.querySelector('link[href*="font-awesome"]')) return;
		const fa = document.createElement('link');
		fa.rel = 'stylesheet';
		fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
		document.head.appendChild(fa);
	}

	ensureFontAwesome();

	const nav = document.createElement('nav');
	nav.id = 'edulearn-global-navbar';
	nav.className = 'navbar';
	nav.innerHTML = `
		<div class="nav-ring">
			<a class="nav-item" href="/h/" title="Home"><i class="fa-solid fa-house"></i><span>Home</span></a>
			<a class="nav-item" href="/g/" title="Games"><i class="fa-solid fa-gamepad"></i><span>Games</span></a>
			<a class="nav-item" href="/g2/" title="G2"><i class="fa-solid fa-dice-d20"></i><span>G2</span></a>
			<a class="nav-item" href="/algebra.html" title="SJ!"><i class="fa-solid fa-globe"></i><span>SJ!</span></a>
			<a class="nav-item" href="/a/" title="AI"><i class="fa-solid fa-robot"></i><span>AI</span></a>
			<a class="nav-item" href="/t/" title="Tools"><i class="fa-solid fa-wrench"></i><span>Tools</span></a>
			<a class="nav-item" href="/e/" title="Extras"><i class="fa-solid fa-shapes"></i><span>Extras</span></a>
			<button id="edulearn-navbar-collapse" class="nav-icon nav-collapse" type="button" title="Hide bar"><i class="fa-solid fa-chevron-up"></i></button>
		</div>
	`;
	document.body.insertBefore(nav, document.body.firstChild);

	const collapseToggle = document.getElementById('edulearn-navbar-collapse');
	let miniButton = document.querySelector('#edulearn-navbar-mini');
	if (!miniButton) {
		miniButton = document.createElement('button');
		miniButton.id = 'edulearn-navbar-mini';
		miniButton.type = 'button';
		miniButton.title = 'Show navigation';
		miniButton.innerHTML = '<i class="fa-solid fa-chevron-down"></i>';
		document.body.appendChild(miniButton);
	}

	function setBodyPadding() {
		document.body.style.paddingTop = '0';
	}

	function setNavState(collapsed) {
		nav.classList.toggle('collapsed', collapsed);
		miniButton.style.display = collapsed ? 'flex' : 'none';
		setBodyPadding();
	}

	collapseToggle.addEventListener('click', () => {
		const collapsed = !nav.classList.contains('collapsed');
		localStorage.setItem('edulearn-navbar-collapsed', collapsed.toString());
		setNavState(collapsed);
	});

	miniButton.addEventListener('click', () => {
		localStorage.setItem('edulearn-navbar-collapsed', 'false');
		setNavState(false);
		nav.scrollIntoView({behavior: 'smooth'});
	});

	const currentPath = window.location.pathname;
	nav.querySelectorAll('.nav-item[href]').forEach(link => {
		if (currentPath.startsWith(link.getAttribute('href'))) {
			link.classList.add('active');
		}
	});

	const settingsButton = document.createElement('button');
	settingsButton.className = 'nav-item';
	settingsButton.type = 'button';
	settingsButton.title = 'Settings';
	settingsButton.innerHTML = '<i class="fa-solid fa-gear"></i><span>Settings</span>';
	settingsButton.addEventListener('click', () => {
		if (typeof openModal === 'function') {
			openModal('settings-modal');
		} else {
			const modal = document.getElementById('settings-modal');
			if (modal) {
				modal.classList.toggle('hidden');
				modal.style.display = modal.classList.contains('hidden') ? 'none' : 'flex';
			} else {
				window.location.href = '/h/';
			}
		}
	});
	nav.querySelector('.nav-ring').appendChild(settingsButton);

	const initialCollapsed = localStorage.getItem('edulearn-navbar-collapsed') === 'true';
	setNavState(initialCollapsed);

	window.addEventListener('resize', () => setNavState(nav.classList.contains('collapsed')));

	const style = document.createElement('style');
	style.textContent = `
		#edulearn-global-navbar {
			position: fixed;
			top: 16px;
			left: 50%;
			transform: translateX(-50%);
			max-width: min(100%, 980px);
			width: auto;
			padding: 12px 16px;
			background: rgba(16, 18, 22, 0.94);
			border: 1px solid rgba(255,255,255,0.08);
			backdrop-filter: blur(20px);
			border-radius: 999px;
			display: flex;
			justify-content: center;
			align-items: center;
			gap: 10px;
			z-index: 10000;
			box-shadow: 0 24px 80px rgba(0,0,0,0.4);
			transition: transform 0.25s ease, opacity 0.25s ease;
		}

		#edulearn-global-navbar.collapsed {
			transform: translate(-50%, -120%);
			opacity: 0;
			pointer-events: none;
		}

		#edulearn-global-navbar .nav-ring {
			display: inline-flex;
			align-items: center;
			gap: 10px;
		}

		#edulearn-global-navbar .nav-item {
			display: inline-flex;
			align-items: center;
			gap: 8px;
			padding: 10px 14px;
			border-radius: 16px;
			border: 1px solid transparent;
			background: rgba(255,255,255,0.08);
			color: #f6f3ff;
			text-decoration: none;
			font-size: 14px;
			font-weight: 700;
			cursor: pointer;
			transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease;
		}

		#edulearn-global-navbar .nav-item i {
			font-size: 16px;
		}

		#edulearn-global-navbar .nav-item span {
			white-space: nowrap;
		}

		#edulearn-global-navbar .nav-item:hover,
		#edulearn-global-navbar .nav-item.active {
			background: rgba(255,255,255,0.14);
			border-color: rgba(255,255,255,0.16);
			transform: translateY(-2px);
			color: #ffffff;
		}

		#edulearn-global-navbar .nav-icon {
			width: 42px;
			height: 42px;
			display: inline-flex;
			align-items: center;
			justify-content: center;
			border-radius: 50%;
			border: 1px solid transparent;
			background: rgba(255,255,255,0.08);
			color: #f6f3ff;
			font-size: 16px;
			cursor: pointer;
			transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease;
		}

		#edulearn-global-navbar .nav-icon:hover,
		#edulearn-global-navbar .nav-icon.active {
			background: rgba(255,255,255,0.1);
			border-color: rgba(255,255,255,0.18);
			transform: translateY(-1px);
			color: #ffffff;
		}

		#edulearn-navbar-collapse {
			width: 40px;
			height: 40px;
			font-size: 15px;
			background: rgba(255,255,255,0.08);
		}

		#edulearn-navbar-mini {
			position: fixed;
			top: 18px;
			left: 50%;
			transform: translateX(-50%);
			width: 38px;
			height: 30px;
			border-radius: 999px;
			background: rgba(255,255,255,0.08);
			border: 1px solid rgba(255,255,255,0.16);
			color: #f7f3ff;
			display: none;
			align-items: center;
			justify-content: center;
			cursor: pointer;
			z-index: 10001;
			box-shadow: 0 12px 28px rgba(0,0,0,0.28);
			font-size: 18px;
			padding: 0;
		}

		#edulearn-navbar-mini:hover {
			transform: translate(-50%, -1px);
		}

		:root {
			--el-bg: #0f1013;
			--el-bg-alt: #181a1e;
			--el-panel: rgba(24, 26, 32, 0.96);
			--el-panel-soft: rgba(255, 255, 255, 0.05);
			--el-border: rgba(255, 255, 255, 0.1);
			--el-text: #eef0ff;
			--el-muted: rgba(255, 255, 255, 0.72);
			--el-accent: #91c7ff;
			--el-accent-strong: #d7f0ff;
		}

		html, body {
			background: radial-gradient(circle at top, rgba(70, 95, 150, 0.15), rgba(15, 16, 19, 0.98)) !important;
			background-color: var(--el-bg) !important;
			color: var(--el-text) !important;
		}

		body {
			min-height: 100vh;
		}

		a, a:link, a:visited {
			color: var(--el-accent) !important;
		}

		a:hover, a:focus {
			color: var(--el-accent-strong) !important;
		}

		button, .btn, .button, .clean-btn {
			color: var(--el-text) !important;
		}

		button:hover, .btn:hover, .button:hover, .clean-btn:hover {
			background: rgba(255, 255, 255, 0.12) !important;
			color: #ffffff !important;
		}

		.modal-overlay, .settings-box, .popup, .dialog {
			background: rgba(15, 17, 23, 0.96) !important;
			border-color: var(--el-border) !important;
		}
	`;
	document.head.appendChild(style);
})();