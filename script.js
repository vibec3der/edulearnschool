if (!localStorage.getItem(wispUrl)) {
	localStorage.setItem(wispUrl, "wss://gointospace.app/wisp/");
}

(function globalEduNav() {
	if (window.location.pathname.startsWith('/h')) return; // /h has its own nav.
	if (document.querySelector('.topbar')) return; // pages already have dedicated topbars
	if (document.querySelector('#edulearn-global-navbar')) return;

	const nav = document.createElement('nav');
	nav.id = 'edulearn-global-navbar';
	nav.innerHTML = `
		<a class="nav-brand" href="/h/">edulearn</a>
		<div class="nav-links">
			<a href="/h/" class="nav-item">Home</a>
			<a href="/g/" class="nav-item">Games</a>
			<a href="/g2/" class="nav-item">G2</a>
			<a href="/algebra.html" class="nav-item">SJ!</a>
			<a href="/a/" class="nav-item">AI</a>
			<a href="/t/" class="nav-item">Tools</a>
			<a href="/e/" class="nav-item">Extras</a>
		</div>
	`;

	document.body.insertBefore(nav, document.body.firstChild);
	document.body.style.paddingTop = '60px';

	const style = document.createElement('style');
	style.textContent = `
		#edulearn-global-navbar {
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			width: 100%;
			background: #1d2f5b;
			padding: 9px 18px;
			display: flex;
			justify-content: space-between;
			align-items: center;
			border-bottom: 1px solid #2f4c8f;
			z-index: 9999;
			box-shadow: 0 3px 10px rgba(0,0,0,0.25);
		}
		#edulearn-global-navbar .nav-brand {
			color: #8bb9ff;
			font-weight: 800;
			text-decoration: none;
			font-size: 1.1rem;
		}
		#edulearn-global-navbar .nav-links {
			display: flex;
			gap: 8px;
		}
		#edulearn-global-navbar .nav-item {
			color: #ebf3ff;
			background: rgba(255,255,255,0.06);
			padding: 6px 11px;
			border-radius: 8px;
			text-decoration: none;
			font-weight: 600;
			font-size: 13px;
			transition: background 0.15s ease, transform 0.15s ease;
		}
		#edulearn-global-navbar .nav-item:hover {
			background: rgba(111,165,255,0.25);
			transform: translateY(-1px);
		}
	`;
	document.head.appendChild(style);
})();