const $ = document;
const starElems = Array.from($.querySelectorAll(".four-pointed-star-wrapper"));
const birdEls = Array.from($.querySelectorAll(".birds"));
const starsPos = [];
const searchInput = $.querySelector("#search-input");
const inputPlaceHolder = $.querySelector(".input-placeholder");
const suggestionsCont = $.querySelector(".auto-completion-box");
let selectedCityOBJ = {};
const searchIcon = $.querySelector(".search-icon");
const searchBtn = $.querySelector(".search-icon-container");
const weatherDetailCont = $.querySelector(".weather-detail-container");
const locationTimeCont = $.querySelector(".location-time-container");
let isThemeDay = false;
let currentRotaionValue = 180;
const rootCSS = $.querySelector(":root");
// randomize stars size and position
const getRandomArbitrary = (min, max) => {
    return Math.random() * (max - min) + min;
};
// stars closeness checker
const checkCloseness = (starLeft, starTop, posesArray) => {
    let isStarCloseToAny = false;
    let topPos = null;
    let leftPos = null;
    let horizonAxesCheck = false;
    let verticalAxesCheck = false;
    for (const starPos of posesArray) {
        topPos = starPos.top;
        leftPos = starPos.left;
        horizonAxesCheck = starLeft < leftPos + 12 && starLeft > leftPos - 12;
        verticalAxesCheck = starTop < topPos + 12 && starTop > topPos - 12;
        if (horizonAxesCheck && verticalAxesCheck) {
            console.log("close");
            isStarCloseToAny = true;
            break;
        }
    }
    return isStarCloseToAny;
};
const applyElStyles = (starElem, fontSize, left, top) => {
    starElem.style.cssText = `
        font-size: ${fontSize}vw;
        top: ${top}%;
        left: ${left}%;
    `;
};
// horizen axes : 44% => 56.5%
// vertical axes : 6.3% => 33.7%
starElems.forEach((star) => {
    const fontSize = getRandomArbitrary(0.146412, 1.02489);
    let left = null;
    let top = null;
    do {
        left = getRandomArbitrary(1.5, 98.5);
        top = getRandomArbitrary(2, 64);
        if (left > 40.5 && left < 59.5) {
            do {
                top = getRandomArbitrary(2, 64);
            } while (top > 23.75 && top < 50.25);
        }
    } while (checkCloseness(left, top, starsPos));
    starsPos.push({ left, top });
    applyElStyles(star, fontSize, left, top);
});
console.log(starsPos);

