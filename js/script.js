'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

class Workout {
    date = new Date()
    id = (Date.now() + '').slice(-10)

    constructor(coords, distance, duration) {
        this.coords = coords // [lat, lng]
        this.distance = distance // in km
        this.duration = duration // in minutes
    }
}

class Running extends Workout {
    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration)
        this.cadence = cadence
        this.calcPace()
    }

    calcPace() {
        // Calculated in min/Km
        this.pace = this.duration / this.distance
        return this.pace
    }
}
class Cycling extends Workout {
    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration)
        this.elevationGain = elevationGain
        this.calcSpeed()
    }

    calcSpeed() {
        // Calculate in Km/h
        this.speed = this.distance / (this.duration / 60)
        return this.speed
    }
}

// const run1 = new Running([39, -12], 5.2, 24, 178)
// const cycling1 = new Cycling([39, -12], 27, 95, 523)
// console.log(run1)

///////////////////////////////
// APPLICATION ARCHITECTURE
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
    #map
    #mapEvent

    constructor() {
        // Constructor loads when the page loads. 
        // Execute methods within the constructor class.
        // Avoid executing class methods outside of class.

        // Find Position
        this._getPosition()
        // Add new Workout. Bind the class`s (App) keyword `this`
        form.addEventListener(`submit`, this._newWorkout.bind(this))
        // Swap between the inputs Elevation & Candence
        inputType.addEventListener('change', this._toggleElevationField)
    }

    _getPosition() {
        if (navigator.geolocation)
            navigator.geolocation.getCurrentPosition(
                this._loadMap.bind(this),
                function () {
                    alert(`Could not get your position`)
                }
            );
    }

    _loadMap(position) {
        // Locate the coordinates
        const { latitude } = position.coords
        const { longitude } = position.coords
        console.log(`https://www.google.com/maps/@${latitude},${longitude}`)

        // Seperates the coordinates
        const coords = [latitude, longitude]

        // Places the coordinates within the map
        this.#map = L.map('map').setView(coords, 13);

        // Displays the map (via Leaflet API)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);

        // Handling clicks on map
        this.#map.on('click', this._showForm.bind(this));
    }

    _showForm(mapE) {
        this.#mapEvent = mapE
        form.classList.remove(`hidden`)
        inputDistance.focus()
    }

    _toggleElevationField() {
        // Toggle between the Elevation & Cadence fields
        inputElevation
            .closest(`.form__row`)
            .classList.toggle(`form__row--hidden`)
        inputCadence
            .closest(`.form__row`)
            .classList.toggle(`form__row--hidden`)
    }

    _newWorkout(e) {
        const validInputs = (...inputs) =>
            inputs.every(inp =>
                Number.isFinite(inp))

        e.preventDefault()

        // Retrieve data from form
        const type = inputType.value
        const distance = +inputDistance.value
        const duration = +inputDuration.value

        // If workout is running, create related object.
        if (type === `running`) {
            const cadence = +inputCadence.value
            // Check if data is valid
            if (!validInputs(distance, duration, cadence)) {
                return alert(`Inputs must contain only positive numbers!`)
            }
        }
        // If workout is cycling, create related object.
        if (type === `cycling`) {
            // Check if data is valid
            const elevation = +inputElevation.value
        }

        // Add related object to Workout array

        // Render workout on map as marker
        const { lat, lng } = this.#mapEvent.latlng
        L.marker([lat, lng])
            .addTo(this.#map)
            .bindPopup(
                L.popup({
                    maxWidth: 250,
                    minWidth: 100,
                    autoClose: false,
                    closeOnClick: false,
                    className: 'running-popup',
                })
            )
            .setPopupContent(`Workout`)
            .openPopup()
    }

    // Render workout on list

    // Hide form & Clear input fields
    // inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = ''
}

const app = new App()

