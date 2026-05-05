const STORAGE_KEYS = {
  users: "bustimetrack.users",
  buses: "bustimetrack.buses",
  session: "bustimetrack.session",
  otp: "bustimetrack.otp"
};

const seedBuses = [
  {
    id: "bus-1",
    ownerId: "demo-owner",
    busNumber: "B12",
    route: "Depot -> River Park",
    stops: ["Depot", "Market", "Central", "River Park"],
    driverName: "Anita Kumar",
    status: "active",
    currentStop: "Central",
    eta: "6 mins",
    nearby: true
  },
  {
    id: "bus-2",
    ownerId: "demo-owner",
    busNumber: "C4",
    route: "North Hub -> Central",
    stops: ["North Hub", "Hospital", "Central"],
    driverName: "Rohan Singh",
    status: "idle",
    currentStop: "Hospital",
    eta: "11 mins",
    nearby: false
  },
  {
    id: "bus-3",
    ownerId: "demo-owner",
    busNumber: "M7",
    route: "West End -> Market",
    stops: ["West End", "College", "Market"],
    driverName: "",
    status: "active",
    currentStop: "College",
    eta: "4 mins",
    nearby: true
  }
];

const routeSnapshots = [
  { current: "Leaving Depot", next: "Market", eta: "11 mins" },
  { current: "Between Depot and Market", next: "Market", eta: "8 mins" },
  { current: "Approaching Central", next: "Central", eta: "6 mins" },
  { current: "Leaving Central", next: "River Park", eta: "9 mins" },
  { current: "Near River Park", next: "Final stop", eta: "3 mins" }
];

function readStorage(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

function writeStorage(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function ensureSeedData() {
  const existingBuses = readStorage(STORAGE_KEYS.buses, null);
  if (!existingBuses) {
    writeStorage(STORAGE_KEYS.buses, seedBuses);
  }
}

function getUsers() {
  return readStorage(STORAGE_KEYS.users, []);
}

function saveUsers(users) {
  writeStorage(STORAGE_KEYS.users, users);
}

function getBuses() {
  ensureSeedData();
  return readStorage(STORAGE_KEYS.buses, []);
}

function saveBuses(buses) {
  writeStorage(STORAGE_KEYS.buses, buses);
}

function getSession() {
  return readStorage(STORAGE_KEYS.session, null);
}

function setSession(session) {
  writeStorage(STORAGE_KEYS.session, session);
}

function clearSession() {
  window.localStorage.removeItem(STORAGE_KEYS.session);
}

function showToast(message, tone = "default") {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }

  toast.className = `toast visible ${tone}`;
  toast.textContent = message;
  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => {
    toast.classList.remove("visible");
  }, 2400);
}

function makeId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function sanitizePhone(phone) {
  return phone.replace(/\D/g, "");
}

function sanitizeEmail(email) {
  return email.trim().toLowerCase();
}

function generateOtp(contact) {
  const otp = "123456";
  writeStorage(STORAGE_KEYS.otp, { contact, otp, createdAt: Date.now() });
  return otp;
}

function verifyOtp(contact, otp) {
  const stored = readStorage(STORAGE_KEYS.otp, null);
  if (!stored) return false;
  return stored.contact === contact && stored.otp === otp;
}

function findUserByMobile(mobile) {
  const normalized = sanitizePhone(mobile);
  return getUsers().find((user) => sanitizePhone(user.mobile) === normalized);
}

function findUserByEmail(email) {
  const normalized = sanitizeEmail(email);
  return getUsers().find((user) => sanitizeEmail(user.email || "") === normalized);
}

function loginUser(user, rememberMe = false) {
  setSession({
    userId: user.id,
    role: user.role,
    rememberMe,
    loggedInAt: Date.now()
  });
}

function currentUser() {
  const session = getSession();
  if (!session) return null;
  return getUsers().find((user) => user.id === session.userId) || null;
}

