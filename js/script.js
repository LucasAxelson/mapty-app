'use strict';

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, lng]
    this.distance = distance; // in km
    this.duration = duration; // in minutes
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = `running`;

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription(); // Sets Workout description
  }

  calcPace() {
    // Calculated in min/Km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  type = `cycling`;

  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription(); // Sets Workout description
  }

  calcSpeed() {
    // Calculate in Km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

///////////////////////////////
// APPLICATION ARCHITECTURE
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const btnClear = document.querySelector(`.btn__clearAll`);
const btnPositive = document.querySelector(`.btn__clear--positive`);
const btnNegative = document.querySelector(`.btn__clear--negative`);
const alertMessage = document.querySelector(`.alert-message`);

class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];

  constructor() {
    // Constructor loads when the page loads.

    // Find user position
    this._getPosition();
    // Get data from local storage
    this._getLocalStorage();
    // Add new Workout. Bind the class App`s keyword `this`
    form.addEventListener(`submit`, this._newWorkout.bind(this));
    // Swap between the inputs Elevation & Candence
    inputType.addEventListener('change', this._toggleElevationField);
    // Moves map to the selected marker`s position
    containerWorkouts.addEventListener(`click`, this._moveToPopup.bind(this));
    // Deletes Workout
    const deleteBtn = document.querySelectorAll('.workout__delete');
    deleteBtn.forEach(btn =>
      btn.addEventListener(`click`, this._deleteWorkout)
    );
    // Deletes all Workouts
    btnClear.addEventListener(`click`, this.renderAlert.bind(this));
  }

  // Gets User's Position
  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert(`Could not get your position`);
        }
      );
  }

  // Loads map with Leaflet API
  _loadMap(position) {
    // Finds the coordinates
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

    // Seperates the coordinates
    const coords = [latitude, longitude];

    // Places the coordinates within the map
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    // Displays the map (via Leaflet API)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Handling clicks on map
    this.#map.on('click', this._showForm.bind(this));

    // Renders saved workout markers
    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }

  // Reveals form
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove(`hidden`);
    inputDistance.focus();
  }

  // Empty inputs + Hides form
  _hideForm() {
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value =
      '';
    form.style.display = `none`;
    form.classList.add(`hidden`);
    setTimeout(() => (form.style.display = `grid`), 1000);
  }

  // Swaps between the Elevation & Cadence inputs
  _toggleElevationField() {
    inputElevation.closest(`.form__row`).classList.toggle(`form__row--hidden`);
    inputCadence.closest(`.form__row`).classList.toggle(`form__row--hidden`);
  }

  // Main method - creates workout
  _newWorkout(e) {
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();

    // Retrieve data for workout array
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // If workout is running, create related object.
    if (type === `running`) {
      const cadence = +inputCadence.value;
      // Check if data is valid
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert(`Inputs must contain only positive numbers!`);

      workout = new Running([lat, lng], distance, duration, cadence);
    }
    // If workout is cycling, create related object.
    if (type === `cycling`) {
      const elevation = +inputElevation.value;
      // Check if data is valid
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert(`Inputs must contain only positive numbers!`);

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // Add related object to Workout array
    this.#workouts.push(workout);

    // Render workout on map as marker
    this._renderWorkoutMarker(workout);

    // Render workout on list
    this._renderWorkout(workout);

    // Hide form + Clear input fields
    this._hideForm();

    // Set local storage to all workouts
    this._setLocalStorage();
  }

  // Deletes Workout
  _deleteWorkout(e) {
    let target = e.target.parentNode;
    // this._renderAlert();

    // target = target.outerHTML
    console.log(target);
    console.log(localStorage.workouts);
    // Transform workout-li into one long string and save to variable.
    // Access localStorage - Data is saved in one large string.
    // Verify if localStorage string contains the workout-li string.
    // If so, delete the string from the localStorage.
    // If not, close alert message. (Guard clause)
    // Verify if modified data is being utilized upon reloading page.

    // workout = new Running([lat, lng], distance, duration, cadence);
  }

  renderAlert() {
    // Add alert message and remove the clear all button
    alertMessage.classList.add(`alert-message--active`);
    btnClear.style.display = `none`;
    // Add event listener to both buttons
    btnNegative.addEventListener(`click`, () => {
      alertMessage.classList.remove(`alert-message--active`);
      btnClear.style.display = `unset`;
    });
  }

  // Render Leaflet based map marker
  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }

  // Render workout using Template literals and HTML
  _renderWorkout(workout) {
    let html = `
          <li class="workout workout--${workout.type}" data-id="${workout.id}">
            <h2 class="workout__title">${workout.description}</h2>
            <button class="workout__delete">X</button>

            <div class="workout__details">
              <span class="workout__icon">${
                workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
              }</span>
              <span class="workout__value">${workout.distance}</span>
              <span class="workout__unit">km</span>
            </div>
            <div class="workout__details">
              <span class="workout__icon">⏱</span>
              <span class="workout__value">${workout.duration}</span>
              <span class="workout__unit">min</span>
            </div>
        `;

    if (workout.type === 'running')
      html += `
            <div class="workout__details">
              <span class="workout__icon">⚡️</span>
              <span class="workout__value">${workout.pace.toFixed(1)}</span>
              <span class="workout__unit">min/km</span>
            </div>
            <div class="workout__details">
              <span class="workout__icon">🦶🏼</span>
              <span class="workout__value">${workout.cadence}</span>
              <span class="workout__unit">spm</span>
            </div>
          </li>
          `;

    if (workout.type === 'cycling')
      html += `
            <div class="workout__details">
              <span class="workout__icon">⚡️</span>
              <span class="workout__value">${workout.speed.toFixed(1)}</span>
              <span class="workout__unit">km/h</span>
            </div>
            <div class="workout__details">
              <span class="workout__icon">⛰</span>
              <span class="workout__value">${workout.elevationGain}</span>
              <span class="workout__unit">m</span>
            </div>
          </li>
          `;

    form.insertAdjacentHTML('afterend', html);
  }

  // Drifts map over to the selected workout
  _moveToPopup(e) {
    const workoutEl = e.target.closest(`.workout`);

    if (!workoutEl) return;

    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _setLocalStorage() {
    localStorage.setItem(`workouts`, JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const localData = JSON.parse(localStorage.getItem(`workouts`));

    if (!localData) return;

    this.#workouts = localData;
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }

  _clearAll() {
    localStorage.removeItem(`workouts`);
    location.reload();
  }
}

const app = new App();
