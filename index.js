const Discord = require('discord.js');
const axios = require('axios');

const client = new Discord.Client();
const token = 'SEU_TOKEN_DE_BOT_AQUI';
const clientId = 'SEU_CLIENT_ID_DA_RIOT_API';
const clientSecret = 'SEU_CLIENT_SECRET_DA_RIOT_API';
const redirectUri = 'http://localhost:3000/riot-auth';

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async (message) => {
  if (message.content === '!auth') {
    const state = message.author.id;
    const url = `https://auth.riotgames.com/api/v1/authorization?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid+offline_access&state=${state}`;

    message.channel.send(`Para autenticar, clique aqui: ${url}`);

    const filter = (response) => {
      return response.author.id === message.author.id && response.content.startsWith('http');
    };

    try {
      const collected = await message.channel.awaitMessages(filter, { max: 1, time: 60000, errors: ['time'] });
      const authCode = collected.first().content.split('code=')[1];

      const tokenUrl = `https://auth.riotgames.com/api/v1/token`;
      const body = `grant_type=authorization_code&redirect_uri=${redirectUri}&code=${authCode}`;
      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      };

      const response = await axios.post(tokenUrl, body, { headers });
      const accessToken = response.data.access_token;

      const userUrl = `https://euw1.porofessor.gg/api/v1/lol/summoner/basic?access_token=${accessToken}`;
      const userResponse = await axios.get(userUrl);
      const username = userResponse.data.username;
      const tag = userResponse.data.tag;

      message.author.send(`Seu nome de usuário na Riot é ${username}#${tag}.`);
    } catch (error) {
      console.error(error);
      message.reply('O tempo limite para autenticação expirou ou ocorreu um erro ao tentar autenticar.');
    }
  }
});

client.login(token);