function redirectForRole(role) {
  window.location.href = role === "owner" ? "owner.html" : "tracking.html";
}

function requireAuth(role) {
  const user = currentUser();
  if (!user) {
    window.location.href = "index.html";
    return null;
  }
  if (role && user.role !== role) {
    redirectForRole(user.role);
    return null;
  }
  return user;
}

function initHeader() {
  const user = currentUser();
  const authLinks = document.querySelectorAll("[data-auth-link]");
  const authActions = document.querySelectorAll("[data-auth-actions]");
  const userLabels = document.querySelectorAll("[data-user-name]");
  const roleLabels = document.querySelectorAll("[data-user-role]");
  const logoutButtons = document.querySelectorAll("[data-logout]");

  authLinks.forEach((node) => {
    if (!user) return;
    const target = user.role === "owner" ? "owner.html" : "tracking.html";
    node.setAttribute("href", target);
    node.textContent = user.role === "owner" ? "Owner Dashboard" : "Passenger Home";
  });

  authActions.forEach((node) => {
    node.hidden = !user;
  });

  userLabels.forEach((node) => {
    node.textContent = user ? user.name : "";
  });

  roleLabels.forEach((node) => {
    node.textContent = user ? `${user.role === "owner" ? "Bus Owner" : "Passenger"} Mode` : "";
  });

  logoutButtons.forEach((button) => {
    button.addEventListener("click", () => {
      clearSession();
      showToast("Logged out.");
      window.setTimeout(() => {
        window.location.href = "index.html";
      }, 250);
    });
  });
}

function initLoginPage() {
  const quickRoleButtons = document.querySelectorAll("[data-role-jump]");
  const tabButtons = document.querySelectorAll(".tab-button");
  const panels = document.querySelectorAll(".login-panel");
  const mobileForm = document.getElementById("mobileLoginForm");
  const emailForm = document.getElementById("emailLoginForm");
  const otpButton = document.getElementById("sendOtpButton");

  if (!mobileForm || !emailForm) return;

  const session = getSession();
  if (session) {
    redirectForRole(session.role);
    return;
  }

  function activateTab(mode) {
    tabButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.mode === mode);
    });
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.mode !== mode;
    });
  }

  quickRoleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const role = button.dataset.roleJump;
      window.location.href = `signup.html?role=${encodeURIComponent(role)}`;
    });
  });

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => activateTab(button.dataset.mode));
  });

  otpButton.addEventListener("click", () => {
    const mobileValue = mobileForm.elements.mobile.value.trim();
    if (!mobileValue) {
      showToast("Enter your mobile number first.", "error");
      return;
    }
    generateOtp(sanitizePhone(mobileValue));
    showToast("OTP sent. Use 123456 for this demo.");
  });

  mobileForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const mobile = sanitizePhone(mobileForm.elements.mobile.value.trim());
    const otp = mobileForm.elements.otp.value.trim();
    const rememberMe = mobileForm.elements.rememberMe.checked;

    if (!mobile || !otp) {
      showToast("Mobile and OTP are required.", "error");
      return;
    }

    const user = findUserByMobile(mobile);
    if (!user) {
      showToast("No account found for that mobile number.", "error");
      return;
    }

    if (!verifyOtp(mobile, otp)) {
      showToast("Invalid OTP. Use 123456 for demo login.", "error");
      return;
    }

    loginUser(user, rememberMe);
    showToast("Login successful.");
    window.setTimeout(() => redirectForRole(user.role), 250);
  });

  emailForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = sanitizeEmail(emailForm.elements.email.value);
    const password = emailForm.elements.password.value.trim();
    const rememberMe = emailForm.elements.rememberMe.checked;

    if (!email || !password) {
      showToast("Email and password are required.", "error");
      return;
    }

    const user = findUserByEmail(email);
    if (!user || user.password !== password) {
      showToast("Incorrect email or password.", "error");
      return;
    }

    loginUser(user, rememberMe);
    showToast("Login successful.");
    window.setTimeout(() => redirectForRole(user.role), 250);
  });

  activateTab("mobile");
}

