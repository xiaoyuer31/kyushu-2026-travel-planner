const DATA_URL = "data/itinerary.json";

const state = {
  trip: null,
  activeDayIndex: 0,
  map: null,
  toastTimer: null,
};

const elements = {
  loading: document.querySelector("#loading-state"),
  content: document.querySelector("#content-shell"),
  error: document.querySelector("#error-state"),
  retry: document.querySelector("#retry-button"),
  dayNav: document.querySelector("#day-nav"),
  dayLabel: document.querySelector("#day-label"),
  dayTitle: document.querySelector("#day-title"),
  daySummary: document.querySelector("#day-summary"),
  dayFacts: document.querySelector("#day-facts"),
  itineraryList: document.querySelector("#itinerary-list"),
  mapCanvas: document.querySelector("#map-canvas"),
  routeList: document.querySelector("#route-list"),
  hotelCard: document.querySelector("#hotel-card"),
  toast: document.querySelector("#toast"),
};

function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderTripMeta(trip) {
  document.title = `${trip.name} · 旅行计划`;
  document.querySelector("#trip-name").textContent = trip.name;
  document.querySelector("#trip-kicker").textContent = trip.label;
  document.querySelector("#trip-season").textContent = trip.season;
  document.querySelector("#hero-eyebrow").textContent = trip.eyebrow;
  document.querySelector("#hero-title").innerHTML = escapeHTML(trip.heroTitle).replace("｜", "<br>");
  document.querySelector("#hero-meta").textContent = trip.heroMeta;
  document.querySelector("#footer-note").textContent = trip.footerNote;
}

function renderDayNav(days) {
  elements.dayNav.innerHTML = days
    .map(
      (day, index) => `
        <button
          class="day-tab"
          type="button"
          role="tab"
          id="day-tab-${index}"
          aria-controls="day-content"
          aria-selected="${index === state.activeDayIndex}"
          data-day-index="${index}"
        >
          <span class="day-tab-number">${escapeHTML(day.shortLabel)}</span>
          <span class="day-tab-date">${escapeHTML(day.dateLabel)}</span>
        </button>
      `,
    )
    .join("");

  elements.dayNav.querySelectorAll(".day-tab").forEach((button) => {
    button.addEventListener("click", () => selectDay(Number(button.dataset.dayIndex), true));
  });
}

function renderFacts(facts) {
  elements.dayFacts.innerHTML = facts
    .map((fact) => `<span class="fact-pill">${escapeHTML(fact)}</span>`)
    .join("");
}

