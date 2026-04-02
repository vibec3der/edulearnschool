const container = document.getElementById('container');
const zoneViewer = document.getElementById('zoneViewer');
let zoneFrame = document.getElementById('zoneFrame');
const searchBar = document.getElementById('searchBar');
const sortOptions = document.getElementById('sortOptions');
const filterOptions = document.getElementById('filterOptions');

// --- SETTINGS STATE: Default ON (True) for images ---
// Changed logic to default to true unless explicitly set to 'false'
let showImages = localStorage.getItem('edulearn_images') !== 'false';

// Ensure images are on by default if not set
if (localStorage.getItem('edulearn_images') === null) {
    localStorage.setItem('edulearn_images', 'true');
    showImages = true;
}

const zonesurls = [
    "https://cdn.jsdelivr.net/%67%68/%67%6e%2d%6d%61%74%68/%61%73%73%65%74%73@%6d%61%69%6e/%7a%6f%6e%65%73%2e%6a%73%6f%6e",
    "https://cdn.jsdelivr.net/gh/gn-math/assets@latest/zones.json",
    "https://cdn.jsdelivr.net/gh/gn-math/assets@master/zones.json",
    "https://cdn.jsdelivr.net/gh/gn-math/assets/zones.json"
];
let zonesURL = zonesurls[Math.floor(Math.random() * zonesurls.length)];
const coverURL = "https://cdn.jsdelivr.net/gh/gn-math/covers@main";
const htmlURL = "https://cdn.jsdelivr.net/gh/gn-math/html@main";
let zones = [];
let popularityData = {};
const featuredContainer = document.getElementById('featuredZones');

function toTitleCase(str) {
  return str.replace(
    /\w\S*/g,
    text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
  );
}

// --- NEW TOGGLE FUNCTION ---
function toggleImages() {
    showImages = !showImages;
    localStorage.setItem('edulearn_images', showImages);
    
    // Clear featured container to force re-render in sortZones
    featuredContainer.innerHTML = ""; 
    sortZones(); 
    
    // Re-trigger settings click to update the button text
    document.getElementById('settings').click();
}