function initSignupPage() {
  const form = document.getElementById("signupForm");
  if (!form) return;

  const roleButtons = document.querySelectorAll("[data-role-option]");
  const passengerHint = document.getElementById("passengerHint");
  const otpButton = document.getElementById("signupOtpButton");
  const roleInput = form.elements.role;
  const urlRole = new URLSearchParams(window.location.search).get("role");

  function setRole(role) {
    roleInput.value = role;
    roleButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.roleOption === role);
    });
    form.elements.password.required = role === "owner";
    passengerHint.hidden = role === "owner";
  }

  roleButtons.forEach((button) => {
    button.addEventListener("click", () => setRole(button.dataset.roleOption));
  });

  otpButton.addEventListener("click", () => {
    const mobile = sanitizePhone(form.elements.mobile.value.trim());
    if (!mobile) {
      showToast("Enter a mobile number first.", "error");
      return;
    }
    generateOtp(mobile);
    showToast("OTP sent. Use 123456 for this demo.");
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const role = roleInput.value;
    const name = form.elements.name.value.trim();
    const mobile = sanitizePhone(form.elements.mobile.value.trim());
    const email = sanitizeEmail(form.elements.email.value || "");
    const password = form.elements.password ? form.elements.password.value.trim() : "";
    const otp = form.elements.otp.value.trim();

    if (!name || !mobile || !otp) {
      showToast("Name, mobile, and OTP are required.", "error");
      return;
    }

    if (role === "owner" && (!email || !password)) {
      showToast("Owners need email and password.", "error");
      return;
    }

    if (findUserByMobile(mobile)) {
      showToast("That mobile number is already registered.", "error");
      return;
    }

    if (email && findUserByEmail(email)) {
      showToast("That email is already registered.", "error");
      return;
    }

    if (!verifyOtp(mobile, otp)) {
      showToast("Invalid OTP. Use 123456 for demo signup.", "error");
      return;
    }

    const newUser = {
      id: makeId("user"),
      role,
      name,
      mobile,
      email,
      password: role === "owner" ? password : password || "",
      createdAt: Date.now()
    };

    const users = getUsers();
    users.push(newUser);
    saveUsers(users);
    loginUser(newUser, true);
    showToast("Account created. Redirecting now.");
    window.setTimeout(() => redirectForRole(role), 250);
  });

  setRole(urlRole === "owner" ? "owner" : "passenger");
}

