export function displayResults(shows, container, imageBaseUrlPoster) {
    container.innerHTML = ''; // Clear previous results

    if (!shows || shows.length === 0) {
        displayMessage("No se encontraron series.", null, container);
        return;
    }

    shows.forEach(show => {
        const showElement = document.createElement('div');
        showElement.classList.add('movie-item'); // Re-using the movie-item class for styling
        showElement.dataset.seriesId = show.id; // Store series ID

        const posterPath = show.poster_path ? `${imageBaseUrlPoster}${show.poster_path}` : 'https://via.placeholder.com/92x138?text=No+Poster'; // Placeholder for no poster
        const year = show.first_air_date ? new Date(show.first_air_date).getFullYear() : 'Fecha desconocida';
        const overview = show.overview ? show.overview.substring(0, 150) + (show.overview.length > 150 ? '...' : '') : 'Sin resumen disponible.';

        showElement.innerHTML = `
            <img src="${posterPath}" alt="${show.name} poster">
            <div class="movie-info">
                <h2>${show.name}</h2>
                <p>${year}</p>
                <p>${overview}</p>
            </div>
        `;
        container.appendChild(showElement);
    });
}

export function displayMessage(message, color = 'green', container) {
     // If message is empty, clear the container
    if (message === '') {
        container.innerHTML = '';
        return;
    }
    container.innerHTML = `<p style="color: ${color};">${message}</p>`;
}