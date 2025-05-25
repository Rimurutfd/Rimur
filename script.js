import { displayResults, displayMessage } from "./uiHandler.js";
import { generateCinemaxHtml } from "./htmlGenerator.js";
import { generateBasicHtml } from "./basicHtmlGenerator.js"; // Import the new generator

const API_KEY = '1076ac03cba68c1680094495c8506ad7';
const BASE_URL = 'https://api.themoviedb.org/3/';
const IMAGE_BASE_URL_POSTER = 'https://image.tmdb.org/t/p/w185/'; // Use w185 for posters in search results
const IMAGE_BASE_URL_STILL = 'https://image.tmdb.org/t/p/w300/'; // Use w300 for episode stills
const IMAGE_BASE_URL_BACKDROP = 'https://image.themoviedb.org/t/p/w1280/'; // Use w1280 for backdrop

const searchInput = document.getElementById('searchInput');
const seasonInput = document.getElementById('seasonInput'); // Get the new season input
const searchButton = document.getElementById('searchButton');
const resultsContainer = document.getElementById('resultsContainer');
const sourceCodeInput = document.getElementById('sourceCodeInput'); // Get the textarea
const copyCodeButton = document.getElementById('copyCodeButton'); // Get the copy button
const templateRadios = document.querySelectorAll('input[name="template"]'); // Get the template radio buttons

let tvGenres = {}; // To store TV genre map

// Fetch TV genres on load
async function fetchTvGenres() {
    const url = `${BASE_URL}genre/tv/list?api_key=${API_KEY}&language=es-ES`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        tvGenres = data.genres.reduce((map, genre) => {
            map[genre.id] = genre.name;
            return map;
        }, {});
        console.log("TV Genres fetched:", tvGenres);
    } catch (error) {
        console.error("Error fetching TV genres:", error);
        displayMessage("Error al cargar géneros de TV.", 'red', resultsContainer);
    }
}

fetchTvGenres(); // Fetch genres when the script loads

async function searchShows(query) {
    if (!query) {
        displayMessage("Por favor, introduce un término de búsqueda.", 'red', resultsContainer);
        return;
    }

    displayMessage('<p>Buscando contenido...</p>', null, resultsContainer);
    sourceCodeInput.value = ''; // Clear previous source code
    copyCodeButton.style.display = 'none'; // Hide copy button initially

    try {
        // Search both TV shows and movies in parallel
        const tvUrl = `${BASE_URL}search/tv?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=es-ES`;
        const movieUrl = `${BASE_URL}search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=es-ES`;

        const [tvResponse, movieResponse] = await Promise.all([
            fetch(tvUrl),
            fetch(movieUrl)
        ]);

        if (!tvResponse.ok || !movieResponse.ok) {
            throw new Error(`HTTP error`);
        }

        const tvData = await tvResponse.json();
        const movieData = await movieResponse.json();

        // Combine and sort results by relevance
        const allResults = [...tvData.results, ...movieData.results].sort((a, b) =>
            // Sort by popularity descending
            (b.popularity || 0) - (a.popularity || 0)
        );

        displayResults(allResults, resultsContainer, IMAGE_BASE_URL_POSTER);
    } catch (error) {
        console.error("Error fetching data:", error);
        displayMessage("Ocurrió un error al buscar el contenido. Inténtalo de nuevo.", 'red', resultsContainer);
    }
}