function renderPassengerResults(query = "") {
  const resultArea = document.getElementById("passengerResults");
  const nearbyArea = document.getElementById("nearbyBuses");
  const liveArea = document.getElementById("liveTrackingList");
  const activeBusName = document.getElementById("activeBusName");
  const activeBusRoute = document.getElementById("activeBusRoute");
  const activeBusStatus = document.getElementById("activeBusStatus");
  const currentLocation = document.getElementById("currentLocation");
  const nextStop = document.getElementById("nextStop");
  const etaValue = document.getElementById("etaValue");

  if (!resultArea || !nearbyArea || !liveArea) return;

  const buses = getBuses();
  const term = query.trim().toLowerCase();
  const matches = term
    ? buses.filter((bus) => {
        const stopText = bus.stops.join(" ").toLowerCase();
        return (
          bus.busNumber.toLowerCase().includes(term) ||
          bus.route.toLowerCase().includes(term) ||
          stopText.includes(term)
        );
      })
    : buses.filter((bus) => bus.status === "active" || bus.nearby);

  if (!matches.length) {
    resultArea.innerHTML = `
      <article class="result-card empty-state">
        <p class="section-tag">No Match</p>
        <h3>No buses found</h3>
        <p>Try a bus number, stop, or route keyword.</p>
      </article>
    `;
    return;
  }

  resultArea.innerHTML = matches
    .map((bus) => `
      <article class="result-card">
        <div class="result-top">
          <div>
            <p class="section-tag">${bus.busNumber}</p>
            <h3>${bus.route}</h3>
          </div>
          <span class="status-pill ${bus.status === "active" ? "online" : "offline"}">
            ${bus.status === "active" ? "Live" : "Idle"}
          </span>
        </div>
        <div class="result-meta">
          <strong>Now at ${bus.currentStop}</strong>
          <span>ETA ${bus.eta}</span>
        </div>
        <p>${bus.stops.join(" | ")}</p>
      </article>
    `)
    .join("");

  nearbyArea.innerHTML = buses
    .filter((bus) => bus.nearby)
    .map((bus) => `
      <article class="mini-card">
        <strong>${bus.busNumber}</strong>
        <span>${bus.currentStop}</span>
        <p>${bus.eta}</p>
      </article>
    `)
    .join("");

  liveArea.innerHTML = buses
    .filter((bus) => bus.status === "active")
    .map((bus) => `
      <article class="mini-card wide">
        <strong>${bus.busNumber}</strong>
        <span>${bus.route}</span>
        <p>Next stop: ${bus.currentStop}</p>
      </article>
    `)
    .join("");

  const focusBus = matches[0];
  const snapshotIndex = Math.min(
    Math.floor(((Date.now() / 1000) % routeSnapshots.length)),
    routeSnapshots.length - 1
  );
  const snapshot = routeSnapshots[snapshotIndex];

  activeBusName.textContent = focusBus.busNumber;
  activeBusRoute.textContent = focusBus.route;
  activeBusStatus.textContent = focusBus.status === "active" ? "Trip Active" : "Ready";
  activeBusStatus.className = `status-pill ${focusBus.status === "active" ? "online" : "offline"}`;
  currentLocation.textContent = snapshot.current;
  nextStop.textContent = snapshot.next;
  etaValue.textContent = snapshot.eta;
}

function initPassengerHome() {
  const user = requireAuth("passenger");
  if (!user) return;

  const welcome = document.getElementById("passengerWelcome");
  const form = document.getElementById("passengerSearchForm");
  const input = document.getElementById("passengerSearchInput");
  const params = new URLSearchParams(window.location.search);

  if (welcome) {
    welcome.textContent = `${user.name}, find your bus fast.`;
  }

  if (input) {
    input.value = params.get("query") || "";
  }

  renderPassengerResults(input ? input.value : "");

  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = input.value.trim();
    const nextUrl = query ? `tracking.html?query=${encodeURIComponent(query)}` : "tracking.html";
    window.history.replaceState({}, "", nextUrl);
    renderPassengerResults(query);
  });
}

function renderOwnerBuses(owner) {
  const list = document.getElementById("ownerBusList");
  if (!list) return;

  const buses = getBuses().filter((bus) => bus.ownerId === owner.id);
  const summary = document.getElementById("ownerBusCount");
  if (summary) {
    summary.textContent = `${buses.length} ${buses.length === 1 ? "bus" : "buses"}`;
  }

  if (!buses.length) {
    list.innerHTML = `
      <article class="result-card empty-state">
        <p class="section-tag">No Buses Yet</p>
        <h3>Add your first bus</h3>
        <p>Bus number, route, and stops are enough to get started.</p>
      </article>
    `;
    return;
  }

  list.innerHTML = buses
    .map((bus) => `
      <article class="result-card">
        <div class="result-top">
          <div>
            <p class="section-tag">${bus.busNumber}</p>
            <h3>${bus.route}</h3>
          </div>
          <span class="status-pill ${bus.status === "active" ? "online" : "offline"}">
            ${bus.status === "active" ? "Trip Active" : "Trip Ended"}
          </span>
        </div>
        <div class="owner-bus-actions">
          <button type="button" class="ghost-button" data-owner-action="start" data-bus-id="${bus.id}">Start Trip</button>
          <button type="button" class="ghost-button danger" data-owner-action="end" data-bus-id="${bus.id}">End Trip</button>
          <button type="button" class="ghost-button" data-owner-action="edit" data-bus-id="${bus.id}">Edit</button>
        </div>
        <p>${bus.stops.join(" | ")}</p>
        <span class="owner-meta">${bus.driverName ? `Driver: ${bus.driverName}` : "No driver name added"} | Current stop: ${bus.currentStop}</span>
      </article>
    `)
    .join("");
}