// search input event
searchInput.addEventListener("focus", () => {
    inputPlaceHolder.classList.add("onfocus");
    if (searchInput.value) {
        suggestionsCont.classList.add("visible");
    }
});
searchInput.addEventListener("blur", (e) => {
    if (!e.target.value) {
        inputPlaceHolder.classList.remove("onfocus");
    }
});
$.body.addEventListener("click", (e) => {
    !e.target.classList.contains("auto-completion-box") &&
        e.target !== searchInput &&
        suggestionsCont.classList.remove("visible");
});
// finding geo base on city name
const createSuggestion = (value) => {
    const suggestionsArr = [];
    const city = value[0];
    if (city.local_names === undefined) {
        suggestionsArr.push({
            name: city.name,
        });
    } else {
        suggestionsArr.push(
            {
                name: city.name,
            },
            {
                name: city.local_names.fa || city.name,
            },
            {
                name: city.local_names.ja || city.name,
            },
            {
                name: city.local_names.de || city.name,
            },
            {
                name: city.local_names.hi || city.name,
            },
            {
                name: city.local_names.fr || city.name,
            }
        );
    }
    for (const suggestionOBJ of suggestionsArr) {
        suggestionOBJ.country = city.country;
        suggestionOBJ.lon = city.lon;
        suggestionOBJ.lat = city.lat;
        if (city.state) {
            suggestionOBJ.state =
                city.state.length <= 19
                    ? city.state
                    : city.state.slice(0, 19 - city.state.length) + "...";
        }
    }
    return suggestionsArr;
};
const createSuggestionsElems = (suggestionsArr) => {
    const fragElem = $.createElement("div");
    suggestionsArr.forEach((suggestion) => {
        if (suggestion.state) {
            fragElem.insertAdjacentHTML(
                "beforeend",
                `<div class="suggestion" data-lon="${suggestion.lon}" " data-lat="${suggestion.lat}">
                    <div class="city">${suggestion.name}</div>
                    -
                    <div class="state">${suggestion.state}</div>
                    -
                    <div class="country">${suggestion.country}</div>
                </div>`
            );
        } else {
            fragElem.insertAdjacentHTML(
                "beforeend",
                `<div class="suggestion" data-lon="${suggestion.lon}" data-lat="${suggestion.lat}">
                    <div class="city">${suggestion.name}</div>
                    -
                    <div class="country">${suggestion.country}</div>
                </div>`
            );
        }
    });
    return fragElem;
};
const createSelectedCityOBJ = (e) => {
    let suggestion = e.target.classList.contains("suggestion")
        ? e.target
        : e.target.parentElement;
    const name = suggestion.querySelector(".city").innerHTML;
    const country = suggestion.querySelector(".country").innerHTML;
    const lon = suggestion.dataset.lon;
    const lat = suggestion.dataset.lat;
    const state = suggestion.querySelector(".state")?.innerHTML;
    return {
        name,
        state: state || undefined,
        country,
        lon,
        lat,
    };
};
const suggestionClickHandler = (e) => {
    selectedCityOBJ = createSelectedCityOBJ(e);
    searchInput.value = selectedCityOBJ.name;
    suggestionsCont.classList.remove("visible");
    animateSearchButton(700);
    setTimeout(() => {
        setAnimation(searchIcon, "loadingSpin 2s ease infinite");
    }, 700);
    getWeatherByGeo(selectedCityOBJ.lat, selectedCityOBJ.lon);
};
const appendSuggestions = (suggestions) => {
    suggestionsCont.classList.add("visible");
    suggestionsCont.innerHTML = suggestions.innerHTML;

    Array.from($.querySelectorAll(".suggestion")).forEach((elem) => {
        elem.addEventListener("click", suggestionClickHandler);
    });
};
const showCityAutoComplete = (cityName) => {
    const geoRequest = new Request(
        `http://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=bdd00b675916ee3f6f2dcaa50c001f75`,
        {
            method: "GET",
        }
    );
    fetch(geoRequest)
        .then((response) => response.json())
        .then(createSuggestion)
        .then(createSuggestionsElems)
        .then(appendSuggestions)
        .catch((err) => console.log(err));
};
// showCityAutoComplete("tokyo");
let autoCompleteTime;
searchInput.addEventListener("keydown", () => {
    clearTimeout(autoCompleteTime);
    searchInput.value.length <= 1 &&
        suggestionsCont.classList.remove("visible");
    autoCompleteTime = setTimeout(() => {
        if (searchInput.value) {
            showCityAutoComplete(searchInput.value);
        }
    }, 500);
});
// get and showing current weather
const createNeededWeatherInfo = (value) => {
    return {
        cityName: selectedCityOBJ.name,
        state: selectedCityOBJ.state,
        country: value.sys.country,
        timezone: value.timezone,
        windSpeed: value.wind.speed,
        humadity: value.main.humidity,
        temp: value.main.temp,
        dataSource: value.base,
        visibility: (value.visibility / 1000).toFixed(1),
        pressure: value.main.pressure,
        weatherName:
            value.weather[0].description.length <= 17
                ? value.weather[0].description
                : value.weather[0].description.slice(
                      0,
                      17 - value.weather[0].description.length
                  ) + "...",
        weatherIconLink: `https://openweathermap.org/img/wn/${value.weather[0].icon}@4x.png`,
        isDay:
            value.weather[0].icon.slice(
                value.weather[0].icon.length - 1,
                value.weather[0].icon.length
            ) === "d"
                ? true
                : false,
        icon: value.weather[0].icon,
    };
};
const appendWeatherInfo = (weatherOBJ) => {
    weatherDetailCont.innerHTML = `
        <div class="top-section">
            <img
                src="${weatherOBJ.weatherIconLink}"
                alt="weather conditon"
                id="condition-img"
            />
            <div class="temp">${weatherOBJ.temp}&#176
                <div class="centigrade">c</div>
            </div>
        </div>
        <div class="bottom-section">
            <div class="detail-section">
                <div class="detail-cont">
                    <div class="value-cont">
                        <div class="value weather-description">${weatherOBJ.weatherName}</div>
                    </div>
                    <div class="title">desciption</div>
                </div>
                <div class="detail-cont">
                    <div class="value-cont">
                        <i class="fa-thin fa-wind icon"></i>
                        <span class="value">${weatherOBJ.windSpeed} m/s</span>
                    </div>
                    <div class="title">wind speed</div>
                </div>
            </div>
            <div class="detail-section">
                <div class="detail-cont">
                    <div class="value-cont">
                        <i class="fa-thin fa-tower-cell icon"></i>
                        <div class="value">${weatherOBJ.dataSource}</div>
                    </div>
                    <div class="title">Source</div>
                </div>
                <div class="detail-cont">
                    <div class="value-cont">
                        <i class="fa-thin fa-eye-low-vision icon"></i>
                        <div class="value">${weatherOBJ.visibility} k/m</div>
                    </div>
                    <div class="title">Vision</div>
                </div>
            </div>
            <div class="detail-section">
                <div class="detail-cont">
                    <div class="value-cont">
                        <i class="fa-thin fa-droplet-percent icon"></i>
                        <div class="value">${weatherOBJ.humadity}</div>
                    </div>
                    <span class="title">humadity</span>
                </div>
                <div class="detail-cont">
                    <div class="value-cont">
                        <i class="fa-thin fa-gauge icon"></i>
                        <div class="value">${weatherOBJ.pressure}</div>
                    </div>
                    <span class="title" >pressure</span>
                </div>
            </div>
        </div>
    `;
    return weatherOBJ;
};
const getCurrentTimeByTimezone = (timezone) => {
    const d = new Date();
    let hours = d.getUTCHours();
    let minutes = d.getUTCMinutes();
    const seconds = d.getUTCSeconds();
    for (let i = 1; i <= +timezone + seconds; i++) {
        if (i % 60 === 0) {
            minutes += 1;
        }
        if (minutes === 60) {
            hours += 1;
            minutes = 0;
            if (hours === 24) {
                hours = 0;
            }
        }
    }
    return {
        hours: hours < 10 ? "0" + hours : hours,
        minutes: minutes < 10 ? "0" + minutes : minutes,
    };
};
const appendTimeLocInfo = (weatherOBJ) => {
    const time = getCurrentTimeByTimezone(weatherOBJ.timezone);
    locationTimeCont.innerHTML = `
        <div class="location-wrapper">
            <div class="city">${weatherOBJ.cityName}</div>
            -
            <div class="country">${
                weatherOBJ.state && weatherOBJ.state.length <= 15
                    ? weatherOBJ.state
                    : weatherOBJ.country
            }</div>
        </div>
        <div class="time-wrapper">
            <div class="hour">${time.hours}</div>
            :
            <div class="minute">${time.minutes}</div>
        </div>
    `;
    return weatherOBJ;
};
const changeThemeOnTime = (weatherOBJ) => {
    const documentEl = $.documentElement.style;
    clearTimeout(rainTimeOut);
    clearInterval(snowInterval1);
    clearInterval(snowInterval2);
    clearInterval(snowInterval3);
    clearInterval(snowInterval4);
    clearTimeout(dropInterval1);
    clearTimeout(dropInterval2);
    clearTimeout(dropInterval3);
    clearTimeout(dropInterval4);
    rainTimeOut = setTimeout(() => {
        if (
            weatherOBJ.icon.slice(0, -1) === "09" ||
            weatherOBJ.icon.slice(0, -1) === "10"
        ) {
            dropInterval1 = setInterval(() => {
                rain(
                    0.951683,
                    0.951683,
                    "rainAnm",
                    1900,
                    fallingDrops1,
                    dropsArr1
                );
            }, 20);
            dropInterval2 = setInterval(() => {
                rain(
                    0.146412,
                    0.329428,
                    "rainAnm",
                    3800,
                    fallingDrops2,
                    dropsArr2
                );
            }, 20);
            dropInterval3 = setInterval(() => {
                rain(
                    0.256222,
                    0.4758418,
                    "rainAnm",
                    3300,
                    fallingDrops3,
                    dropsArr3
                );
            }, 20);
            dropInterval4 = setInterval(() => {
                rain(
                    0.951683,
                    0.951683,
                    "rainAnm",
                    1900,
                    fallingDrops4,
                    dropsArr4
                );
            }, 20);
        } else if (weatherOBJ.icon.slice(0, -1) === "13") {
            snowInterval1 = setInterval(() => {
                rain(
                    0.366032,
                    1.244509,
                    "snowAnm",
                    8700,
                    fallingSnows1,
                    snowsArr1
                );
            }, 100);
            snowInterval2 = setInterval(() => {
                rain(
                    0.109809,
                    0.329428,
                    "snowAnm",
                    15000,
                    fallingSnows2,
                    snowsArr2
                );
            }, 100);
            snowInterval3 = setInterval(() => {
                rain(
                    0.2196193,
                    0.475841,
                    "snowAnm",
                    13000,
                    fallingSnows3,
                    snowsArr3
                );
            }, 100);
            snowInterval4 = setInterval(() => {
                rain(
                    0.366032,
                    1.244509,
                    "snowAnm",
                    8700,
                    fallingSnows4,
                    snowsArr4
                );
            }, 100);
        }
    }, 3300);
    console.log(weatherOBJ.isDay);
    if (weatherOBJ.isDay) {
        if (!isThemeDay) {
            currentRotaionValue += 180;
            isThemeDay = true;
            documentEl.setProperty("--main-background-color", "#65b8ff");
            documentEl.setProperty("--second-background-color", "#ceeaf0");
            documentEl.setProperty(
                "--second-background-color-lighten",
                "#e9f6f8"
            );
            documentEl.setProperty(
                "--sun-moon-rotation",
                `${currentRotaionValue}deg`
            );
            starElems.forEach((star) =>
                setAnimation(star, " toDownAnm .8s ease-out forwards")
            );
            birdEls.forEach((bird) => {
                console.log(getComputedStyle(bird).transform);
                bird.style.display = "block";
                getComputedStyle(bird).transform === "none"
                    ? setAnimation(bird, " toUpAnm .8s 2.5s ease-out backwards")
                    : setAnimation(
                          bird,
                          " toUpAnmWithFlip .8s 2.5s ease-out backwards"
                      );
            });
        }
    } else {
        if (isThemeDay) {
            isThemeDay = false;
            currentRotaionValue += 180;
            documentEl.setProperty("--main-background-color", "#040020");
            documentEl.setProperty("--second-background-color", "#c0bfcd");
            documentEl.setProperty(
                "--second-background-color-lighten",
                "#d4d3dd"
            );
            documentEl.setProperty(
                "--sun-moon-rotation",
                `${currentRotaionValue}deg`
            );
            starElems.forEach((star) =>
                setAnimation(star, " toUpAnm .8s 2.4s ease backwards")
            );
            birdEls.forEach((bird) => {
                setAnimation(bird, " toDownAnm .8s ease-out forwards");
            });
        }
    }
};
const getWeatherByGeo = (lat, lon) => {
    const request = new Request(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=4bbef89b1ae24f314c5c42233331cb63&units=metric`,
        { method: "GET" }
    );
    fetch(request)
        .then((response) => response.json())
        .then(createNeededWeatherInfo)
        .then(appendWeatherInfo)
        .then(appendTimeLocInfo)
        .then((weatherOBJ) => {
            setTimeout(() => {
                makeSearchButtonReady(700);
            }, 1000);
            return weatherOBJ;
        })
        .then(changeThemeOnTime)
        .catch((err) => console.log(err));
};
// search control and show
const setAnimation = (element, animationValue) => {
    element.style.animation = animationValue;
};
const changeClass = (from, to) => {
    searchIcon.classList.remove(from);
    searchIcon.classList.add(to);
};
const makeSearchButtonReady = (time) => {
    animateSearchButton(time);
    setTimeout(() => {
        searchBtn.addEventListener("click", searchBtnOnClick);
        searchIcon.style = null;
    }, time + 50);
};
const animateSearchButton = (time) => {
    searchBtn.removeEventListener("click", searchBtnOnClick);
    setAnimation(searchIcon, `searchIconAnm ${time}ms ease`);
    setTimeout(() => {
        searchIcon.classList.contains("fa-magnifying-glass")
            ? changeClass("fa-magnifying-glass", "fa-moon-over-sun")
            : changeClass("fa-moon-over-sun", "fa-magnifying-glass");
    }, time / 2);
};
// search weather data fetch
const getWeatherByName = (name) => {
    clearTimeout(autoCompleteTime);
    animateSearchButton(700);
    setTimeout(() => {
        setAnimation(searchIcon, "loadingSpin 2s ease infinite");
    }, 700);
    const geoRequest = new Request(
        `http://api.openweathermap.org/geo/1.0/direct?q=${
            name || searchInput.value
        }&limit=1&appid=bdd00b675916ee3f6f2dcaa50c001f75`,
        {
            method: "GET",
        }
    );
    fetch(geoRequest)
        .then((response) => response.json())
        .then((value) => {
            selectedCityOBJ = {
                name: value[0].name,
                state: value[0].state || undefined,
                country: value[0].country,
                lon: value[0].lon,
                lat: value[0].lat,
            };
            return selectedCityOBJ;
        })
        .then((selectedCityOBJ) => {
            getWeatherByGeo(selectedCityOBJ.lat, selectedCityOBJ.lon);
        });
};
const searchBtnOnClick = () => {
    if (searchInput.value) {
        getWeatherByName();
    }
};
searchBtn.addEventListener("click", searchBtnOnClick);

// ip geo location
// fetch url https://api.geoapify.com/v1/ipinfo?apiKey=24e8f20635f34d19b16564437faf726d
// location: {
//     "latitude": 36.1875,
//     "longitude": 50.0649
// }
const getWeatherByIp = () => {
    const ipRequest = new Request(
        "https://api.ipgeolocation.io/ipgeo?apiKey=47db7c9c8ffc4578855d52b5ac5ed09a"
    );
    fetch(ipRequest)
        .then((response) => response.json())
        .then((value) => {
            getWeatherByName(value.city);
        })
        .catch((err) => console.log(err));
};

window.addEventListener("load", getWeatherByIp);
window.addEventListener("load", () => {
    const loadingScrEl = $.querySelector(".loading-screen");
    loadingScrEl.style.opacity = "0";
    setTimeout(() => {
        loadingScrEl.style.display = "none";
    }, 600);
});

// raining handlers
let rainTimeOut = null;
const snowsArr1 = Array.from($.querySelectorAll(".snow-cloud-1"));
const snowsArr2 = Array.from($.querySelectorAll(".snow-cloud-2"));
const snowsArr3 = Array.from($.querySelectorAll(".snow-cloud-3"));
const snowsArr4 = Array.from($.querySelectorAll(".snow-cloud-4"));
const fallingSnows1 = new Set();
const fallingSnows2 = new Set();
const fallingSnows3 = new Set();
const fallingSnows4 = new Set();
let snowInterval1 = null;
let snowInterval2 = null;
let snowInterval3 = null;
let snowInterval4 = null;
const dropsArr1 = Array.from($.querySelectorAll(".drop-cloud-1"));
const dropsArr2 = Array.from($.querySelectorAll(".drop-cloud-2"));
const dropsArr3 = Array.from($.querySelectorAll(".drop-cloud-3"));
const dropsArr4 = Array.from($.querySelectorAll(".drop-cloud-4"));
const fallingDrops1 = new Set();
const fallingDrops2 = new Set();
const fallingDrops3 = new Set();
const fallingDrops4 = new Set();
let dropInterval1 = null;
let dropInterval2 = null;
let dropInterval3 = null;
let dropInterval4 = null;
const rain = (
    minFont,
    maxFont,
    animName,
    animDuration,
    capacityArr,
    rainEls
) => {
    const leftPos = getRandomArbitrary(5, 95);
    const fontSize = getRandomArbitrary(minFont, maxFont);
    let elIndex = "";
    let currentRainEl = "";
    let condition = true;
    do {
        elIndex = Math.floor(getRandomArbitrary(0, rainEls.length));
        currentRainEl = rainEls[elIndex];
        if (!capacityArr.has(currentRainEl)) {
            condition = false;
            capacityArr.add(currentRainEl);
            currentRainEl.style.cssText = `
                font-size: ${fontSize}vw;
                left: ${leftPos}%;
            `;
            setAnimation(
                currentRainEl,
                ` ${animName} ${animDuration}ms ease forwards`
            );
            setTimeout(() => {
                console.log(capacityArr.size);
                capacityArr.delete(currentRainEl);
                setAnimation(currentRainEl, null);
            }, animDuration);
        }
    } while (condition);
};
