// Google Apps Script Web App URL
const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzc16n3UxlBROhxToMYhdS-sC6AnLX9Wk5_8ymnchwbSUUT13oigk89A6EK9J1mY5NJGA/exec";

const form = document.getElementById("registrationForm");
const success = document.getElementById("successMessage");
const modal = document.getElementById("register-modal");
const selectedSportInput = document.getElementById("selectedSport");
const sportLabel = document.getElementById("registerSportLabel");
const nameLabel = document.getElementById("nameLabel");
const closeBtn = document.getElementById("closeModalBtn");
const cancelBtn = document.getElementById("cancelModalBtn");
const eventTypeInput = document.getElementById("eventType");
const teamHeader = document.getElementById("teamHeaderSection");
const individualHeader = document.getElementById("individualHeaderSection");
const playerSections = document.getElementById("playerSections");
const playerTemplate = document.getElementById("playerTemplate");
const teamCategorySelect = document.getElementById("teamCategory");
const individualCategorySelect = document.getElementById("category");

function setCategoryOptionsForSport(sportName) {
  const isCricket = sportName.toLowerCase() === "cricket";

  const applyOptions = (selectEl) => {
    if (!selectEl) return;
    const current = selectEl.value; // remember value
    selectEl.innerHTML = "";        // clear all options

    const optSelect = document.createElement("option");
    optSelect.value = "";
    optSelect.textContent = "Select";
    selectEl.appendChild(optSelect);

    const optBoys = document.createElement("option");
    optBoys.textContent = "Boys";
    optBoys.value = "Boys";
    selectEl.appendChild(optBoys);

    if (!isCricket) {
      const optGirls = document.createElement("option");
      optGirls.textContent = "Girls";
      optGirls.value = "Girls";
      selectEl.appendChild(optGirls);
    }

    // try to restore previous value if still valid
    if (current && (current === "Boys" || (!isCricket && current === "Girls"))) {
      selectEl.value = current;
    }
  };

  applyOptions(teamCategorySelect);
  applyOptions(individualCategorySelect);
}

function showStatusPopup(message, type = "success", duration = 2500) {
  const popup = document.getElementById("statusPopup");
  if (!popup) return;

  popup.textContent = message;
  popup.className = "status-popup"; // reset
  if (type === "success") {
    popup.classList.add("status-popup--success");
  } else if (type === "error") {
    popup.classList.add("status-popup--error");
  }

  popup.style.display = "block";

  setTimeout(() => {
    popup.style.display = "none";
  }, duration);
}

function buildPlayerSections(count) {
  playerSections.innerHTML = "";

  for (let i = 1; i <= count; i++) {
    const clone = playerTemplate.firstElementChild.cloneNode(true);
    clone.classList.add("collapsed");
    const toggleBtn = clone.querySelector(".player-toggle");
    toggleBtn.textContent = "Player " + i;

    toggleBtn.addEventListener("click", () => {
      clone.classList.toggle("collapsed");
    });

    playerSections.appendChild(clone);
  }

  updateRequiredFieldsForMode();
}

// Open modal when a sport card is clicked
document.querySelectorAll(".sport-card").forEach((card) => {
  card.addEventListener("click", () => {
    const sport = card.getAttribute("data-sport") || "Not specified";
    const type = card.getAttribute("data-type") || "individual";
    const playersAttr = card.getAttribute("data-players"); // may be null for individual

    selectedSportInput.value = sport;
    sportLabel.innerText = "Sports Name: " + sport.toUpperCase();

    eventTypeInput.value = type;

    setCategoryOptionsForSport(sport);

    if (type === "team") {
      teamHeader.style.display = "block";
      individualHeader.style.display = "none";
      playerSections.style.display = "block";

      // build players based on fixed count from card
      const count = playersAttr ? parseInt(playersAttr, 10) : 0;
      if (count > 0) {
        buildPlayerSections(count);
      } else {
        playerSections.innerHTML = "";
      }
    } else {
      // Individual event
      teamHeader.style.display = "none";
      individualHeader.style.display = "block";
      playerSections.style.display = "none";
      playerSections.innerHTML = "";
    }

    updateRequiredFieldsForMode();
    success.style.display = "none";
    modal.style.display = "flex";
  });
});