// --- AD SCRUBBER HELPER FUNCTION ---
function cleanHtmlAds(htmlContent) {
    // Removes AdSense scripts and ad insertion tags
    let cleaned = htmlContent.replace(/<script[^>]*pagead2\.googlesyndication\.com[^>]*><\/script>/gi, '');
    cleaned = cleaned.replace(/<ins[^>]*class=["']adsbygoogle["'][^>]*>.*?<\/ins>/gi, '');
    cleaned = cleaned.replace(/\(adsbygoogle\s*=\s*window\.adsbygoogle\s*\|\|\s*\[\]\)\.push\({}\);/gi, '');
    return cleaned;
}

async function listZones() {
    try {
      let sharesponse;
      let shajson;
      let sha;
        try {
          sharesponse = await fetch("https://api.github.com/repos/gn-math/assets/commits?t="+Date.now());
        } catch (error) {}
        if (sharesponse && sharesponse.status === 200) {
          try {
            shajson = await sharesponse.json();
            sha = shajson[0]['sha'];
            if (sha) {
                zonesURL = `https://cdn.jsdelivr.net/gh/gn-math/assets@${sha}/zones.json`;
            }
          } catch (error) {
            try {
                let secondarysharesponse = await fetch("https://raw.githubusercontent.com/gn-math/xml/refs/heads/main/sha.txt?t="+Date.now());
                if (secondarysharesponse && secondarysharesponse.status === 200) {
                    sha = (await secondarysharesponse.text()).trim();
                    if (sha) {
                        zonesURL = `https://cdn.jsdelivr.net/gh/gn-math/assets@${sha}/zones.json`;
                    }
                }
            } catch(error) {}
          }
        }
        const response = await fetch(zonesURL+"?t="+Date.now());
        const json = await response.json();
        zones = json;
        zones[0].featured = true; // always gonna be the discord
        await fetchPopularity();
        sortZones();
        const search = new URLSearchParams(window.location.search);
        const id = search.get('id');
        const embed = window.location.hash.includes("embed");
        if (id) {
            const zone = zones.find(zone => zone.id + '' == id + '');
            if (zone) {
                if (embed) {
                    if (zone.url.startsWith("http")) {
                        window.open(zone.url, "_blank");
                    } else {
                        const url = zone.url.replace("{COVER_URL}", coverURL).replace("{HTML_URL}", htmlURL);
                        fetch(url+"?t="+Date.now()).then(response => response.text()).then(html => {
                            
                            // Scrub ads out of embedded content
                            const cleanHtml = cleanHtmlAds(html);
                            document.documentElement.innerHTML = cleanHtml;
                            
                            document.documentElement.querySelectorAll('script').forEach(oldScript => {
                                const newScript = document.createElement('script');
                                if (oldScript.src) {
                                    newScript.src = oldScript.src;
                                } else {
                                    newScript.textContent = oldScript.textContent;
                                }
                                document.body.appendChild(newScript);
                            });
                        }).catch(error => alert("Failed to load zone: " + error));
                    }
                } else {
                    openZone(zone);
                }
            }
        }

        let alltags = [];
        for (const obj of json) {
            if (Array.isArray(obj.special)) {
                alltags.push(...obj.special);
            }
        }

        alltags = [...new Set(alltags)];
        let filteroption = document.getElementById("filterOptions");
        if (filteroption && filteroption.children.length > 1) {
            while (filteroption.children.length > 1) {
                filteroption.removeChild(filteroption.lastElementChild);
            }
        }
        for (const tag of alltags) {
            const opt = document.createElement("option");
            opt.value = tag;
            opt.textContent = toTitleCase(tag);
            filteroption.appendChild(opt);
        }
    } catch (error) {
        console.error(error);
        container.innerHTML = `Error loading zones: ${error}`;
    }
}

async function fetchPopularity() {
    try {
        const response = await fetch("https://data.jsdelivr.com/v1/stats/packages/gh/gn-math/html@main/files?period=year");
        const data = await response.json();
        data.forEach(file => {
            const idMatch = file.name.match(/\/(\d+)\.html$/);
            if (idMatch) {
                const id = parseInt(idMatch[1]);
                popularityData[id] = file.hits.total;
            }
        });
    } catch (error) {
        popularityData[0] = 0;
    }
}

function sortZones() {
    const sortBy = sortOptions.value;
    if (sortBy === 'name') {
        zones.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'id') {
        zones.sort((a, b) => a.id - b.id);
    } else if (sortBy === 'popular') {
        zones.sort((a, b) => (popularityData[b.id] || 0) - (popularityData[a.id] || 0));
    }
    zones.sort((a, b) => (a.id === -1 ? -1 : b.id === -1 ? 1 : 0));
    
    if (featuredContainer.innerHTML === "") {
        const featured = zones.filter(z => z.featured);
        displayFeaturedZones(featured);
    }
    displayZones(zones);
}

function displayFeaturedZones(featuredZones) {
    featuredContainer.innerHTML = "";
    featuredZones.forEach((file, index) => {
        const zoneItem = document.createElement("div");
        zoneItem.className = "zone-item";
        zoneItem.onclick = () => openZone(file);
        
        if (showImages) {
            const img = document.createElement("img");
            img.dataset.src = file.cover.replace("{COVER_URL}", coverURL).replace("{HTML_URL}", htmlURL);
            img.alt = file.name;
            img.loading = "lazy";
            img.className = "lazy-zone-img";
            zoneItem.appendChild(img);
        } else {
            zoneItem.classList.add('text-only');
        }

        const button = document.createElement("button");
        button.textContent = file.name;
        button.onclick = (event) => {
            event.stopPropagation();
            openZone(file);
        };
        zoneItem.appendChild(button);
        featuredContainer.appendChild(zoneItem);
    });
    
    if (featuredContainer.innerHTML === "") {
        featuredContainer.innerHTML = "No featured zones found.";
    } else {
        document.getElementById("allZonesSummary").textContent = `Featured Zones (${featuredZones.length})`;
    }

    if (showImages) {
        const lazyImages = document.querySelectorAll('#featuredZones img.lazy-zone-img');
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !zoneViewer.classList.contains('active')) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove("lazy-zone-img");
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: "100px", 
            threshold: 0.1
        });

        lazyImages.forEach(img => {
            imageObserver.observe(img);
        });
    }
}

