import { SlashCommandBuilder } from 'discord.js';
import { PermissionFlagsBits } from 'discord-api-types/v10';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { audio } from '../AudioBackend/PlayAudio.js';
import { makeFilePermanent, getFiles } from '../AudioBackend/AudioControl.js';
import { getMusicFolder } from '../bot.js';
const { djRole, ownerID } = JSON.parse(readFileSync('./config.json', 'utf-8'));

export default {
  data: new SlashCommandBuilder()
    .setName('makepermanent')
    .setDescription('Makes the current track permanent (if it isnt already)'),
  async execute(interaction, bot) {
    if (!interaction.member.voice.channel) return await interaction.reply({ content: 'You need to be in a voice channel to use this command.', ephemeral: true });
    if (!interaction.member.roles.cache.has(djRole) && interaction.user.id !== ownerID && !interaction.member.permission.has(PermissionFlagsBits.ManageGuild)) return interaction.reply({ content: 'You need a specific role to execute this command', ephemeral: true });
    console.log('Will make '+ audio +' permanent.');
    const files = getFiles();
    let filename = audio;
  
    // Check if audio has file extension
    if (!audio.includes('.')) {
      // If it doesn't, add the file extension looking inside getFiles() and check if the file exists
      const matchingFiles = files.filter(file => file.startsWith(audio));
      if (matchingFiles.length > 0) {
        filename = matchingFiles[0];
      } else {
        return await interaction.reply({ content: 'The track: \n' + audio + '\n does not exist in the playlist!', ephemeral: true });
      }
    }
  
    // Check if the file exists
    const musicFolder = getMusicFolder();
    if (!existsSync(join(musicFolder+'/', filename))) {
      return await interaction.reply({ content: 'The track: \n' + audio + '\n does not exist in the playlist!', ephemeral: true });
    }
  
    // If it does, then make the file permanent
    makeFilePermanent(filename);
    return await interaction.reply({ content: 'The track: \n' + filename + '\n has been permanently added to the playlist!', ephemeral: true });
   
  }
};
