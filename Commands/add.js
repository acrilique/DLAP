import { SlashCommandBuilder } from 'discord.js';
import { audio } from '../AudioBackend/PlayAudio.js';
import { PermissionFlagsBits } from 'discord-api-types/v10';
import { readFileSync } from 'node:fs';
import { searchForTrackLocally } from '../Utilities/SearchUtil.js';
import { ripAudio } from '../NonLocal/rip.js';

const { djRole, ownerID } = JSON.parse(readFileSync('./config.json', 'utf-8'));

export let integer;
export let search_term;

export default {
  data: new SlashCommandBuilder()
    .setName('add')
    .setDescription('Adds music to queue, only if it is not already in the queue')
    .addStringOption(option =>
      option.setName('search_term')
        .setDescription('Input a search term for the music.')  
    ),

  async execute(interaction, bot) {
    if (!interaction.member.voice.channel) return await interaction.reply({ content: 'You need to be in a voice channel to use this command.', ephemeral: true });
    // if (!interaction.member.roles.cache.has(djRole) && interaction.user.id !== ownerID && !interaction.member.permission.has(PermissionFlagsBits.ManageGuild)) return interaction.reply({ content: 'You need a specific role to execute this command', ephemeral: true });

    search_term = interaction.options.getString('search_term');

    if (search_term) {
      let match = searchForTrackLocally(search_term);
      if (match === null) {
        await interaction.reply({ content: 'Ripping audio from Tidal', ephemeral: true });
        const rip = await ripAudio(search_term);
        if (rip === "No results found"){
          try {
            await interaction.reply({ content: 'No results found', ephemeral: true });
          } 
          catch (e) {
            console.log("Couldn't add track to queue; error: "+e);
          }
          return;
        }
      } else {
        await interaction.reply({ content: `I cannot add: ${audio} to the queue because it exists as a local file and this is not implemented.`, ephemeral: true });
      }
      
      return;
    }
    
  }
};
