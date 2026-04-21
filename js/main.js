// As always, we add our parts within a "load" event to make sure the HTML stuff has loaded first. 
window.addEventListener("load", () => {
    // Get references to the HTML elements that we need.
    const movieCardsDiv = document.getElementById("movieCards");
    const submitButton = document.getElementById("submit");
    const numberOfTicketsTextBox = document.getElementById("numberOfTickets");
    const userNameTextBox = document.getElementById("userName");
    


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

    // For each movie in the list, we create one card per movie and the show times that are available for that movie
    let firstCard = null;
    for (let i = 0; i < movies.length; i++) {
        const movie = movies[i];
        const card = document.createElement("div");

        const title = document.createElement("h3");
        title.innerText = movie.title;
        card.appendChild(title);

        const showtimesDiv = document.createElement("div");
        for (let j = 0; j < movie.movieTimes.length; j++) {
            const timeString = movie.movieTimes[j];
            const timeButton = document.createElement("button");

            timeButton.type = "button";
            timeButton.innerText = timeString;
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
        if (firstCard === null) firstCard = card;
    }

    // We select the first movie and its first showtime initially
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