function updateBus(busId, updates) {
  const buses = getBuses();
  const nextBuses = buses.map((bus) => (bus.id === busId ? { ...bus, ...updates } : bus));
  saveBuses(nextBuses);
}

function fillOwnerForm(bus) {
  const form = document.getElementById("ownerBusForm");
  if (!form) return;
  form.elements.busId.value = bus.id;
  form.elements.busNumber.value = bus.busNumber;
  form.elements.route.value = bus.route;
  form.elements.stops.value = bus.stops.join(", ");
  form.elements.driverName.value = bus.driverName || "";
  form.elements.currentStop.value = bus.currentStop || "";
  form.elements.busNumber.focus();
}

function initOwnerDashboard() {
  const owner = requireAuth("owner");
  if (!owner) return;

  const welcome = document.getElementById("ownerWelcome");
  const form = document.getElementById("ownerBusForm");
  const formStatus = document.getElementById("ownerFormStatus");
  const list = document.getElementById("ownerBusList");

  if (welcome) {
    welcome.textContent = `${owner.name}, manage your buses in one screen.`;
  }

  renderOwnerBuses(owner);

  if (!form || !list) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const busId = form.elements.busId.value.trim();
    const busNumber = form.elements.busNumber.value.trim();
    const route = form.elements.route.value.trim();
    const stops = form.elements.stops.value
      .split(",")
      .map((stop) => stop.trim())
      .filter(Boolean);
    const driverName = form.elements.driverName.value.trim();
    const currentStop = form.elements.currentStop.value.trim() || stops[0] || "Route start";

    if (!busNumber || !route || !stops.length) {
      showToast("Bus number, route, and stops are required.", "error");
      return;
    }

    const buses = getBuses();
    if (busId) {
      const nextBuses = buses.map((bus) =>
        bus.id === busId
          ? { ...bus, busNumber, route, stops, driverName, currentStop }
          : bus
      );
      saveBuses(nextBuses);
      formStatus.textContent = "Bus updated.";
      showToast("Bus details updated.");
    } else {
      buses.unshift({
        id: makeId("bus"),
        ownerId: owner.id,
        busNumber,
        route,
        stops,
        driverName,
        currentStop,
        eta: "5 mins",
        status: "idle",
        nearby: false
      });
      saveBuses(buses);
      formStatus.textContent = "Bus added.";
      showToast("Bus added.");
    }

    form.reset();
    form.elements.busId.value = "";
    renderOwnerBuses(owner);
  });

  list.addEventListener("click", (event) => {
    const actionButton = event.target.closest("[data-owner-action]");
    if (!actionButton) return;

    const action = actionButton.dataset.ownerAction;
    const busId = actionButton.dataset.busId;
    const bus = getBuses().find((item) => item.id === busId);
    if (!bus) return;

    if (action === "start") {
      updateBus(busId, { status: "active", nearby: true });
      showToast(`${bus.busNumber} trip started.`);
    }

    if (action === "end") {
      updateBus(busId, { status: "idle", nearby: false });
      showToast(`${bus.busNumber} trip ended.`);
    }

    if (action === "edit") {
      fillOwnerForm(bus);
      formStatus.textContent = `Editing ${bus.busNumber}`;
      showToast(`Editing ${bus.busNumber}.`);
    }

    renderOwnerBuses(owner);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  ensureSeedData();
  initHeader();
  initLoginPage();
  initSignupPage();
  initPassengerHome();
  initOwnerDashboard();
});