async function fetchAndGenerateShowHtml(seriesId) {
    const selectedTemplate = document.querySelector('input[name="template"]:checked').value;
    const seasonValue = seasonInput.value.trim();
    const selectedSeasonNumber = parseInt(seasonValue, 10);

    // Only apply specific season filtering if Cinemax template is selected AND a season number >= 2 is provided
    const fetchSpecificSeasonCinemax = selectedTemplate === 'cinemax' && selectedSeasonNumber >= 2;

    let message = '<p>Cargando detalles de la serie...</p>';
    if (fetchSpecificSeasonCinemax) {
        message = `<p>Cargando detalles de la Temporada ${selectedSeasonNumber} (CINEMAX)...</p>`;
    } else if (selectedTemplate === 'basic') {
        message = `<p>Cargando detalles de la serie (BASIC)...</p>`;
    }

    displayMessage(message, null, resultsContainer); // Loading message

    sourceCodeInput.value = ''; // Clear previous source code
    copyCodeButton.style.display = 'none'; // Hide copy button until generated

    try {
        // Fetch main series details (always needed for title, synopsis, genres, backdrop)
        const seriesDetailsUrl = `${BASE_URL}tv/${seriesId}?api_key=${API_KEY}&language=es-ES`;
        const seriesResponse = await fetch(seriesDetailsUrl);
        if (!seriesResponse.ok) {
            throw new Error(`HTTP error! status: ${seriesResponse.status} for series ${seriesId}`);
        }
        const seriesData = await seriesResponse.json();

        let seasonsData = [];

        // Determine which seasons to fetch based on template and season input
        let seasonsToFetch = [];
        if (selectedTemplate === 'basic' || (selectedTemplate === 'cinemax' && !fetchSpecificSeasonCinemax)) {
            // Basic template always fetches all seasons > 0
            // Cinemax template fetches all seasons > 0 unless a specific season >= 2 is requested
            if (seriesData.seasons && seriesData.seasons.length > 0) {
                seasonsToFetch = seriesData.seasons.filter(s => s.season_number > 0).map(s => s.season_number);
            }
        } else if (fetchSpecificSeasonCinemax) {
            // Cinemax template with specific season >= 2 requested
            seasonsToFetch = [selectedSeasonNumber];
        }

        if (seasonsToFetch.length === 0 && seriesData.number_of_seasons > 0) {
            // If no seasons > 0 were found, but the series data indicates seasons exist (like Season 0 only),
            // and we didn't specifically request a season >= 2 that wasn't found.
            if (!fetchSpecificSeasonCinemax || (fetchSpecificSeasonCinemax && !seriesData.seasons.find(s => s.season_number === selectedSeasonNumber))) {
                displayMessage("No se encontraron temporadas con episodios (excluyendo Especiales) o la temporada especificada no existe.", 'red', resultsContainer);
                sourceCodeInput.value = '';
                copyCodeButton.style.display = 'none';
                return;
            }
        } else if (seasonsToFetch.length === 0) {
            // No seasons found at all
            displayMessage("No se encontraron datos de temporadas para esta serie.", 'red', resultsContainer);
            sourceCodeInput.value = '';
            copyCodeButton.style.display = 'none';
            return;
        }

        // Fetch details for the determined seasons
        const seasonPromises = seasonsToFetch.map(seasonNumber => {
            const seasonDetailsUrl = `${BASE_URL}tv/${seriesId}/season/${seasonNumber}?api_key=${API_KEY}&language=es-ES`;
            return fetch(seasonDetailsUrl).then(response => {
                if (!response.ok) {
                    console.warn(`Failed to fetch details for Season ${seasonNumber}`, response.status);
                    return null; // Return null for failed seasons
                }
                return response.json();
            }).catch(error => {
                console.error(`Error fetching details for Season ${seasonNumber}:`, error);
                return null; // Handle fetch errors
            });
        });

        // Filter out null results from failed fetches
        seasonsData = (await Promise.all(seasonPromises)).filter(season => season !== null);

        // Ensure we have seasons with episodes
        seasonsData = seasonsData.filter(season => season && season.episodes && season.episodes.length > 0);

        if (seasonsData.length === 0) {
            let errorMsg = "No se encontraron temporadas con episodios para generar.";
            if (fetchSpecificSeasonCinemax) {
                errorMsg = `No se encontraron episodios para la Temporada ${selectedSeasonNumber}.`;
            }
            displayMessage(errorMsg, 'red', resultsContainer);
            sourceCodeInput.value = '';
            copyCodeButton.style.display = 'none';
            return;
        }

        let generatedHtml = '';
        let successMessage = '';

        if (selectedTemplate === 'cinemax') {
            // Use the existing Cinemax generator
            generatedHtml = generateCinemaxHtml(
                seriesData,
                seasonsData, // This array now contains the fetched seasons (all > 0 or the specific one >= 2)
                tvGenres,
                IMAGE_BASE_URL_POSTER,
                IMAGE_BASE_URL_STILL,
                IMAGE_BASE_URL_BACKDROP
            );
            successMessage = `Código fuente generado para "${seriesData.name}" (CINEMAX Style).`;
            if (fetchSpecificSeasonCinemax) {
                successMessage += ` (Solo Temporada ${selectedSeasonNumber})`;
            }
        } else if (selectedTemplate === 'basic') {
            // Use the new Basic generator
            generatedHtml = generateBasicHtml(
                seriesData,
                seasonsData, // This array contains all seasons > 0 with episodes
                tvGenres,
                IMAGE_BASE_URL_POSTER, // Basic template uses w300 for poster
                IMAGE_BASE_URL_STILL, // Basic template uses w300 for stills
                IMAGE_BASE_URL_BACKDROP // Basic template uses w1280 for backdrop
            );
            successMessage = `Código fuente generado para "${seriesData.name}" (Basic Style).`;
            // Basic template always generates all seasons > 0, so no specific season message needed here.
        }

        sourceCodeInput.value = generatedHtml;
        copyCodeButton.style.display = 'block'; // Show copy button

        // Hide results container after successful generation
        displayMessage('', null, resultsContainer); // Clear results
        successMessage += ` Puedes copiarlo del cuadro de texto.`;
        displayMessage(successMessage, 'green', resultsContainer);

    } catch (error) {
        console.error("Error fetching series details or season:", error);
        displayMessage(`Error: ${error.message}. Inténtalo de nuevo.`, 'red', resultsContainer);
        sourceCodeInput.value = ''; // Clear textarea on error
        copyCodeButton.style.display = 'none'; // Hide copy button on error
    }
}