function displayZones(zones) {
    container.innerHTML = "";
    zones.forEach((file, index) => {
        const zoneItem = document.createElement("div");
        zoneItem.className = "zone-item";
        zoneItem.onclick = () => openZone(file);
        
        if (showImages) {
            const img = document.createElement("img");
            img.dataset.src = file.cover.replace("{COVER_URL}", coverURL).replace("{HTML_URL}", htmlURL);
            img.alt = file.name;
            img.loading = "lazy";
            img.className = "lazy-zone-img";
            zoneItem.appendChild(img);
        } else {
            zoneItem.classList.add('text-only');
        }

        const button = document.createElement("button");
        button.textContent = file.name;
        button.onclick = (event) => {
            event.stopPropagation();
            openZone(file);
        };
        zoneItem.appendChild(button);
        container.appendChild(zoneItem);   
    });
    
    if (container.innerHTML === "") {
        container.innerHTML = "No zones found.";
    } else {
        document.getElementById("allSummary").textContent = `All Zones (${zones.length})`;
    }

    if (showImages) {
        const lazyImages = document.querySelectorAll('img.lazy-zone-img');
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !zoneViewer.classList.contains('active')) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove("lazy-zone-img");
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: "100px", 
            threshold: 0.1
        });

        lazyImages.forEach(img => {
            imageObserver.observe(img);
        });
    }
}

function filterZones2() {
    const query = filterOptions.value;
    if (query === "none") {
        displayZones(zones);
    } else {
        const filteredZones = zones.filter(zone => zone.special?.includes(query));
        if (query.length !== 0) {
            document.getElementById("featuredZonesWrapper").removeAttribute("open");
        }
        displayZones(filteredZones);
    }
}

function filterZones() {
    const query = searchBar.value.toLowerCase();
    const filteredZones = zones.filter(zone => zone.name.toLowerCase().includes(query));
    if (query.length !== 0) {
        document.getElementById("featuredZonesWrapper").removeAttribute("open");
    }
    displayZones(filteredZones);
}

function openZone(file) {
    if (file.url.startsWith("http")) {
        window.open(file.url, "_blank");
    } else {
        const url = file.url.replace("{COVER_URL}", coverURL).replace("{HTML_URL}", htmlURL);
        fetch(url+"?t="+Date.now()).then(response => response.text()).then(html => {
            
            const cleanHtml = cleanHtmlAds(html);

            // Re-grab the frame in case it changed
            zoneFrame = document.getElementById("zoneFrame");
            
            // Write the game HTML to the iframe
            zoneFrame.contentDocument.open();
            zoneFrame.contentDocument.write(cleanHtml);
            zoneFrame.contentDocument.close();
            
            // Set the URL State so sharing works
            const currentUrl = new URL(window.location);
            currentUrl.searchParams.set('id', file.id);
            history.pushState(null, '', currentUrl.toString());
            
            // Save ID for the external buttons
            zoneFrame.dataset.currentZoneId = file.id;

            // Show the Sandbox Overlay!
            zoneViewer.style.display = 'flex';
            zoneViewer.classList.add('active');
            document.body.style.overflow = 'hidden';

        }).catch(error => alert("Failed to load zone: " + error));
    }
}

function aboutBlank() {
    const newWindow = window.open("about:blank", "_blank");
    
    // Fallback to get the current zone ID
    const currentId = document.getElementById('zoneFrame').dataset.currentZoneId || new URL(window.location).searchParams.get('id');
    
    if(!currentId) {
        alert("Could not identify current game.");
        return;
    }
    
    let zone = zones.find(zone => zone.id + '' === currentId).url.replace("{COVER_URL}", coverURL).replace("{HTML_URL}", htmlURL);
    fetch(zone+"?t="+Date.now()).then(response => response.text()).then(html => {
        const cleanHtml = cleanHtmlAds(html);
        if (newWindow) {
            newWindow.document.open();
            newWindow.document.write(cleanHtml);
            newWindow.document.close();
        }
    })
}

function closeZone() {
    zoneViewer.classList.remove('active');
    zoneViewer.style.display = 'none';
    document.body.style.overflow = '';
    
    // Clear iframe to stop audio/game process from running in the background
    zoneFrame = document.getElementById('zoneFrame');
    zoneFrame.src = "about:blank"; 
    
    const url = new URL(window.location);
    url.searchParams.delete('id');
    history.pushState(null, '', url.toString());
}

