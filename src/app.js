import "dotenv/config";
import { fileURLToPath } from "url";
import path from "path";

import { MessageActionRow } from "discord.js";

import {
  joinVoiceChannel,
  getVoiceConnection,
  createAudioPlayer,
  NoSubscriberBehavior,
  createAudioResource,
} from "@discordjs/voice";

import client from "./client.js";
import { getRandomEmoji, logger, RESOURCES } from "./utils.js";
import Actions from "./actions.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const player = createAudioPlayer({
  behaviors: {
    noSubscriber: NoSubscriberBehavior.Pause,
  },
});

client.on("ready", () => {
  logger.info("Discord Bot is running! " + getRandomEmoji());

  const guild = client.guilds.cache.get(process.env.GUILD_ID);

  const commands = guild.commands || client.application?.commands;

  commands?.create({
    name: "join",
    description: "Join voice channel",
  });
});

client.on("interactionCreate", (interaction) => {
  if (!interaction.isButton()) return;

  const connection = getVoiceConnection(interaction.guild.id);
  const action = RESOURCES.find(({ key }) => key === interaction.customId);

  if (action) {
    const resource = createAudioResource(
      path.resolve(__dirname, "assets", action.audio)
    );

    player.play(resource);

    connection.subscribe(player);

    interaction.reply({ content: action.message, ephemeral: true });
  }
});

client.on("messageCreate", async (message) => {
  if (message.content === "!join") {
    joinVoiceChannel({
      channelId: message.member.voice.channel.id,
      guildId: message.guild.id,
      adapterCreator: message.guild.voiceAdapterCreator,
    });

    const row = new MessageActionRow().addComponents(Actions);

    await message.reply({ ephemeral: true, components: [row] });
  }

  if (message.content === "!leave") {
    const connection = getVoiceConnection(message.guild.id);
    connection.destroy();
  }
});

client.login(process.env.DISCORD_TOKEN);