// Event listeners
searchButton.addEventListener('click', () => {
    const query = searchInput.value.trim();
    searchShows(query);
});

searchInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent default form submission
        const query = searchInput.value.trim();
        searchShows(query);
    }
});

// Listen for clicks on show elements to fetch and generate show HTML
resultsContainer.addEventListener('click', (event) => {
    const movieItem = event.target.closest('.movie-item');
    if (movieItem) {
        const seriesId = movieItem.dataset.seriesId;
        if (seriesId) {
            fetchAndGenerateShowHtml(seriesId);
        }
    }
});

// Add event listener for the copy button
copyCodeButton.addEventListener('click', () => {
    sourceCodeInput.select();
    sourceCodeInput.setSelectionRange(0, 99999); // For mobile devices

    try {
        document.execCommand('copy');
        displayMessage("Código copiado al portapapeles.", 'green', resultsContainer);
    } catch (err) {
        console.error('Error al copiar el código: ', err);
        displayMessage("Error al copiar el código.", 'red', resultsContainer);
    }
});

// Initial state: hide copy button
copyCodeButton.style.display = 'none';

// Event listener for template radio buttons to potentially hide/show season input hint
templateRadios.forEach(radio => {
    radio.addEventListener('change', () => {
        const selectedTemplate = document.querySelector('input[name="template"]:checked').value;
        if (selectedTemplate === 'cinemax') {
            seasonInput.style.display = 'inline-block'; // Or 'flex' depending on parent flex context
            seasonInput.placeholder = 'Temp (opcional)';
        } else {
            seasonInput.style.display = 'none'; // Hide for basic template
            seasonInput.value = ''; // Clear value when hidden
        }
    });
});

// Trigger initial check on load
document.addEventListener('DOMContentLoaded', () => {
    const initialTemplate = document.querySelector('input[name="template"]:checked').value;
    if (initialTemplate !== 'cinemax') {
        seasonInput.style.display = 'none';
        seasonInput.value = '';
    }
});