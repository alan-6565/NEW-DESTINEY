/**********************
 * Config (demo only)
 **********************/
const OWNER_PASSWORD = "NewDestiny1015"; // must match what you type
const LS_EVENTS_KEY = "ndcc_events";
const LS_PHOTOS_KEY = "ndcc_photos";

/**********************
 * Defaults
 **********************/
const defaultPhotos = [
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1525201548942-d8732f6617a0?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1600&auto=format&fit=crop"
];

const defaultEvents = [
  { title: "Community Outreach Saturday", when: "Sat • Dec 7 • 9:00 AM", where: "Fellowship Hall", desc: "Serve meals and deliver care packages to our neighbors in need.", link: "", img: "" },
  { title: "Christmas Choir Rehearsal",   when: "Thu • Dec 12 • 6:30 PM", where: "Sanctuary",       desc: "All voices welcome—prepare for the Christmas service.", link: "", img: "" },
  { title: "Youth Winter Night",          when: "Fri • Dec 20 • 6:00 PM", where: "Youth Center",    desc: "Games, worship, cocoa, and community for teens.", link: "", img: "" },
  { title: "Christmas Eve Candlelight",   when: "Tue • Dec 24 • 7:00 PM", where: "Sanctuary",       desc: "A family-friendly candlelight service celebrating the birth of Christ.", link: "", img: "" }
];

/**********************
 * State
 **********************/
let photos = [];
let eventsData = [];
let index = 0;          // carousel index
let timerId = null;     // carousel timer

/**********************
 * Helpers
 **********************/
const qs  = s => document.querySelector(s);
const qsa = s => Array.from(document.querySelectorAll(s));
// deploy-proof admin detection
const isAdmin = !!document.getElementById("adminMain");

function loadState() {
  photos = JSON.parse(localStorage.getItem(LS_PHOTOS_KEY) || "null") || defaultPhotos.slice();
  eventsData = JSON.parse(localStorage.getItem(LS_EVENTS_KEY) || "null") || defaultEvents.slice();
}
function savePhotos() { localStorage.setItem(LS_PHOTOS_KEY, JSON.stringify(photos)); }
function saveEvents() { localStorage.setItem(LS_EVENTS_KEY, JSON.stringify(eventsData)); }
function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[m]));
}
function isURL(u) {
  try { new URL(u); return true; } catch { return false; }
}

/**********************
 * PUBLIC PAGE RENDERERS
 **********************/
function renderPublicCarousel() {
  const slidesEl = qs("#slides");
  const dotsEl = qs("#dots");
  if (!slidesEl || !dotsEl) return;

  slidesEl.innerHTML = "";
  dotsEl.innerHTML = "";
  slidesEl.style.width = `${photos.length * 100}%`;

  photos.forEach((url, i) => {
    const img = document.createElement("img");
    img.src = url;
    img.alt = `Slide ${i + 1}`;
    slidesEl.appendChild(img);

    const dot = document.createElement("button");
    dot.className = "dot";
    dot.dataset.index = i;
    dot.setAttribute("aria-label", `Slide ${i + 1}`);
    dot.addEventListener("click", () => { goTo(i); startAuto(); });
    dotsEl.appendChild(dot);
  });

  index = 0;
  goTo(0);
}

function renderPublicEvents() {
  const grid = qs("#eventsGrid");
  if (!grid) return;
  grid.innerHTML = "";
  eventsData.forEach((ev) => {
    const card = document.createElement("article");
    card.className = "event";

    const imgHTML = ev.img
  ? `<img class="event-img" src="${escapeHTML(ev.img)}" alt="Event image">`
  : "";

const linkHTML = ev.link
  ? `<div class="event-actions"><a class="btn" href="${escapeHTML(ev.link)}" target="_blank" rel="noopener">Learn More</a></div>`
  : "";

    card.innerHTML = `
      ${imgHTML}
      <h3>${escapeHTML(ev.title)}</h3>
      <p class="meta">${escapeHTML(ev.when)}</p>
      <p>${escapeHTML(ev.desc)}</p>
      <p class="meta">${escapeHTML(ev.where)}</p>
      ${linkHTML}
    `;
    grid.appendChild(card);
  });
}

/**********************
 * ADMIN PAGE RENDERERS
 **********************/
