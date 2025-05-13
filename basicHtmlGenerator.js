export function generateBasicHtml(seriesData, seasonsData, tvGenres, IMAGE_BASE_URL_POSTER, IMAGE_BASE_URL_STILL, IMAGE_BASE_URL_BACKDROP) {
    const year = seriesData.first_air_date ? new Date(seriesData.first_air_date).getFullYear() : 'Año desconocido';
    const numberOfSeasonsTotal = seriesData.number_of_seasons || (seasonsData.length > 0 ? seasonsData.length : 0); // Use fetched seasons count if series data is 0
    const voteAverage = seriesData.vote_average ? seriesData.vote_average.toFixed(1) : 'N/A';
    const title = seriesData.name || 'Título desconocido';
    const synopsis = seriesData.overview || 'Sin resumen disponible.';
    const genres = seriesData.genres && seriesData.genres.length > 0
        ? seriesData.genres.map(genre => tvGenres[genre.id] || genre.name).join(', ')
        : 'Género desconocido';
    const backdropPath = seriesData.backdrop_path ? `${IMAGE_BASE_URL_BACKDROP}${seriesData.backdrop_path}` : '';
    // Use w300 for the main poster in the header
    const posterPathMain = seriesData.poster_path ? `${IMAGE_BASE_URL_POSTER.replace('w185', 'w300')}${seriesData.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Poster';

    let seasonSelectOptionsHtml = '';
    let seasonCapitulosDivsHtml = '';
    let firstSeasonId = ''; // To set the initially visible season


    // Sort seasons by number
    seasonsData.sort((a, b) => a.season_number - b.season_number);

    seasonsData.forEach((season, index) => {
        // Ensure season and episodes exist and the season number is greater than 0
        if (!season || !season.episodes || season.episodes.length === 0 || season.season_number === 0) {
            return; // Skip seasons with no episodes or special season 0
        }

        const seasonId = `capitulos-temporada${season.season_number}`;
        if (firstSeasonId === '' && season.episodes.length > 0) {
            firstSeasonId = seasonId; // Mark the first valid season with episodes
        }
        // Use "Temporada X" if generic name, otherwise use the provided name
        const seasonName = season.name && season.name !== `Season ${season.season_number}` ? season.name : `Temporada ${season.season_number}`;

        seasonSelectOptionsHtml += `<option value="${seasonId}">${seasonName}</option>`;

        let episodeLinksHtml = '';
        season.episodes.forEach(episode => {
            // Use episode still, or fallback to backdrop/poster, or placeholder
            const episodeImagePath = episode.still_path
                ? `${IMAGE_BASE_URL_STILL}${episode.still_path}`
                : (seriesData.backdrop_path ? `${IMAGE_BASE_URL_STILL.replace('w300', 'w185')}${seriesData.backdrop_path}` : posterPathMain.replace('w300', 'w185')); // Fallback, use smaller image if possible


            // Duration is not reliably available via the season endpoint. Omitting or using a placeholder.
            const episodeDuration = episode.runtime ? `${episode.runtime}m` : 'N/A'; // Check for runtime on episode (might not be there)

            // Generate link HTML matching the requested format, adding data attributes for embeds
            episodeLinksHtml += `
                <a href="#" class="capitulo"
                   data-season-number="${episode.season_number}"
                   data-episode-number="${episode.episode_number}"
                   data-episode-name="${episode.name}"
                   data-iframe-es="#" data-iframe-subes="#" > <!-- Add embed URLs here -->
                    <div class="imagen">
                        <img src="${episodeImagePath}" alt="Capítulo ${episode.episode_number} - ${episode.name}" loading="lazy">
                        <div class="duracion">${episodeDuration}</div>
                        <div class="titulo">${episode.episode_number}. ${episode.name || 'Sin Título'}</div>
                        <div class="play-icon">
                             <span class="iconify" data-icon="mdi:play-circle-outline"></span>
                        </div>
                    </div>
                </a>
            `;
        });

        // Initially hide all season divs, JS will show the first one
        // Wrap the episode list in a new scrollable container
        seasonCapitulosDivsHtml += `
            <div class="season-episodes-container" id="${seasonId}" style="display: none;">
                <div class="capitulos"> <!-- This div will now be flex -->
                    ${episodeLinksHtml}
                </div>
            </div>
        `;
    });

    // If no seasons with episodes were generated
    if (seasonSelectOptionsHtml === '' || seasonsData.filter(s => s.episodes && s.episodes.length > 0).length === 0) {
        seasonSelectOptionsHtml = '<option value="">No hay temporadas disponibles</option>';
        seasonCapitulosDivsHtml = `
            <div class="season-episodes-container" id="no-seasons" style="display: block;">
                 <p style="color: #e0e0e0; padding: 20px; text-align: center; width: 100%;">No se encontraron temporadas con episodios para generar.</p>
            </div>
         `;
        firstSeasonId = 'no-seasons'; // Set initial display to the message
    }


    // Construct the full HTML string based on the user's provided template and enhanced CSS
    const generatedHtml = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Detalles de la Serie</title>
    <!-- Iconify for icons -->
    <script src="https://code.iconify.design/2/2.2.1/iconify.min.js" defer></script>
    <style>
        :root {
          --primary-color: #ffae00; /* Gold-like */
          --background-color: #1a1a1a; /* Dark background */
          --text-color: #e0e0e0; /* Light gray text */
          --card-bg: #282828; /* Slightly lighter dark for cards */
          --border-color: #444; /* Darker gray border */
          --highlight-color: #FFD700; /* True Gold for highlights */
          --hover-scale: 1.03; /* Slightly less pronounced hover effect */
        }

        /* Estilos generales */
        body {
            font-family: 'Arial', sans-serif;
            color: var(--text-color);
            background-color: var(--background-color);
            margin: 0;
            padding: 0;
            line-height: 1.6;
        }

        /* Estilos del encabezado */
        .post-header {
            position: relative;
            padding: 40px 20px; /* Adjusted padding for mobile */
            background: linear-gradient(to bottom, rgba(0, 0, 0, 0.9) 10%, rgba(0, 0, 0, 0.7) 50%, rgba(0, 0, 0, 0.9) 100% )${backdropPath ? `, url('${backdropPath}') no-repeat center/cover` : ''};
            background-size: cover;
            background-position: center;
            min-height: 300px; /* Reduced minimum height */
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
        }

        .post-header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
             /* Background gradient already added to .post-header itself */
             /* filter: blur(5px); /* Apply blur to background if needed */
            z-index: 0;
        }

        .post-header__content {
            max-width: 900px; /* Increased max width */
            width: 100%;
            margin: 0 auto;
            z-index: 1; /* Ensure content is above background effect */
            position: relative;
        }

        .poster-img {
            max-width: 180px; /* Slightly smaller poster */
            width: 100%; /* Make it responsive */
            height: auto;
            border-radius: 8px;
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.6);
            margin-bottom: 20px;
            display: block; /* Center image using margin */
            margin-left: auto;
            margin-right: auto;
            animation: fadeIn 0.8s ease-out forwards;
        }
         @keyframes fadeIn {
             from { opacity: 0; transform: translateY(20px); }
             to { opacity: 1; transform: translateY(0); }
         }


        #favoritoBtn {
            font-weight: bold;
            color: var(--text-color);
            font-size: 1rem; /* Adjusted font size */
            background: var(--card-bg);
            padding: 10px 20px;
            border: 1px solid var(--border-color); /* Solid border */
            border-radius: 6px;
            cursor: pointer;
            transition: background 0.3s ease, border-color 0.3s ease, transform 0.2s;
            margin-top: 15px; /* Space above button */
            touch-action: manipulation; /* Improve responsiveness on touch devices */
            display: inline-block; /* Ensure button behaves correctly */
        }

        #favoritoBtn:hover {
            background: var(--highlight-color); /* Gold color */
             border-color: var(--highlight-color);
             color: #111; /* Dark text on gold */
        }

        #favoritoBtn:active {
             transform: scale(0.96); /* Add pressed effect */
        }


        .post-header__info h1 {
            font-size: 2.5rem; /* Larger title */
            margin-bottom: 10px;
            text-shadow: 2px 2px 6px rgba(0,0,0,0.8); /* More pronounced shadow */
            color: #fff; /* Ensure title is white */
        }

        .post-header__info ul {
            list-style: none;
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-bottom: 20px;
            padding: 0;
            flex-wrap: wrap; /* Allow items to wrap on small screens */
        }

        .post-header__info li {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 0.95rem;
             color: var(--text-color);
        }

         .post-header__info li .iconify { /* Use iconify class */
             color: var(--highlight-color); /* Gold color for icons */
             font-size: 1.1em;
         }


        .post-header__info .resume {
            font-size: 1rem; /* Standard font size */
            line-height: 1.6;
            margin-bottom: 20px;
            max-height: 100px; /* Limit synopsis height for cleaner look */
            overflow: hidden; /* Hide overflow text */
            text-overflow: ellipsis; /* Add ellipsis */
            display: -webkit-box;
            -webkit-line-clamp: 4; /* Limit to 4 lines */
            -webkit-box-orient: vertical;
            color: #ccc; /* Slightly lighter gray for synopsis */
        }

        .more-data {
            font-size: 0.9rem;
             margin-top: 10px;
             color: #aaa; /* Even lighter gray */
        }
         .more-data p {
             margin: 5px 0; /* Add some vertical space */
         }


        /* Estilos de las temporadas */
        .seasons-selector {
            margin: 20px auto; /* Center the selector section */
            text-align: center;
            padding: 0 20px; /* Add horizontal padding */
        }

        .seasons-selector label {
             display: block; /* Label on its own line */
             margin-bottom: 8px;
             font-weight: bold;
             color: var(--text-color);
        }

        .seasons-selector select {
            padding: 10px;
            font-size: 1rem; /* Adjusted font size */
            border-radius: 5px;
            background-color: var(--card-bg);
            color: var(--text-color);
            border: 1px solid var(--border-color);
            cursor: pointer;
            width: 100%; /* Full width on small screens */
            max-width: 300px; /* Max width on larger screens */
            box-sizing: border-box; /* Include padding/border in width */
             appearance: none; /* Remove default dropdown arrow */
             background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23e0e0e0%22%20d%3D%22M287%2C197.9L159.5%2C68.2c-4.7-4.7-12.4-4.7-17.1%2C0L5.4%2C197.9c-4.7%2C4.7-4.7%2C12.4%2C0%2C17.1s12.4%2C4.7%2C17.1%2C0l129.1-129l129.1%2C129C274.5%2C219.3%2C282.3%2C219.3%2C287%2C214.6C291.7%2C209.9%2C291.7%2C202.6%2C287%2C197.9z%22%2F%3E%3C%2Fsvg%3E');
             background-repeat: no-repeat;
             background-position: right 10px top 50%;
             background-size: 12px auto;
        }

        .seasons-selector select:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 5px rgba(255, 174, 0, 0.5); /* Primary color glow */
        }

        /* Estilos de los episodios */
        .contenedor-capitulos { /* Renamed from contenedor-scroll to match user's ID */
            padding: 0 20px 20px; /* Add horizontal padding */
            max-width: 1200px; /* Limit max width for grid */
            margin: 0 auto; /* Center the grid */
        }

         .season-episodes-container {
            display: none; /* Initially hidden, controlled by JS */
         }

        .capitulos { /* This div will now be flex for horizontal scroll */
            display: flex;
            gap: 15px; /* Slightly smaller gap */
            padding-top: 10px; /* Add padding above grid */
            overflow-x: auto; /* Enable horizontal scrolling */
            white-space: nowrap; /* Prevent items from wrapping */
            scrollbar-width: none; /* Hide scrollbar for Firefox */
             -ms-overflow-style: none;  /* Hide scrollbar for IE and Edge */
             padding-bottom: 10px; /* Add padding for scrollbar space */
        }

         .capitulos::-webkit-scrollbar {
             display: none; /* Hide scrollbar for Chrome, Safari, Opera */
         }


        .capitulo { /* Episode item */
            position: relative;
            overflow: hidden;
            border-radius: 8px; /* Slightly smaller border radius */
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4); /* More subtle shadow */
            transition: transform 0.2s ease, box-shadow 0.2s ease; /* Faster transition */
            text-decoration: none;
            color: var(--text-color);
            background-color: var(--card-bg); /* Card background */
            display: block; /* Ensure link behaves like a block */
            flex-shrink: 0; /* Prevent items from shrinking */
            width: 180px; /* Fixed width for horizontal list */
        }

        .capitulo:hover {
            transform: translateY(-5px) scale(var(--hover-scale)); /* Lift and slight scale */
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.6); /* More pronounced shadow on hover */
        }

        .imagen img {
            width: 100%;
            height: 120px; /* Fixed height for episode image */
            object-fit: cover; /* Ensure image covers area */
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
            display: block; /* Remove extra space below image */
        }

        .duracion {
            position: absolute;
            top: 8px; /* Slightly less padding */
            right: 8px;
            background: rgba(0, 0, 0, 0.6); /* Slightly less opaque background */
            padding: 3px 6px; /* Smaller padding */
            border-radius: 4px;
            font-size: 0.8rem; /* Smaller font size */
            color: #fff;
        }

        .titulo {
            position: static; /* Make title part of flow, not absolute */
            padding: 8px 10px; /* Padding inside the card */
            font-size: 0.9rem; /* Adjusted font size */
            font-weight: bold;
            line-height: 1.4;
            background: none; /* No background */
             margin: 0; /* Reset margin */
             white-space: normal; /* Allow wrapping */
             overflow: hidden;
             text-overflow: ellipsis;
             display: -webkit-box;
             -webkit-line-clamp: 2; /* Limit title to 2 lines */
             -webkit-box-orient: vertical;
             min-height: 2.8em; /* Ensure consistent height */
             color: var(--text-color);
        }

        .play-icon {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, calc(-50% - 20px)); /* Adjust position to center on image */
            font-size: 3em; /* Larger icon */
            color: rgba(255, 255, 255, 0.9); /* White with slight opacity */
            opacity: 0;
            transition: opacity 0.3s ease;
            z-index: 2; /* Ensure icon is above image */
        }

        .capitulo:hover .play-icon {
            opacity: 1;
        }

         .play-icon .iconify {
             display: block; /* Ensure iconify behaves correctly */
         }


        /* Diseño responsive */
        @media (max-width: 768px) {
            .post-header {
                padding: 30px 15px; /* Adjust padding */
                min-height: 250px;
            }

            .post-header__info h1 {
                font-size: 2rem; /* Smaller title */
            }

            .poster-img {
                max-width: 140px; /* Smaller poster */
            }

            .post-header__info ul {
                gap: 10px; /* Reduce gap in list */
            }

             .post-header__info li {
                font-size: 0.9rem;
             }

            .post-header__info .resume {
                font-size: 0.9rem;
                max-height: 80px; /* Adjust synopsis height */
                -webkit-line-clamp: 3; /* Adjust line clamp */
            }

            #favoritoBtn {
                font-size: 0.9rem;
                padding: 8px 15px;
            }

             .seasons-selector {
                padding: 0 15px;
             }

             .seasons-selector select {
                font-size: 0.9rem;
             }

            .contenedor-capitulos {
                padding: 0 15px 15px;
            }

            .capitulo { /* Smaller fixed width for mobile */
                 width: 150px;
             }

             .imagen img {
                height: 100px; /* Adjust image height */
             }

            .titulo {
                font-size: 0.85rem;
                padding: 6px 8px;
                min-height: 2.6em; /* Adjust min height */
            }

             .duracion {
                font-size: 0.7rem;
             }

             .play-icon {
                font-size: 2.5em; /* Smaller icon */
                transform: translate(-50%, calc(-50% - 15px));
             }
        }

        @media (max-width: 480px) {
            .post-header {
                padding: 20px 10px;
            }
            .post-header__info h1 {
                font-size: 1.8rem;
            }
            .poster-img {
                max-width: 120px;
            }
             .post-header__info li {
                font-size: 0.8rem;
             }
             .more-data {
                 font-size: 0.8rem;
             }
            .capitulo { /* Even smaller fixed width */
                width: 120px;
            }
            .imagen img {
                height: 80px;
            }
             .titulo {
                 font-size: 0.8rem;
                 padding: 5px 6px;
                 min-height: 2.4em;
             }
             .duracion {
                 font-size: 0.6rem;
                 padding: 2px 4px;
                 top: 5px;
                 right: 5px;
             }
             .play-icon {
                font-size: 2em; /* Smallest icon */
                transform: translate(-50%, calc(-50% - 10px));
             }
        }
    </style>
</head>

<body>
    <header class="post-header">
        <div class="post-header__content">
            <img src="${posterPathMain}" alt="${title} poster" class="poster-img">
            <div class="post-header__info">
                <h1>${title}</h1>
                <ul>
                    <li>
                        <span class="iconify" data-icon="mdi:calendar"></span>
                        <span>${year}</span>
                    </li>
                    <li>
                        <span class="iconify" data-icon="mdi:star"></span>
                        <span>${voteAverage}</span>
                    </li>
                    <li>
                        <span class="iconify" data-icon="mdi:television-play"></span>
                        <span>${numberOfSeasonsTotal} Temporada${numberOfSeasonsTotal > 1 || numberOfSeasonsTotal === 0 ? 's' : ''}</span>
                    </li>
                </ul>
                <p class="resume">${synopsis}</p>
                <div class="more-data">
                    <p>Género: ${genres}</p>
                    <!-- Creator data is not in the default series details endpoint, omitting -->
                    <!-- <p>Creado por: Michael Waldron</p> -->
                </div>
            </div>
            <!-- Placeholder Favorite Button -->
            <button id="favoritoBtn" data-identificador="${seriesData.id}">Agregar a Favoritos</button>
            <!-- Hidden data for Favorites (Optional, adjust as needed for your Favorites implementation) -->
            <div id="favoritoData" style="display: none;">
                <img id="favoritoImagen" src="${posterPathMain}" alt="${title} Poster">
                <a id="favoritoEnlace" href="#"></a> <!-- Placeholder link -->
                <span id="nombre">${title}</span>
            </div>
        </div>
    </header>

    <section class="seasons-selector">
        <label for="seleccionar-temporada">Seleccionar temporada</label>
        <select id="seleccionar-temporada">
            ${seasonSelectOptionsHtml}
        </select>
    </section>

    <div class="contenedor-capitulos" id="contenedor-capitulos">
        ${seasonCapitulosDivsHtml}
    </div>

    <script>
        document.addEventListener("DOMContentLoaded", () => {
            // Manejo de temporadas
            const seasonSelect = document.getElementById("seleccionar-temporada");
            const seasonContainers = document.querySelectorAll(".season-episodes-container"); // Select the new container
            const firstSeasonId = "${firstSeasonId}"; // ID of the first season with episodes

            // Hide all seasons first
            seasonContainers.forEach(container => container.style.display = "none");

            // Show the first season with episodes by default
            if (firstSeasonId && document.getElementById(firstSeasonId)) {
                 document.getElementById(firstSeasonId).style.display = "block"; // Use block for the container
                 seasonSelect.value = firstSeasonId; // Set the select dropdown to the first season
            } else if(seasonContainers.length > 0) {
                // Fallback: Show the first container if firstSeasonId wasn't set
                 seasonContainers[0].style.display = "block";
                 seasonSelect.value = seasonContainers[0].id;
            }


            seasonSelect.addEventListener("change", () => {
                const selectedSeasonId = seasonSelect.value;
                seasonContainers.forEach((container) => {
                    if (container.id === selectedSeasonId) {
                        container.style.display = "block"; // Show the selected container
                    } else {
                        container.style.display = "none";
                    }
                });
            });

            // Placeholder Manejo de favoritos (Basic functionality from user's template)
            const favoritoBtn = document.getElementById('favoritoBtn');
            if (favoritoBtn) {
                 const identificador = favoritoBtn.getAttribute('data-identificador');
                 // Check localStorage (assuming 'favoritos' is a key used elsewhere)
                 const favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
                 const encontrado = favoritos.some(favorito => favorito.identificador === identificador);

                 if (encontrado) {
                     favoritoBtn.textContent = 'Borrar de Favoritos';
                 } else {
                     favoritoBtn.textContent = 'Agregar a Favoritos';
                 }

                 // Simple click handler (doesn't fully implement add/remove, just changes text)
                 favoritoBtn.addEventListener('click', () => {
                      const isAdding = favoritoBtn.textContent === 'Agregar a Favoritos';
                       if (isAdding) {
                           // Placeholder: Add logic to save to localStorage here if needed
                            favoritoBtn.textContent = 'Borrar de Favoritos';
                            alert('Serie agregada a Favoritos (Placeholder)'); // Notify user (placeholder)
                       } else {
                           // Placeholder: Add logic to remove from localStorage here if needed
                           favoritoBtn.textContent = 'Agregar a Favoritos';
                           alert('Serie borrada de Favoritos (Placeholder)'); // Notify user (placeholder)
                       }
                       // NOTE: Full localStorage add/remove logic would be more complex
                       // and should align with how your main page handles favorites.
                       // This is just a basic text toggle based on initial state.
                 });
            }

             // Prevent default link behavior for episode links that have '#' href
            document.querySelectorAll('a.capitulo[href="#"]').forEach(link => {
                 link.addEventListener('click', (e) => {
                      e.preventDefault(); // Prevent navigation
                      // You might want to add logic here to handle the click,
                      // like showing a modal or copying embed URLs.
                      console.log('Episode clicked:', link.dataset);
                       alert('Haz clickeado un capítulo. Edita el código fuente para añadir los enlaces de video.');
                 });
            });

             // Add mouse wheel horizontal scrolling
            const episodeScrollContainers = document.querySelectorAll('.capitulos'); // Select the flex div
            episodeScrollContainers.forEach(container => {
                container.addEventListener('wheel', (evt) => {
                  // Only scroll horizontally if Shift key is not pressed (default vertical scroll)
                  if (!evt.shiftKey) {
                      evt.preventDefault();
                      container.scrollLeft += evt.deltaY;
                  }
                }, { passive: true }); // Use passive true for better scrolling performance
            });

        });
    </script>
</body>
</html>
    `;
    return generatedHtml;
}