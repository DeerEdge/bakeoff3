// As always, we add our parts within a "load" event to make sure the HTML stuff has loaded first. 
window.addEventListener("load", () => {
    // Get references to the HTML elements that we need.
    const movieCardsDiv = document.getElementById("movieCards");
    const submitButton = document.getElementById("submit");
    const numberOfTicketsTextBox = document.getElementById("numberOfTickets");
    const userNameTextBox = document.getElementById("userName");
    const durationFilter = document.getElementById("durationFilter");
    const durationOutput = document.getElementById("durationOutput");
    const genreFiltersDiv = document.getElementById("genreFilters");
    const startAfterInput = document.getElementById("startAfter");
    const startBeforeInput = document.getElementById("startBefore");
    const startRangeOutput = document.getElementById("startRangeOutput");
    


    const trial = new Trial("harrybotters");
    // getMovies is a function defined by the framework script. It will return a list of movies (in no guaranteed order). Each movie will be an object shaped like this:
    // {
    // 		title: string,
    // 		movieTimes: list of movie start times, represented as a 24-hour time string (https://developer.mozilla.org/en-US/docs/Web/HTML/Date_and_time_formats#time_strings) like "16:00",
    //  	movieLength: number (in minutes),
    // 		genres: list of strings,
    //  	description: string,
    //  	actors: list of strings
    // 	}
    const movies = trial.getMovies();
    let currentlySelectedMovie;
    let currentlySelectedTime;
    let selectedCard = null;
    let selectedTimeBtn = null;
    let selectedGenres = [];

    function toMinutes(timeString) {
        const parts = timeString.split(":");
        const hoursString = parts[0];
        const minutesString = parts[1];
        return Number(hoursString) * 60 + Number(minutesString);
    }

    function to12HourString(totalMinutes) {
        const hours24 = Math.floor((totalMinutes % 1440) / 60);
        const minutes = totalMinutes % 60;
        let period;
        let hours12;
        let minutesString;

        if (hours24 >= 12) {
            period = "PM";
        } else {
            period = "AM";
        }

        if (hours24 % 12 === 0) {
            hours12 = 12;
        } else {
            hours12 = hours24 % 12;
        }

        if (minutes < 10) {
            minutesString = "0" + minutes;
        } else {
            minutesString = String(minutes);
        }

        const timeString = hours12 + ":" + minutesString + " " + period;
        return timeString;
    }

    function formatShowtimeRange(startTimeString, movieLengthMinutes) {
        const startMinutes = toMinutes(startTimeString);
        const endMinutes = startMinutes + movieLengthMinutes;
        const rangeString = to12HourString(startMinutes) + " to " + to12HourString(endMinutes);
        
        return rangeString;
    }

    // For each movie in the list, we create one card per movie and the show times that are available for that movie
    const cardList = [];
    for (let i = 0; i < movies.length; i++) {
        const movie = movies[i];
        const card = document.createElement("div");

        const title = document.createElement("h3");
        title.innerText = movie.title;

        for (let k = 0; k < movie.genres.length; k++) {
            const genreTag = document.createElement("span");
            genreTag.innerText = movie.genres[k];
            genreTag.classList.add("genre-tag");
            title.appendChild(genreTag);
        }
        card.appendChild(title);

        const description = document.createElement("p");
        description.innerText = movie.description;
        card.appendChild(description);

        card.appendChild(document.createElement("hr"));

        const runtimeAndActors = document.createElement("p");
        runtimeAndActors.innerText = movie.movieLength + " min, Actors:   " + movie.actors.join(", ");
        card.appendChild(runtimeAndActors);

        const showtimesDiv = document.createElement("div");
        for (let j = 0; j < movie.movieTimes.length; j++) {
            const timeString = movie.movieTimes[j];
            const timeButton = document.createElement("button");

            timeButton.type = "button";
            timeButton.innerText = formatShowtimeRange(timeString, movie.movieLength);
            timeButton.addEventListener("click", (clickEvent) => {
                clickEvent.stopPropagation();
                selectMovie(movie, card);
                selectTime(timeString, timeButton);
            });
            showtimesDiv.appendChild(timeButton);
        }
        card.appendChild(showtimesDiv);

        card.addEventListener("click", () => {
            selectMovie(movie, card);
            selectTime(movie.movieTimes[0], card.querySelector("button"));
        });
        movieCardsDiv.appendChild(card);
        cardList.push({card: card, movie: movie});
    }

    // Form all genre lists and have filter buttons for each genre
    const allGenres = [];
    for (let i = 0; i < movies.length; i++) {
        for (let k = 0; k < movies[i].genres.length; k++) {
            if (!allGenres.includes(movies[i].genres[k])) {
                allGenres.push(movies[i].genres[k]);
            }
        }
    }

    for (let i = 0; i < allGenres.length; i++) {
        const genre = allGenres[i];
        const genreButton = document.createElement("button");

        genreButton.type = "button";
        genreButton.innerText = genre;
        genreButton.classList.add("genre-filter-btn");
        genreButton.addEventListener("click", () => {
            if (selectedGenres.includes(genre)) {
                selectedGenres.splice(selectedGenres.indexOf(genre), 1);
                genreButton.classList.remove("selected");
            } else {
                selectedGenres.push(genre);
                genreButton.classList.add("selected");
            }
            
            applyFilters();
        });
        genreFiltersDiv.appendChild(genreButton);
    }

    durationFilter.addEventListener("input", () => {
        if (durationFilter.valueAsNumber < 240) {
            durationOutput.value = durationFilter.valueAsNumber + " min";
        } else {
            durationOutput.value = "Any";
        }
        
        applyFilters();
    });

    startAfterInput.addEventListener("input", updateStartRange);
    startBeforeInput.addEventListener("input", updateStartRange);

    function updateStartRange() {
        startRangeOutput.value = to12HourString(startAfterInput.valueAsNumber) + " to " + to12HourString(startBeforeInput.valueAsNumber);
        applyFilters();
    }

    function applyFilters() {
        const maxMinutes = durationFilter.valueAsNumber;
        const startAfterMinutes = startAfterInput.valueAsNumber;
        const startBeforeMinutes = startBeforeInput.valueAsNumber;
        
        for (let i = 0; i < cardList.length; i++) {
            const movie = cardList[i].movie;

            const passesRuntime = movie.movieLength <= maxMinutes;

            let passesGenre = false;

            if (selectedGenres.length === 0) {
                passesGenre = true;
            } else {
                for (let g = 0; g < movie.genres.length; g++) {
                    if (selectedGenres.includes(movie.genres[g])) {
                        passesGenre = true;
                    }
                }
            }

            let passesStartTime = false;

            for (let t = 0; t < movie.movieTimes.length; t++) {
                const startMinutes = toMinutes(movie.movieTimes[t]);

                if (startMinutes >= startAfterMinutes && startMinutes <= startBeforeMinutes) {
                    passesStartTime = true;
                }
            }

            if (passesRuntime && passesGenre && passesStartTime) {
                cardList[i].card.style.display = "";
            } else {
                cardList[i].card.style.display = "none";
            }
        }
    }

    // We select the first movie and its first showtime initially
    firstCard = cardList[0].card;
    selectMovie(movies[0], firstCard);
    selectTime(movies[0].movieTimes[0], firstCard.querySelector("button"));

    function selectMovie(movie, card) {
        currentlySelectedMovie = movie;

        if (selectedCard) selectedCard.classList.remove("selected");
        selectedCard = card;
        card.classList.add("selected");
    }

    function selectTime(timeString, timeButton) {
        currentlySelectedTime = timeString;
        
        if (selectedTimeBtn) selectedTimeBtn.classList.remove("selected");
        selectedTimeBtn = timeButton;
        timeButton.classList.add("selected");
    }

    
    // When the user clicks the submit button, 
    submitButton.addEventListener("click", () => {
        // bundle up everything the Judge wants to see: the movie [a full movie object with all the metadata], the movieTime, the numberOfTickets (*as a number*), and the userName
        const userData = {
            movie: currentlySelectedMovie, // this should be the entire "movie" object, as described in lines 17-24 above
            movieTime: currentlySelectedTime, // a string
            numberOfTickets: numberOfTicketsTextBox.valueAsNumber, // a number
            userName: userNameTextBox.value // a string
        };
        // ...and submit it to the Judge. 
        // ===> Your code *must*, somewhere/somehow, call this: <===
        trial.submitMovieChoice(userData);
    });
});