function downloadZone() {
    const currentId = document.getElementById('zoneFrame').dataset.currentZoneId || new URL(window.location).searchParams.get('id');
    
    if(!currentId) {
        alert("Could not identify current game to download.");
        return;
    }

    let zone = zones.find(zone => zone.id + '' === currentId);
    fetch(zone.url.replace("{HTML_URL}", htmlURL)+"?t="+Date.now()).then(res => res.text()).then(text => {
        const cleanHtml = cleanHtmlAds(text);
        const blob = new Blob([cleanHtml], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = zone.name + ".html";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}

function fullscreenZone() {
    if (zoneFrame.requestFullscreen) {
        zoneFrame.requestFullscreen();
    } else if (zoneFrame.mozRequestFullScreen) {
        zoneFrame.mozRequestFullScreen();
    } else if (zoneFrame.webkitRequestFullscreen) {
        zoneFrame.webkitRequestFullscreen();
    } else if (zoneFrame.msRequestFullscreen) {
        zoneFrame.msRequestFullscreen();
    }
}

function darkMode() {
    document.body.classList.toggle("dark-mode");
}

function cloakIcon(url) {
    const link = document.querySelector("link[rel~='icon']");
    link.rel = "icon";
    if ((url+"").trim().length === 0) {
        link.href = "favicon.png";
    } else {
        link.href = url;
    }
    document.head.appendChild(link);
}

function cloakName(string) {
    if ((string+"").trim().length === 0) {
        document.title = "gn-math";
        return;
    }
    document.title = string;
}

function tabCloak() {
    closePopup();
    document.getElementById('popupTitle').textContent = "Tab Cloak";
    const popupBody = document.getElementById('popupBody');
    popupBody.innerHTML = `
        <label for="tab-cloak-textbox" style="font-weight: bold;">Set Tab Title:</label><br>
        <input type="text" id="tab-cloak-textbox" placeholder="Enter new tab name..." oninput="cloakName(this.value)">
        <br><br><br><br>
        <label for="tab-cloak-textbox" style="font-weight: bold;">Set Tab Icon:</label><br>
        <input type="text" id="tab-cloak-textbox" placeholder="Enter new tab icon..." oninput='cloakIcon(this.value)'>
        <br><br><br>
    `;
    popupBody.contentEditable = false;
    document.getElementById('popupOverlay').style.display = "flex";
}

const settings = document.getElementById('settings');
settings.addEventListener('click', () => {
    document.getElementById('popupTitle').textContent = "Settings";
    const popupBody = document.getElementById('popupBody');
    
    const imageStatus = showImages ? "ON (Click to Disable)" : "OFF (Click to Enable)";
    const btnColor = showImages ? 'var(--primary, #4CAF50)' : 'var(--text-muted, #777)'; 

    popupBody.innerHTML = `
    <button class="settings-button" onclick="darkMode()">Toggle Dark Mode</button>
    <br><br>
    <button class="settings-button" onclick="toggleImages()" style="background: ${btnColor}">
        Images: ${imageStatus}
    </button>
    <br><br>
    <button class="settings-button" onclick="tabCloak()">Tab Cloak</button>
    <br>
    `;
    popupBody.contentEditable = false;
    document.getElementById('popupOverlay').style.display = "flex";
});

function showContact() {
    document.getElementById('popupTitle').textContent = "Contact";
    const popupBody = document.getElementById('popupBody');
    popupBody.innerHTML = `
    <p>Discord: https://discord.gg/NAFw4ykZ7n</p>
    <p>Email: gn.math.business@gmail.com</p>`;
    popupBody.contentEditable = false;
    document.getElementById('popupOverlay').style.display = "flex";
}

function loadPrivacy() {
    document.getElementById('popupTitle').textContent = "Privacy Policy";
    const popupBody = document.getElementById('popupBody');
    popupBody.innerHTML = `
        <div style="max-height: 60vh; overflow-y: auto;">
            <h2>PRIVACY POLICY</h2>
            <p>Last updated Jan 31, 2026</p>
            <p>This Privacy Notice for Edulearn ("we," "us," or "our"), describes how and why we might access, collect, store, use, and/or share ("process") your personal information when you use our services ("Services")...</p>
            <p>If you have questions or concerns, please contact us at <a href="https://discord.gg/NAFw4ykZ7n">https://discord.gg/NAFw4ykZ7n</a>.</p>
        </div>
    `;
    popupBody.contentEditable = false;
    document.getElementById('popupOverlay').style.display = "flex";
}

function closePopup() {
    document.getElementById('popupOverlay').style.display = "none";
}

// Init Game Loading
listZones();

const schoolList = ["deledao", "goguardian", "lightspeed", "linewize", "securly", ".edu/"];

function isBlockedDomain(url) {
    const domain = new URL(url, location.origin).hostname + "/";
    return schoolList.some(school => domain.includes(school));
}

const originalFetch = window.fetch;
window.fetch = function (url, options) {
    if (isBlockedDomain(url)) {
        console.warn(`lam`);
        return Promise.reject(new Error("lam"));
    }
    return originalFetch.apply(this, arguments);
};

const originalOpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function (method, url) {
    if (isBlockedDomain(url)) {
        console.warn(`lam`);
        return;
    }
    return originalOpen.apply(this, arguments);
};

HTMLCanvasElement.prototype.toDataURL = function (...args) {
    return "";
};