function renderAdminEventList() {
  const listEv = qs("#eventAdminList");
  if (!listEv) return;
  listEv.innerHTML = "";

  eventsData.forEach((ev, i) => {
    const item = document.createElement("div");
    item.className = "admin-item";

    const thumb = ev.img
  ? `<img class="admin-thumb" src="${escapeHTML(ev.img)}" alt="Event image">`
  : "";

const linkPart = ev.link
  ? ` • <a href="${escapeHTML(ev.link)}" target="_blank" rel="noopener">Link</a>`
  : "";

    item.innerHTML = `
      ${thumb}
      <div class="row">
        <strong>${escapeHTML(ev.title)}</strong>
        <button class="btn outline" data-i="${i}" data-type="del-event">Remove</button>
      </div>
      <div class="small muted">${escapeHTML(ev.when)} • ${escapeHTML(ev.where)}${linkPart}</div>
      <div class="small">${escapeHTML(ev.desc)}</div>
    `;
    listEv.appendChild(item);
  });

  // Bind remove buttons for events
  listEv.querySelectorAll("button[data-type='del-event']").forEach(btn => {
    btn.addEventListener("click", () => {
      const i = Number(btn.dataset.i);
      eventsData.splice(i, 1);
      saveEvents();
      renderAdminEventList();   // update admin bubbles
      // Public page will live-update via storage event if open
    });
  });
}

function renderAdminPhotoList() {
  const listPh = qs("#photoAdminList");
  if (!listPh) return;
  listPh.innerHTML = "";

  photos.forEach((url, i) => {
    const item = document.createElement("div");
    item.className = "admin-item";
    item.innerHTML = `
      <div class="row">
        <span class="small">${escapeHTML(url)}</span>
        <div>
          <a href="${url}" class="btn outline" target="_blank" rel="noopener">View</a>
          <button class="btn outline" data-i="${i}" data-type="del-photo">Remove</button>
        </div>
      </div>
    `;
    listPh.appendChild(item);
  });

  // Bind remove buttons for photos
  listPh.querySelectorAll("button[data-type='del-photo']").forEach(btn => {
    btn.addEventListener("click", () => {
      const i = Number(btn.dataset.i);
      photos.splice(i, 1);
      savePhotos();
      renderAdminPhotoList();   // update admin photo list
    });
  });
}

/**********************
 * CAROUSEL CONTROLS (public)
 **********************/
function goTo(i) {
  const slidesEl = qs("#slides");
  const dots = qsa(".dot");
  if (!slidesEl || !dots.length) return;

  index = (i + dots.length) % dots.length;
  slidesEl.style.transform = `translateX(-${index * (100 / dots.length)}%)`;
  dots.forEach((d, n) => d.classList.toggle("active", n === index));
}
function next() { goTo(index + 1); }
function prev() { goTo(index - 1); }
function startAuto() { stopAuto(); timerId = setInterval(next, 5000); }
function stopAuto() { if (timerId) clearInterval(timerId); }

/**********************
 * LOGIN SHOW/HIDE (admin)
 **********************/

/******** IMAGE UPLOAD TO GITHUB (admin only) ********/
const dropZone = qs("#dropZone");
const filePicker = qs("#filePicker");
const ghTokenInput = qs("#ghToken");
const uploadStatus = qs("#uploadStatus");

// change these to match your repo
const GH_OWNER = "alan-6565";
const GH_REPO  = "NEW-DESTINEY";
const GH_FOLDER = "images"; // folder in repo where pics go

if (dropZone && filePicker && ghTokenInput) {
  dropZone.addEventListener("click", () => filePicker.click());

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragover");
  });

  dropZone.addEventListener("drop", async (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
    const file = e.dataTransfer.files?.[0];
    if (file) await uploadImageToGitHub(file);
  });

  filePicker.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (file) await uploadImageToGitHub(file);
  });
}

