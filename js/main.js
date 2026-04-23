// As always, we add our parts within a "load" event to make sure the HTML stuff has loaded first. 
window.addEventListener("load", () => {
    // Get references to the HTML elements that we need.
    const movieCardsDiv = document.getElementById("movieCards");
    // submit button to submit the movie choice
    const submitButton = document.getElementById("submit");
    // number of tickets text box to enter the number of tickets
    const numberOfTicketsTextBox = document.getElementById("numberOfTickets");
    // user name text box to enter the user name
    const userNameTextBox = document.getElementById("userName");
    // duration filter to filter the movies by duration
    const durationFilter = document.getElementById("durationFilter");
    // duration output to display the duration filter
    const durationOutput = document.getElementById("durationOutput");
    // genre filters element that contains the genre filters
    const genreFiltersDiv = document.getElementById("genreFilters");
    // start after input to filter the movies by start time
    
    // initialize
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

    // Changed showtime math to convert framework start times into start/end labels.
    function toMinutes(timeString) {
        const parts = timeString.split(":");
        const hoursString = parts[0];
        const minutesString = parts[1];
        // return the total minutes
        return Number(hoursString) * 60 + Number(minutesString);
    }

    // Changed display format to 12 hour AM/PM 
    function to12HourString(totalMinutes) {
        const hours24 = Math.floor((totalMinutes % 1440) / 60);
        const minutes = totalMinutes % 60;
        let period;
        let hours12;
        let minutesString;

        // determine if its AM or PM
        if (hours24 >= 12) {
            period = "PM";
        } else {
            period = "AM";
        }

        // determine the 12 hour format
        if (hours24 % 12 === 0) {
            hours12 = 12;
        } else {
            hours12 = hours24 % 12;
        }

        // determine the minutes string
        if (minutes < 10) {
            minutesString = "0" + minutes;
        } else {
            minutesString = String(minutes);
        }

        // return the 12 hour format
        const timeString = hours12 + ":" + minutesString + " " + period;
        return timeString;
    }

    // Changed labels to start end format
    function formatShowtimeRange(startTimeString, movieLengthMinutes) {
        const startMinutes = toMinutes(startTimeString);
        const endMinutes = startMinutes + movieLengthMinutes;
        const rangeString = to12HourString(startMinutes) + " to " + to12HourString(endMinutes);
        
        return rangeString;
    }

    // For each movie in the list, we create one card per movie and the show times that are available for that movie
    const cardList = [];
    for (let i = 0; i < movies.length; i++) {
        // We create a card for each movie, it contains the movie's title, description, showtimes, and genres
        const movie = movies[i];
        const card = document.createElement("div");
        const title = document.createElement("h3");
        title.innerText = movie.title;

        // Loop through the movie's genres and create a container for each genre
        for (let k = 0; k < movie.genres.length; k++) {
            const genreTag = document.createElement("span");
            genreTag.innerText = movie.genres[k];
            genreTag.classList.add("genre-tag");
            title.appendChild(genreTag);
        }
        card.appendChild(title);

        // We create a description block under the title, it mentions the movie's specific description and details
        const description = document.createElement("p");
        description.innerText = movie.description;
        card.appendChild(description);

        card.appendChild(document.createElement("hr"));

        // We create a runtime and actors block under the description, it mentions the movie's specific runtime and actors
        const runtimeAndActors = document.createElement("p");
        runtimeAndActors.innerText = movie.movieLength + " min, Actors:   " + movie.actors.join(", ");
        card.appendChild(runtimeAndActors);

        // We create a showtimes block under the description, it mentions the movie's specific showtime ranges, calculated by the duration and the start time
        const showtimesDiv = document.createElement("div");
        // Loop through the movie's showtimes and create a button for each showtime
        for (let j = 0; j < movie.movieTimes.length; j++) {
            const timeString = movie.movieTimes[j];
            const timeButton = document.createElement("button");

            timeButton.type = "button";
            // more readable format
            timeButton.innerText = formatShowtimeRange(timeString, movie.movieLength);
            // When the user clicks the showtime button, we select the movie and the showtime
            timeButton.addEventListener("click", (clickEvent) => {
                clickEvent.stopPropagation();
                selectMovie(movie, card);
                selectTime(timeString, timeButton);
            });
            showtimesDiv.appendChild(timeButton);
        }
        card.appendChild(showtimesDiv);

        // When the user clicks the movie card, we select the movie and the first showtime
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
            // if the genre is not already in the list, then we add it
            if (!allGenres.includes(movies[i].genres[k])) {
                allGenres.push(movies[i].genres[k]);
            }
        }
    }

    // Loop through the all genres and create a button for each genre
    for (let i = 0; i < allGenres.length; i++) {
        const genre = allGenres[i];
        const genreButton = document.createElement("button");

        // We create a button for each genre
        genreButton.type = "button";
        genreButton.innerText = genre;
        genreButton.classList.add("genre-filter-btn");
        // When the user clicks the genre button, we select the genre
        genreButton.addEventListener("click", () => {
            // If the genre is already selected, we deselect it
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

    // When the user changes the duration filter, we update the duration output and apply the filters
    durationFilter.addEventListener("input", () => {
        if (durationFilter.valueAsNumber < 240) {
            durationOutput.value = durationFilter.valueAsNumber + " min";
        } else {
            durationOutput.value = "Any";
        }
        // We apply the filters to the movie cards
        applyFilters();
    });

    // When the user changes the start range filter, we update the start range output and apply the filters
    startAfterInput.addEventListener("input", updateStartRange);
    startBeforeInput.addEventListener("input", updateStartRange);

    // When the user changes the start range filter, we update the range and apply the filters
    function updateStartRange() {
        startRangeOutput.value = to12HourString(startAfterInput.valueAsNumber) + " to " + to12HourString(startBeforeInput.valueAsNumber);
        applyFilters();
    }

    // apply all active filters to movie card visibility
    function applyFilters() {
        const maxMinutes = durationFilter.valueAsNumber;
        const startAfterMinutes = startAfterInput.valueAsNumber;
        const startBeforeMinutes = startBeforeInput.valueAsNumber;
        
        // loop through the movie cards and apply the filters
        for (let i = 0; i < cardList.length; i++) {
            const movie = cardList[i].movie;
            const passesRuntime = movie.movieLength <= maxMinutes;
            let passesGenre = false;

            if (selectedGenres.length === 0) {
                passesGenre = true;
            } else {
                // loop through the movie's genres and check if the genre is selected
                for (let g = 0; g < movie.genres.length; g++) {
                    if (selectedGenres.includes(movie.genres[g])) {
                        passesGenre = true;
                    }
                }
            }

            let passesStartTime = false;

            // loop through the movie's showtimes and check if the showtime is within the start range
            for (let t = 0; t < movie.movieTimes.length; t++) {
                const startMinutes = toMinutes(movie.movieTimes[t]);

                // If the showtime is within the start range, then it satisfies the start range filter
                if (startMinutes >= startAfterMinutes && startMinutes <= startBeforeMinutes) {
                    passesStartTime = true;
                }
            }

            // if the movie passes all filters, then we display the movie card
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

    // selection state helpers for movie card and showtime button
    function selectMovie(movie, card) {
        currentlySelectedMovie = movie;

        // If the movie card is already selected, we deselect it
        if (selectedCard) selectedCard.classList.remove("selected");
        selectedCard = card;
        card.classList.add("selected");
    }

    // When the user clicks the showtime button, we select the showtime
    function selectTime(timeString, timeButton) {
        currentlySelectedTime = timeString;
        
        // If the showtime button is already selected, we deselect it
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

        // submit button to flash green 
        submitButton.classList.add("submitted");
        window.setTimeout(() => {
            submitButton.classList.remove("submitted");
        }, 300);
    });
});
