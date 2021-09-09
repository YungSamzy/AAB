const axios = require("axios");
const cheerio = require("cheerio");
const _ = require("lodash");
const fs = require("fs");
const path = require("path");

const animes = [
  { name: "Tokyo Revengers (Uncensored)", url: "https://animekisa.tv/tokyo-revengers-uncensored" }, //Replace These With What You Want!
  { name: "One Piece", url: "https://animekisa.tv/one-piece" },
];

function extractEpisodes(html) {
  const episodes = [];
  const $ = cheerio.load(html);
  $("div.infoept2 div.centerv").each((i, elem) => {
    episodes.push($(elem).text());
  });
  return episodes;
}

function formatEpisodes(episodes) {
  return episodes.reverse().map(episode => {
    return parseInt(episode, 10);
  });
}

function getEpisodes(url) {
  return axios
    .get(url)
    .then(response => {
      const extractedEpisodes = extractEpisodes(response.data);
      return formatEpisodes(extractedEpisodes);
    })
    .catch(error => {
      console.log((error.response && error.response.data) || error.request || error.message);
    });
}
function send(episodesForEmail, name, url) {
  const { Webhook } = require('discord-webhook-node');
  const hook = new Webhook("DISCORD_WEBHOOK_URL"); //Change This
  
  const IMAGE_URL = 'https://samzy.dev/api/pfp.jpg';
  hook.setUsername('Anime Alert Bot');
  hook.setAvatar(IMAGE_URL);
  if (episodesForEmail == "1")
  {
    hook.send(`${name} has a new episode! Watch Here: ${url}`);
  }else
  {
    hook.send(`${name} has ${episodesForEmail} new episodes! Watch Here: ${url}`);
  }

}
function syncEpisodes(name, filePath, url) {
  const readDatabase = fs.existsSync(filePath) ? fs.readFileSync(filePath).toString() : "";
  const parsedDatabase = readDatabase ? JSON.parse(readDatabase) : readDatabase;
  getEpisodes(url).then(result => {
    if (_.isEqual(parsedDatabase, result)) {
      return console.log(`No new episodes for ${name}.`);
    } else {
      const missingEpisodes = _.differenceWith(result, parsedDatabase, _.isEqual);
      const episodesForEmail = missingEpisodes.length;
      fs.writeFileSync(filePath, JSON.stringify(result));
      return send(episodesForEmail, name, url);
    }
  });
}

function syncAnimes(animes) {
  animes.forEach(anime => {
    const filePath = path.join(__dirname, `../database/${anime.name}.json`);
    syncEpisodes(anime.name, filePath, anime.url);
  });
}

function start(animes) {
  setInterval(() => syncAnimes(animes), 5000);
}

start(animes);