async function uploadImageToGitHub(file) {
  const token = (ghTokenInput.value || "").trim();
  if (!token) {
    uploadStatus.textContent = "❌ Please paste your GitHub token first.";
    return;
  }

  if (!file.type.startsWith("image/")) {
    uploadStatus.textContent = "❌ Please choose an image file.";
    return;
  }

  uploadStatus.textContent = "Uploading to GitHub…";

  // read file -> base64
  const base64 = await fileToBase64(file);
  const cleanBase64 = base64.split(",")[1];

  const ext = file.name.split(".").pop() || "png";
  const safeName = file.name
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .toLowerCase();

  // avoid collisions with timestamp
  const filename = `${Date.now()}-${safeName}`;

  const path = `${GH_FOLDER}/${filename}`;

  const apiUrl = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`;

  try {
    const res = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        "Authorization": `token ${token}`,
        "Accept": "application/vnd.github+json"
      },
      body: JSON.stringify({
        message: `Upload ${filename}`,
        content: cleanBase64
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(errText);
      uploadStatus.textContent = "❌ Upload failed. Check token + repo name.";
      return;
    }

    const data = await res.json();

    // This is the direct image URL on GitHub raw
    const rawUrl = data.content.download_url;

    uploadStatus.textContent = `✅ Uploaded! Image URL copied & filled.`;

    // Auto-fill event image field if present
    const evImg = qs("#evImg");
    if (evImg) evImg.value = rawUrl;

    // Auto-fill carousel field if you want
    const photoUrl = qs("#photoUrl");
    if (photoUrl) photoUrl.value = rawUrl;

    // copy to clipboard
    navigator.clipboard?.writeText(rawUrl);

  } catch (err) {
    console.error(err);
    uploadStatus.textContent = "❌ Upload failed (network or token).";
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
function showAdmin() {
  const loginPanel = qs("#loginPanel");
  const adminContent = qs("#adminContent");
  if (!loginPanel || !adminContent) return;
  loginPanel.classList.add("hidden");
  adminContent.classList.remove("hidden");

  // render current state into admin bubbles
  renderAdminEventList();
  renderAdminPhotoList();
}
function hideAdmin() {
  const loginPanel = qs("#loginPanel");
  const adminContent = qs("#adminContent");
  if (!loginPanel || !adminContent) return;
  loginPanel.classList.remove("hidden");
  adminContent.classList.add("hidden");
}

/**********************
 * PAGE INIT
 **********************/
document.addEventListener("DOMContentLoaded", () => {
  // Shared state load
  loadState();

  if (!isAdmin) {
    /******** PUBLIC PAGE ********/
    // render
    renderPublicCarousel();
    renderPublicEvents();

    // map button
    const mapButton = qs("#mapButton");
    if (mapButton) {
      mapButton.addEventListener("click", () => {
        window.open("https://www.google.com/maps/search/?api=1&query=5714+Solano+Ave,+Richmond,+CA+94805", "_blank");
      });
    }

    // carousel buttons
    const nextBtn = qs("#next");
    const prevBtn = qs("#prev");
    const carousel = qs(".carousel");
    if (nextBtn) nextBtn.addEventListener("click", () => { next(); startAuto(); });
    if (prevBtn) prevBtn.addEventListener("click", () => { prev(); startAuto(); });
    if (carousel) {
      carousel.addEventListener("mouseenter", stopAuto);
      carousel.addEventListener("mouseleave", startAuto);
    }
    startAuto();

    // LIVE UPDATE when admin saves in another tab
    window.addEventListener("storage", (e) => {
      if (e.key === LS_EVENTS_KEY || e.key === LS_PHOTOS_KEY) {
        loadState();
        renderPublicEvents();
        renderPublicCarousel();
      }
    });

  } else {
    /******** ADMIN PAGE ********/
    const loginBtn  = qs("#adminLoginBtn");
const passInput = qs("#adminPass");
const errorMsg  = qs("#loginError");

if (!loginBtn || !passInput || !errorMsg) return;
    const logoutBtn = qs("#logoutBtn");

    const eventForm = qs("#eventForm");
    const evTitle = qs("#evTitle");
    const evWhen  = qs("#evWhen");
    const evWhere = qs("#evWhere");
    const evDesc  = qs("#evDesc");
    const evLink  = qs("#evLink");
    const evImg   = qs("#evImg");

    const photoForm = qs("#photoForm");
    const photoUrl  = qs("#photoUrl");

    // if already logged in this session, show admin
    if (sessionStorage.getItem("ndcc_admin") === "1") showAdmin();

    // login flow
    function tryLogin() {
  const pass = (passInput.value || "").trim();

  if (pass === OWNER_PASSWORD) {
    sessionStorage.setItem("ndcc_admin", "1");
    errorMsg.textContent = "";
    showAdmin();
  } else {
    errorMsg.textContent = "Incorrect password.";
  }

  passInput.value = ""; // clears box after attempt
}

loginBtn.addEventListener("click", tryLogin);

// allow Enter key
passInput.addEventListener("keyup", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    tryLogin();
  }
});
    // logout
    logoutBtn.addEventListener("click", () => {
      sessionStorage.removeItem("ndcc_admin");
      hideAdmin();
    });

    // add event -> creates bubble immediately, saves, triggers public update via storage
    eventForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const title = evTitle.value.trim();
      const when  = evWhen.value.trim();
      const where = evWhere.value.trim();
      const desc  = evDesc.value.trim();
      const link  = evLink.value.trim();
      const img   = evImg.value.trim();

      if (!title || !when || !where || !desc) return;

      const newEvent = {
  title, when, where, desc,
  link: link || "",   // no validation
  img:  img  || ""    // no validation
};

      eventsData.unshift(newEvent);
      saveEvents();
      renderAdminEventList();   // show bubble under form
      eventForm.reset();        // clear fields
    });

    // add photo -> updates list immediately
    photoForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const url = photoUrl.value.trim();
      if (!isURL(url)) { alert("Please enter a valid image URL (https://...)"); return; }
      photos.push(url);
      savePhotos();
      renderAdminPhotoList();
      photoForm.reset();
    });
  }
});