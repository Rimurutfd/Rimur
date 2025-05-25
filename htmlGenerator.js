export function generateCinemaxHtml(seriesData, seasonsData, tvGenres, IMAGE_BASE_URL_POSTER, IMAGE_BASE_URL_STILL, IMAGE_BASE_URL_BACKDROP) {
    const year = seriesData.first_air_date ? new Date(seriesData.first_air_date).getFullYear() : 'Fecha desconocida';
    const numberOfSeasons = seriesData.number_of_seasons || 0; // Total seasons from main data
    const voteAverage = seriesData.vote_average ? seriesData.vote_average.toFixed(1) : 'N/A';
    const title = seriesData.name || 'Título desconocido';
    const synopsis = seriesData.overview || 'Sin resumen disponible.';
    const genres = seriesData.genres && seriesData.genres.length > 0
        ? seriesData.genres.map(genre => tvGenres[genre.id] || genre.name).join(', ')
        : 'Género desconocido';
    const backdropPath = seriesData.backdrop_path ? `${IMAGE_BASE_URL_BACKDROP}${seriesData.backdrop_path}` : ''; // Use backdrop for background

    // Use w300 for the main poster in the header for Cinemax template
    const posterPathMain = seriesData.poster_path ? `${IMAGE_BASE_URL_POSTER.replace('w185', 'w300')}${seriesData.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Poster'; // Use larger poster for portada


    let seasonTabsHtml = '';
    let seasonContentHtml = '';

    // Sort seasons by number, ensuring season 1 comes before season 10, etc.
    // Note: seasonsData here only contains the seasons that were fetched (could be just one)
    seasonsData.sort((a, b) => a.season_number - b.season_number);

    seasonsData.forEach((season, index) => {
        // Ensure season and episodes exist and the season number is greater than 0 if we filter like that in script.js
        if (!season || !season.episodes || season.episodes.length === 0 || season.season_number === 0) {
            return; // Skip seasons with no episodes or special season 0
        }

        // The first season in the *passed* seasonsData array will be active
        const isActiveSeason = index === 0;
        const seasonId = `temporada${season.season_number}`;
        // Use "Temporada X" if generic name, otherwise use the provided name
        const seasonName = season.name && season.name !== `Season ${season.season_number}` ? season.name : `Temporada ${season.season_number}`;

        seasonTabsHtml += `<li class="tab ${isActiveSeason ? 'active' : ''}" data-season="${seasonId}" role="tab" aria-selected="${isActiveSeason}">${seasonName}</li>`;

        let episodeButtonsHtml = '';
        season.episodes.forEach(episode => {
             // Use episode still, or fallback to backdrop/poster, or placeholder
            const episodeImagePath = episode.still_path
                ? `${IMAGE_BASE_URL_STILL}${episode.still_path}`
                : (seriesData.backdrop_path ? `${IMAGE_BASE_URL_STILL}${seriesData.backdrop_path}` : posterPathMain.replace('w300', 'w185')); // Fallback if no episode still or backdrop

            // Generate button HTML matching the requested format
            episodeButtonsHtml += `
                <button class="episode-button" data-episode-name="Capítulo ${episode.episode_number}: ${episode.name || 'Sin Título'}" data-iframe-es="#" data-iframe-subes="#" aria-label="Capítulo ${episode.episode_number}: ${episode.name || 'Sin Título'}" title="Capítulo ${episode.episode_number}: ${episode.name || 'Sin Título'}">
                    <div class="episode-content-wrapper">
                        <img class="episode-still" src="${episodeImagePath}" alt="Capítulo ${episode.episode_number} - ${episode.name || 'Sin Título'}" loading="lazy">
                        <h5 class="episode-title">Capítulo ${episode.episode_number}</h5>
                        <!-- Add embed URLs here: data-iframe-es="YOUR_SPANISH_EMBED_URL" data-iframe-subes="YOUR_SUB_SPANISH_EMBED_URL" -->
                    </div>
                </button>
            `;
        });

        // Display style is block only for the active season, none for others
        const displayStyle = isActiveSeason ? 'block' : 'none';

        seasonContentHtml += `
            <div id="${seasonId}" class="season-content" style="display: ${displayStyle};">
                <div class="episode-list-scroll">
                    ${episodeButtonsHtml}
                </div>
            </div>
        `;
    });

     // Handle cases where no seasons were generated (e.g., only season 0 exists, or the selected season had no episodes)
    if (seasonTabsHtml === '' || seasonContentHtml === '') {
        seasonTabsHtml = '<li class="tab active" data-season="no-seasons" role="tab" aria-selected="true">No hay temporadas disponibles</li>';
        seasonContentHtml = `
            <div id="no-seasons" class="season-content" style="display: block;">
                <div class="episode-list-scroll">
                    <p style="color: var(--text-color); padding: 20px; text-align: center; width: 100%;">No se encontraron temporadas con episodios para generar.</p>
                </div>
            </div>
        `;
    }

    // Construct the full HTML string
    const generatedHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - CINEMAX+ APP</title>
  <!-- Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&family=Kanit:wght@300;600&display=swap" rel="stylesheet">
  <!-- Libraries -->
  <script src="https://code.iconify.design/2/2.2.1/iconify.min.js" defer></script>
  <style>
    :root {
      --primary-color: #ffae00;
      --background-color: #1a1a1a; /* Darker background */
      --text-color: #e0e0e0; /* Lighter text for contrast */
      --accent-color: #ff0000; /* True red */
      --card-bg: #282828; /* Slightly lighter dark */
      --hover-bg: #444444; /* Distinct hover state */
      --border-color: #444;
      --button-bg: #3a3a3a; /* Default button background */
      --button-hover-bg: #5a5a5a; /* Default button hover */
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      /* user-select: none; /* Disable text selection - Can interfere with copying text on mobile */
      outline: none; /* Remove default outline */
      -webkit-tap-highlight-color: transparent; /* Remove tap highlight on mobile */
    }

    body {
      background: var(--background-color);
      font-family: 'PT Sans', sans-serif;
      color: var(--text-color);
      line-height: 1.6; /* Improved readability */
      padding: 20px 10px; /* Add some padding */
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .background-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(to bottom, rgba(0,0,0,0.9) 10%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.9) 100%)${backdropPath ? `, url('${backdropPath}') no-repeat center/cover` : ''}; /* Use backdrop if available */
      z-index: -1;
      filter: blur(10px); /* Add blur effect */
      transform: scale(1.1); /* Prevent showing blurred edges */
      will-change: transform, filter; /* Performance hint */
    }

    /* Main Content Wrapper */
    .main-content {
        max-width: 1000px;
        width: 100%;
        margin: 0 auto; /* Center content */
        position: relative; /* Needed for background-container z-index */
    }


    /* Video Player */
    #video-player {
      position: relative;
      width: 100%;
      margin-bottom: 20px; /* Space below player */
      border-radius: 10px;
      overflow: hidden; /* Ensure border-radius applies */
      box-shadow: 0 5px 20px rgba(0, 0, 0, 0.5); /* Add shadow */
    }

    .video-container {
      position: relative;
      width: 100%;
      aspect-ratio: 16 / 9;
      background: #000;
    }

    .video-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      /* Removed background image from overlay */
      background-color: rgba(0,0,0,0.9); /* Dark overlay */
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: white;
      font-size: 1.5rem;
      cursor: pointer;
      transition: opacity 0.5s ease;
      z-index: 2; /* Above iframe */
    }

    .video-container.playing .video-overlay {
        opacity: 0;
        pointer-events: none;
    }

     .video-overlay .iconify { /* Use iconify class */
        font-size: 3em;
        margin-bottom: 10px;
         color: #fff; /* White color for the play icon */
    }

    .video-overlay p {
        margin: 0;
        font-size: 1em;
         color: #fff; /* White color for the text */
    }


    iframe {
      width: 100%;
      height: 100%;
      border: none;
      display: block; /* Remove extra space below iframe */
      position: absolute;
      top: 0;
      left: 0;
      z-index: 1; /* Below overlay initially */
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      color: var(--primary-color);
      font-size: 1.2rem;
      z-index: 3; /* Above everything */
      transition: opacity 0.3s ease;
      pointer-events: none;
      opacity: 0; /* Hidden by default */
    }

    .video-container.loading .loading-overlay {
      opacity: 1;
    }

    /* Language Selection Buttons */
    .language-buttons-container {
        display: none; /* Hidden by default */
        justify-content: center; /* Center buttons horizontally */
        gap: 15px; /* Space between buttons */
        padding: 10px 0;
        margin-top: 10px; /* Space above container */
    }

     .language-buttons-container.visible {
        display: flex; /* Show when active */
     }

    .language-button {
        padding: 10px 20px;
        background-color: var(--button-bg);
        color: var(--text-color);
        border: 1px solid var(--border-color);
        border-radius: 5px;
        cursor: pointer;
        font-size: 1rem;
        transition: background-color 0.3s ease, border-color 0.3s ease;
        font-family: 'PT Sans', sans-serif;
        flex-shrink: 0;
    }

    .language-button:hover {
        background-color: var(--button-hover-bg);
        border-color: var(--primary-color);
    }

    .language-button.active {
        background-color: var(--primary-color); /* Highlight active button */
        border-color: var(--primary-color);
        color: #000; /* Dark text for contrast */
        font-weight: bold;
    }


    .language-button.unavailable {
        opacity: 0.6;
        cursor: not-allowed;
    }
     .language-button.unavailable:hover {
        background-color: var(--button-bg); /* No hover effect */
        border-color: var(--border-color);
     }


    /* Info Section */
    .info-section {
      display: flex;
      justify-content: space-around;
      padding: 15px 10px;
      background: var(--card-bg);
      border-radius: 8px;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 15px; /* Increased gap */
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 8px; /* Increased gap */
      font-size: 1rem; /* Slightly larger font */
      font-family: 'Kanit', sans-serif;
      color: var(--text-color);
    }

    .info-item .iconify {
        color: var(--primary-color); /* Icon color */
        font-size: 1.2em;
    }


    /* Title and Synopsis */
    .series-header {
        text-align: center;
        margin-bottom: 20px;
    }

    .series-title {
      font-size: 1.8rem; /* Larger title */
      font-weight: 700; /* Bold */
      margin-bottom: 5px;
      color: var(--text-color);
      font-family: 'Kanit', sans-serif;
    }

    .series-genres {
      font-size: 1rem;
      color: var(--text-color);
    }

    .series-genres b {
        color: var(--accent-color);
        font-weight: 700;
    }

    .synopsis-section {
      max-width: 1000px;
      margin: 20px auto;
      background: var(--card-bg);
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 0 15px rgba(0, 0, 0, 0.7);
      text-align: center;
    }

    .synopsis-section h3 {
      color: var(--primary-color); /* Accent color for heading */
      font-size: 1.4rem;
      margin-bottom: 15px;
      font-family: 'Kanit', sans-serif;
    }

    .synopsis-section p {
      font-size: 1rem;
      color: var(--text-color);
      text-align: left; /* Left align synopsis text */
      max-width: 800px; /* Limit width for readability */
      margin: 0 auto; /* Center text block */
    }


    /* Tabs */
    .tabs-container {
      overflow-x: auto;
      white-space: nowrap;
      padding: 10px 0; /* Padding for scrollbar */
      margin: 20px auto;
      scrollbar-width: none; /* Firefox */
      -ms-overflow-style: none;  /* IE and Edge */
    }

    .tabs-container::-webkit-scrollbar {
      display: none; /* Chrome, Safari, Opera */
    }

    .tabs {
      list-style: none;
      display: inline-flex; /* Use inline-flex for scrolling list */
      padding: 0;
      margin: 0;
      gap: 10px; /* Space between tabs */
    }

    .tab {
      padding: 10px 20px;
      border-radius: 20px; /* Pill shape tabs */
      background: var(--card-bg);
      color: var(--text-color);
      cursor: pointer;
      transition: background 0.3s, color 0.3s, transform 0.2s;
      flex-shrink: 0; /* Prevent tabs from shrinking */
      font-family: 'Kanit', sans-serif;
      font-size: 1rem;
      border: 1px solid var(--border-color);
      text-align: center; /* Center text in tab */
    }

    .tab:hover {
      background: var(--hover-bg);
      border-color: var(--hover-bg);
    }

    .tab.active {
      background: var(--primary-color);
      color: #000;
      border-color: var(--primary-color);
      font-weight: 700;
    }

    /* Episode List */
    .season-content-wrapper {
        margin-top: 20px;
    }

    .episode-list-scroll {
      overflow-x: auto;
      white-space: nowrap;
      padding: 10px 0; /* Padding for scrollbar */
      scrollbar-width: none; /* Firefox */
      -ms-overflow-style: none;  /* IE and Edge */
      display: flex; /* Use flex for episode list */
      gap: 15px; /* Space between episode buttons */
    }

    .episode-list-scroll::-webkit-scrollbar {
      display: none; /* Chrome, Safari, Opera */
    }

    .season-content {
        /* display: block; or none; handled by JS */
    }

    .episode-button {
      background: var(--card-bg);
      border: none;
      padding: 0; /* Remove padding here, add to inner div */
      border-radius: 8px;
      cursor: pointer;
      display: inline-block;
      transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
      flex-shrink: 0; /* Prevent buttons from shrinking */
      vertical-align: top; /* Align items at the top */
      width: 180px; /* Fixed width for episode card */
      overflow: hidden;
      text-align: left;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    .episode-button:hover,
    .episode-button:focus {
      transform: translateY(-5px); /* Lift effect */
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
    }

    .episode-button.active {
      border: 3px solid var(--primary-color); /* Highlight active */
      padding: 0; /* Reset padding */
    }

    .episode-content-wrapper {
        padding: 10px;
    }

    .episode-still {
      width: 100%; /* Image takes full width of button */
      height: 100px; /* Fixed height for consistency */
      border-radius: 4px;
      object-fit: cover; /* Ensure image covers area */
      margin-bottom: 8px; /* Space below image */
      display: block; /* Remove extra space below image */
    }

    .episode-title {
      color: var(--text-color);
      font-size: 0.9rem;
      font-weight: 400;
      margin: 0;
      white-space: normal; /* Allow title to wrap */
      overflow: hidden; /* Hide overflow */
      text-overflow: ellipsis; /* Add ellipsis */
      display: -webkit-box;
      -webkit-line-clamp: 2; /* Limit title to 2 lines */
      -webkit-box-orient: vertical;
      line-height: 1.3;
      min-height: 2.6em; /* Ensure consistent height */
    }

    /* Mobile adjustments */
    @media (max-width: 600px) {
        body {
            padding: 10px;
        }

        #video-player {
            margin-bottom: 15px;
        }

        .info-section {
            flex-direction: column;
            align-items: center;
            gap: 10px;
            padding: 10px;
            margin-bottom: 15px;
        }

        .info-item {
            font-size: 0.9rem;
            gap: 5px;
        }

        .info-item .iconify {
            font-size: 1em;
        }

        .series-title {
            font-size: 1.5rem;
        }

        .series-genres {
            font-size: 0.9rem;
        }

        .synopsis-section {
            padding: 15px;
            margin: 15px auto;
        }

        .synopsis-section h3 {
            font-size: 1.2rem;
            margin-bottom: 10px;
        }

        .synopsis-section p {
            font-size: 0.9rem;
        }

        .tabs-container {
            padding: 8px 0;
            margin: 15px auto;
        }

        .tab {
            padding: 8px 15px;
            font-size: 0.9rem;
        }

        .episode-list-scroll {
            padding: 8px 0;
            gap: 10px;
        }

        .episode-button {
             width: 150px; /* Slightly smaller cards on mobile */
        }

         .episode-still {
            height: 80px; /* Adjust image height */
            margin-bottom: 5px;
         }

        .episode-title {
            font-size: 0.85rem;
        }

        .language-buttons-container {
            flex-direction: column; /* Stack buttons on mobile */
            gap: 10px;
            align-items: center;
        }

        .language-button {
             width: 80%; /* Make buttons wider on mobile */
             text-align: center;
        }

    }
  </style>
</head>

<body>
  <div class="background-container"></div>
    <div class="main-content">
      <!-- Video Player -->
      <aside id="video-player">
        <div class="video-container">
          <div class="loading-overlay">Cargando...</div>
            <!-- Play button overlay -->
            <div class="video-overlay">
                 <span class="iconify play-icon" data-icon="mdi:play-circle"></span>
                 <p>Reproducir</p>
            </div>
          <iframe id="cinemax-iframe" src="" allowfullscreen sandbox="allow-scripts allow-same-origin allow-presentation"></iframe>
        </div>
         <!-- Language Selection Buttons -->
        <div class="language-buttons-container visible">
            <button class="language-button active" data-lang="es">Español</button>
            <button class="language-button" data-lang="subes">Sub Español</button>
        </div>
        <!-- Hidden inputs to store selected episode URLs -->
        <input type="hidden" id="selected-episode-es-url" value="">
        <input type="hidden" id="selected-episode-subes-url" value="">
      </aside> <!-- Closing tag for aside was missing -->

      <!-- Info Section -->
      <section class="info-section" role="contentinfo">
        <div class="info-item">
          <span class="iconify" data-icon="ic:baseline-calendar-today"></span>
          <span>${year}</span>
        </div>
        <div class="info-item">
          <span class="iconify" data-icon="mdi:calendar-multiple"></span>
          <span>${numberOfSeasons} Temporada${numberOfSeasons > 1 || numberOfSeasons === 0 ? 's' : ''}</span>
        </div>
        <div class="info-item">
          <span class="iconify" data-icon="mdi:star"></span>
          <span>${voteAverage}</span>
        </div>
      </section>

      <!-- Title and Genres -->
      <div class="series-header">
        <h1 class="series-title">${title}</h1>
        <p class="series-genres"><b style="color: var(--accent-color);">Género:</b> ${genres}</p>
      </div>

      <!-- Synopsis -->
      <section class="synopsis-section">
        <h3>Sinopsis</h3>
        <p>${synopsis}</p>
      </section>

      <!-- Season Tabs -->
      <div class="tabs-container">
        <ul class="tabs" role="tablist">
          ${seasonTabsHtml}
        </ul>
      </div>

      <!-- Episode List -->
      <div class="season-content-wrapper" id="playlist">
        ${seasonContentHtml}
      </div>
    </div>

  <script>
    document.addEventListener('DOMContentLoaded', () => {
        const videoPlayer = document.getElementById('video-player'); // Get the video player element
        const videoContainer = document.querySelector('.video-container');
        const iframe = document.getElementById('cinemax-iframe');
        const episodeButtons = document.querySelectorAll('.episode-button');
        const seasonTabs = document.querySelectorAll('.tab');
        const seasonContents = document.querySelectorAll('.season-content');
        const languageButtonsContainer = document.querySelector('.language-buttons-container');
        const languageButtons = document.querySelectorAll('.language-button');
        const selectedEpisodeEsUrlInput = document.getElementById('selected-episode-es-url');
        const selectedEpisodeSubesUrlInput = document.getElementById('selected-episode-subes-url');

        languageButtons.forEach(button => {
            button.addEventListener('click', () => {
                languageButtons.forEach(langButton => langButton.classList.remove('active'));
                button.classList.add('active');

                const selectedLanguage = button.dataset.lang;
                const activeEpisodeButton = document.querySelector('.episode-button.active');
                if (activeEpisodeButton) {
                    const esUrl = activeEpisodeButton.dataset.iframeEs;
                    const subesUrl = activeEpisodeButton.dataset.iframeSubes;

                    let newIframeSrc = '';
                    if (selectedLanguage === 'es' && esUrl && esUrl !== '#') {
                        newIframeSrc = esUrl;
                    } else if (selectedLanguage === 'subes' && subesUrl && subesUrl !== '#') {
                        newIframeSrc = subesUrl;
                    }

                    if (newIframeSrc) {
                        videoContainer.classList.remove('playing');
                        videoContainer.classList.add('loading');
                        iframe.src = newIframeSrc;

                        videoPlayer.scrollIntoView({ behavior: 'smooth', block: 'start' });


                        iframe.onload = () => {
                           videoContainer.classList.remove('loading');
                           videoContainer.classList.add('playing');
                        };
                        iframe.onerror = () => {
                            videoContainer.classList.remove('loading');
                            videoContainer.classList.remove('playing');
                            console.error('Error loading iframe source for selected language:', newIframeSrc);
                            alert('No se pudo cargar el video para el idioma seleccionado.'); // User-friendly error
                        };
                    } else {
                        console.log('No valid iframe source for the currently selected episode in the chosen language.');
                        iframe.src = '';
                        videoContainer.classList.remove('loading');
                        videoContainer.classList.remove('playing');
                         alert('No se encontró un enlace de video para este idioma.'); // User-friendly message
                    }
                } else {
                     console.log('No episode is currently selected.');
                }
            });
        });


        episodeButtons.forEach(button => {
            button.addEventListener('click', () => {
                episodeButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // Store URLs in hidden inputs
                const esUrl = button.dataset.iframeEs;
                const subesUrl = button.dataset.iframeSubes;
                selectedEpisodeEsUrlInput.value = esUrl;
                selectedEpisodeSubesUrlInput.value = subesUrl;

                // Trigger click on the currently active language button
                const activeLangButton = document.querySelector('.language-button.active');
                 if (activeLangButton) {
                     activeLangButton.click(); // This will handle setting the iframe src
                 } else {
                     // Default to Spanish if no language button is active (shouldn't happen if 'es' is active by default)
                      languageButtons[0].click();
                 }


            });
        });

        seasonTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetSeasonId = tab.dataset.season;

                seasonTabs.forEach(t => {
                    t.classList.remove('active');
                    t.setAttribute('aria-selected', 'false');
                });
                tab.classList.add('active');
                tab.setAttribute('aria-selected', 'true');

                seasonContents.forEach(content => {
                    content.style.display = 'none';
                });
                const targetContent = document.getElementById(targetSeasonId);
                if (targetContent) {
                    targetContent.style.display = 'block';
                }
            });
        });

        const episodeScrollContainers = document.querySelectorAll('.episode-list-scroll');
        episodeScrollContainers.forEach(container => {
            container.addEventListener('wheel', (evt) => {
              // Only scroll horizontally if Shift key is not pressed (default vertical scroll)
              if (!evt.shiftKey) {
                  evt.preventDefault();
                  container.scrollLeft += evt.deltaY;
              }
            }, { passive: true });
        });

        // Initial state: Trigger click on the first language button (Español) to set default iframe src logic
         const initialLangButton = document.querySelector('.language-button.active');
         if (initialLangButton) {
             initialLangButton.click();
         } else {
             languageButtons[0].click();
         }

         // Handle the play button overlay click
        const videoOverlay = document.querySelector('.video-overlay');
        videoOverlay.addEventListener('click', () => {
             const activeEpisodeButton = document.querySelector('.episode-button.active');
             // Only allow clicking the overlay if an episode is selected and an iframe source is available
             if (activeEpisodeButton && iframe.src && iframe.src !== '#') {
                  videoContainer.classList.add('playing'); // Hide overlay
             } else if (activeEpisodeButton) {
                  alert('Por favor, selecciona un idioma (Español o Sub Español) con un enlace válido.');
             } else {
                  alert('Por favor, selecciona un capítulo primero.');
             }
        });
    });
  </script>
</body>

</html>
    `;
    return generatedHtml;
}