function renderStops(stops) {
  elements.itineraryList.innerHTML = stops
    .map((stop, index) => {
      const timeAttribute = /^\d{2}:\d{2}$/.test(stop.time)
        ? ` datetime="${escapeHTML(stop.time)}"`
        : "";
      return `
        <article class="stop-card">
          <time class="stop-time"${timeAttribute}>${escapeHTML(stop.time)}</time>
          <div class="stop-body">
            <p class="stop-number">STOP ${String(index + 1).padStart(2, "0")}</p>
            <h3 class="place-name-cn">${escapeHTML(stop.names.zh)}</h3>
            <p class="place-name-ja" lang="ja">${escapeHTML(stop.names.ja)}</p>
            <p class="place-name-en" lang="en">${escapeHTML(stop.names.en)}</p>
            <p class="stop-note">${escapeHTML(stop.note)}</p>

            <div class="info-block">
              <span class="info-icon" aria-hidden="true">P</span>
              <div>
                <p class="info-label">
                  停车
                  <span class="parking-badge">${escapeHTML(stop.parking.status)}</span>
                </p>
                <p class="info-detail">${escapeHTML(stop.parking.detail)}</p>
              </div>
            </div>

            <div class="card-action-row">
              <button
                class="button copy-button"
                type="button"
                data-copy="${escapeHTML(stop.navigationName)}"
                aria-label="复制 ${escapeHTML(stop.navigationName)} 的导航名称"
              >
                <span class="button-icon" aria-hidden="true">⧉</span>
                复制导航名称
              </button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderMap(day, hotel) {
  if (state.map) {
    state.map.remove();
    state.map = null;
  }

  const hotelPoint = {
    ...hotel,
    time: "入住",
    type: "hotel",
  };
  const points = [...day.stops, hotelPoint].filter(
    (point) => Array.isArray(point.coordinates) && point.coordinates.every(Number.isFinite),
  );

  elements.routeList.innerHTML = points
    .map(
      (point, index) => `
        <li>
          <span class="route-list-number">${index + 1}</span>
          <strong>${escapeHTML(point.names.zh)}</strong>
          <span>${escapeHTML(point.time)}</span>
        </li>
      `,
    )
    .join("");

  elements.mapCanvas.setAttribute(
    "aria-label",
    `${day.shortLabel}：${points.map((point) => point.names.zh).join("至")}互动地图`,
  );

  if (!window.L || points.length === 0) {
    elements.mapCanvas.innerHTML = `<p class="map-error">互动地图暂时无法载入，请检查网络连接后重试。</p>`;
    return;
  }

  elements.mapCanvas.replaceChildren();

  try {
    state.map = window.L.map(elements.mapCanvas, {
      scrollWheelZoom: false,
      zoomControl: true,
    });

    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(state.map);

    const coordinates = points.map((point) => point.coordinates);
    window.L.polyline(coordinates, {
      color: "#ee6c35",
      opacity: 0.9,
      weight: 4,
      lineCap: "round",
      lineJoin: "round",
    }).addTo(state.map);

    points.forEach((point, index) => {
      const icon = window.L.divIcon({
        className: `route-leaflet-icon${point.type === "hotel" ? " is-hotel" : ""}`,
        html: `<span>${index + 1}</span>`,
        iconAnchor: [17, 17],
        iconSize: [34, 34],
        popupAnchor: [0, -18],
      });
      const popup = `
        <div class="map-popup">
          <strong>${escapeHTML(point.names.zh)}</strong>
          <span lang="ja">${escapeHTML(point.names.ja)}</span>
          <span lang="en">${escapeHTML(point.names.en)}</span>
        </div>
      `;
      window.L.marker(point.coordinates, { icon })
        .addTo(state.map)
        .bindPopup(popup);
    });

    window.L.control.scale({ imperial: false, position: "bottomleft" }).addTo(state.map);
    const bounds = window.L.latLngBounds(coordinates);
    state.map.fitBounds(bounds, { padding: [28, 28], maxZoom: 12 });
    window.requestAnimationFrame(() => state.map?.invalidateSize());
  } catch (error) {
    console.error("Unable to render map:", error);
    state.map?.remove();
    state.map = null;
    elements.mapCanvas.innerHTML = `<p class="map-error">互动地图暂时无法载入，请检查网络连接后重试。</p>`;
  }
}

function renderHotel(hotel, day) {
  elements.hotelCard.innerHTML = `
    <article class="hotel-card">
      <div class="hotel-accent"></div>
      <div class="hotel-body">
        <div class="hotel-title-row">
          <div>
            <h3 class="hotel-title">${escapeHTML(hotel.names.zh)}</h3>
            <p class="hotel-names">
              <span lang="ja">${escapeHTML(hotel.names.ja)}</span>
              ·
              <span lang="en">${escapeHTML(hotel.names.en)}</span>
            </p>
          </div>
          <span class="hotel-day-stamp">${escapeHTML(day.shortLabel)}</span>
        </div>

        <dl class="hotel-details">
          <div class="hotel-detail">
            <dt>入住时间</dt>
            <dd>${escapeHTML(hotel.checkIn)}</dd>
          </div>
          <div class="hotel-detail">
            <dt>地址</dt>
            <dd>${escapeHTML(hotel.address)}</dd>
          </div>
          <div class="hotel-detail">
            <dt>停车</dt>
            <dd>${escapeHTML(hotel.parking)}</dd>
          </div>
        </dl>

        <div class="hotel-actions">
          <button
            class="button button-primary copy-button"
            type="button"
            data-copy="${escapeHTML(hotel.navigationName)}"
            aria-label="复制酒店导航名称 ${escapeHTML(hotel.navigationName)}"
          >
            <span class="button-icon" aria-hidden="true">⧉</span>
            复制酒店导航名称
          </button>
          <button
            class="button copy-button"
            type="button"
            data-copy="${escapeHTML(hotel.address)}"
            aria-label="复制酒店地址"
          >
            复制地址
          </button>
        </div>
      </div>
    </article>
  `;
}

function getHotelForDay(day) {
  const hotel = day.hotelId ? state.trip.hotels?.[day.hotelId] : day.hotel;
  if (!hotel) {
    throw new Error(`Missing hotel data for ${day.shortLabel}`);
  }
  return hotel;
}

function selectDay(index, moveFocus = false) {
  state.activeDayIndex = index;
  const day = state.trip.days[index];
  const hotel = getHotelForDay(day);

  document.querySelectorAll(".day-tab").forEach((button, buttonIndex) => {
    button.setAttribute("aria-selected", buttonIndex === index ? "true" : "false");
  });

  elements.dayLabel.textContent = `${day.shortLabel} · ${day.dateLabel}`;
  elements.dayTitle.textContent = day.title;
  elements.daySummary.textContent = day.summary;
  renderFacts(day.facts);
  renderStops(day.stops);
  renderMap(day, hotel);
  renderHotel(hotel, day);
  bindCopyButtons();

  const url = new URL(window.location.href);
  url.searchParams.set("day", String(index + 1));
  window.history.replaceState({}, "", url);

  if (moveFocus) {
    document.querySelector("#day-content").scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(`已复制：${text}`);
  } catch {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    textArea.remove();
    showToast(`已复制：${text}`);
  }
}

function bindCopyButtons() {
  document.querySelectorAll(".copy-button").forEach((button) => {
    button.addEventListener("click", () => copyText(button.dataset.copy));
  });
}

function showToast(message) {
  window.clearTimeout(state.toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  state.toastTimer = window.setTimeout(() => {
    elements.toast.classList.remove("is-visible");
  }, 2200);
}

async function loadTrip() {
  elements.loading.hidden = false;
  elements.content.hidden = true;
  elements.error.hidden = true;

  try {
    const response = await fetch(DATA_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    state.trip = await response.json();
    const requestedDay = Number(new URLSearchParams(window.location.search).get("day"));
    state.activeDayIndex = Number.isInteger(requestedDay) && requestedDay > 0
      ? Math.min(requestedDay - 1, state.trip.days.length - 1)
      : 0;

    renderTripMeta(state.trip);
    renderDayNav(state.trip.days);
    elements.loading.hidden = true;
    elements.content.hidden = false;
    selectDay(state.activeDayIndex);
  } catch (error) {
    console.error("Unable to load itinerary:", error);
    elements.loading.hidden = true;
    elements.error.hidden = false;
  }
}

elements.retry.addEventListener("click", loadTrip);
loadTrip();
