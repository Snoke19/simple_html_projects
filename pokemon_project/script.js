const URL_API = "https://pokeapi-proxy.freecodecamp.rocks/api/pokemon";

const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const pokemonName = document.getElementById('pokemon-name');
const spriteContainer = document.getElementById('sprite-container');
const pokemonId = document.getElementById('pokemon-id');
const weight = document.getElementById('weight');
const height = document.getElementById('height');
const types = document.getElementById('types');
const hp = document.getElementById('hp');
const attack = document.getElementById('attack');
const defense = document.getElementById('defense');
const specialAttack = document.getElementById('special-attack');
const specialDefense = document.getElementById('special-defense');
const speed = document.getElementById('speed');

const fetchPokemon = async (pokemonNameOrId) => {
    try {
        const response = await fetch(`${URL_API}/${pokemonNameOrId.toLowerCase()}`);
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error("Pokémon not found");
            } else {
                throw new Error("Unknown http error!");
            }
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching Pokémon:", error);
        throw error;
    }
};

const updatePokemonInfo = (pokemon) => {
    pokemonName.textContent = pokemon.name.toUpperCase();
    pokemonId.textContent = `#${pokemon.id}`;
    weight.textContent = `Weight: ${pokemon.weight}`;
    height.textContent = `Height: ${pokemon.height}`;
    spriteContainer.innerHTML = `<img id="sprite" src="${pokemon.sprites.front_default}" alt="${pokemon.name} sprite">`;
    types.innerHTML = pokemon.types
        .map(type => `<span class="type ${type.type.name}">${type.type.name}</span>`)
        .join("");
    updatePokemonStats(pokemon.stats);
};

const updatePokemonStats = (stats) => {
    const statsMapping = {
        hp,
        attack,
        defense,
        'special-attack': specialAttack,
        'special-defense': specialDefense,
        speed
    };

    stats.forEach(stat => {
        if (statsMapping[stat.stat.name]) {
            statsMapping[stat.stat.name].textContent = stat.base_stat;
        }
    });
};

searchButton.addEventListener("click", (event) => {

    event.preventDefault();

    if (!searchInput.value) {
        alert("Field of the search is empty!");
        return;
    }

    const valueSearch = searchInput.value;
    fetchPokemon(valueSearch)
        .then((result) => {
            const pokemonObj = result;
            updatePokemonInfo(pokemonObj);
        })
        .catch((error) => {
            alert(error.message);
        });
});