// Close modal helpers
function closeModal() {
  modal.style.display = "none";
}

closeBtn.addEventListener("click", closeModal);
cancelBtn.addEventListener("click", closeModal);
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

function updateRequiredFieldsForMode() {
  const type = eventTypeInput.value || "individual";

  // Individual fields
  const individualFields = [
    document.getElementById("name"),
    document.getElementById("category"),
    document.getElementById("roll"),
    document.getElementById("year"),
    document.getElementById("dept"),
    document.getElementById("phone"),
    document.getElementById("email"),
  ];

  // Team header fields
  const teamNameInput = document.getElementById("teamName");

  // All player fields
  const playerNameInputs   = document.getElementsByName("playerName[]");
  const playerRollInputs   = document.getElementsByName("playerRoll[]");
  const playerYearSelects  = document.getElementsByName("playerYear[]");
  const playerDeptSelects  = document.getElementsByName("playerDept[]");
  const playerPhoneInputs  = document.getElementsByName("playerPhone[]");
  const playerEmailInputs  = document.getElementsByName("playerEmail[]");

  if (type === "team") {
    // Disable individual top-level requireds
    individualFields.forEach((el) => el && el.removeAttribute("required"));

    // Enable team header requireds
    teamNameInput?.setAttribute("required", "required");
    teamCategorySelect?.setAttribute("required", "required");

    // Enable required on all player fields
    [
      ...playerNameInputs,
      ...playerRollInputs,
      ...playerYearSelects,
      ...playerDeptSelects,
      ...playerPhoneInputs,
      ...playerEmailInputs,
    ].forEach((el) => el && el.setAttribute("required", "required"));
  } else {
    // Individual mode
    individualFields.forEach((el) => el && el.setAttribute("required", "required"));

    // Disable team header requireds
    teamNameInput?.removeAttribute("required");
    teamCategorySelect?.removeAttribute("required");

    // Disable required on all player fields (none used in individual mode)
    [
      ...playerNameInputs,
      ...playerRollInputs,
      ...playerYearSelects,
      ...playerDeptSelects,
      ...playerPhoneInputs,
      ...playerEmailInputs,
    ].forEach((el) => el && el.removeAttribute("required"));
  }
}

// Submit handler
form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const formData = new FormData(form);
  formData.append("collegeName", "Purnea College of Engineering, Purnea");

  try {
    await fetch(SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      body: formData,
    });

    let sportName = selectedSportInput.value;
    if (!sportName) {
      sportName = formData.get("sports") || "UMANG – 2026";
    }

    // show success popup, then close form modal after a short delay
    showStatusPopup(
      `✅ Your registration for ${sportName.toUpperCase()} has been saved!`,
      "success",
      2500
    );

    form.reset();

    setTimeout(() => {
      modal.style.display = "none";
    }, 2500);
  } catch (err) {
    console.error(err);

    // show error popup, but keep form modal open
    showStatusPopup(
      "❌ Error while submitting. Please try again.",
      "error",
      2500
    );
  }
});

// ---------- COUNTDOWNS ----------
function createCountdown(elementId, targetDateStr, labelBefore, labelOnOrAfter) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const targetTime = new Date(targetDateStr).getTime();

  function update() {
    const now = Date.now();
    const diff = targetTime - now;

    if (diff > 0) {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      el.textContent =
        `${labelBefore} ${days}d ` +
        `${hours.toString().padStart(2, "0")}h ` +
        `${minutes.toString().padStart(2, "0")}m ` +
        `${seconds.toString().padStart(2, "0")}s`;
    } else {
      el.textContent = labelOnOrAfter;
      clearInterval(timer);
    }
  }

  update();
  const timer = setInterval(update, 1000);
}

// Event starts on 9 Jan 2026
createCountdown(
  "eventCountdown",
  "2026-01-09T00:00:00",
  "Event starts in:",
  "Event has started!"
);

// Registration opens on 2 Jan 2026
createCountdown(
  "registrationCountdown",
  "2026-01-02T00:00:00",
  "Registration opens in:",
  "Registration is OPEN!"
);