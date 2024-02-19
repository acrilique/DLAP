/**************************************************************************
 *
 *  DLAP Bot: A Discord bot that plays local audio tracks.
 *  (C) Copyright 2022
 *  Programmed by Andrew Lee
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ***************************************************************************/

import { SlashCommandBuilder } from 'discord.js';
import { inputAudio } from '../AudioBackend/QueueSystem.js';
import { getFiles, isAudioStatePaused, toggleAudioState } from '../AudioBackend/AudioControl.js';
import { audio, playAudio, setAudioFile, updatePlaylist } from '../AudioBackend/PlayAudio.js';
import { PermissionFlagsBits } from 'discord-api-types/v10';
import { readFileSync, unlinkSync } from 'node:fs';
import { votes } from '../Utilities/Voting.js';
import { searchForTrackLocally } from '../Utilities/SearchUtil.js';
import { ripAudio } from '../NonLocal/rip.js';
import { voiceInit } from '../AudioBackend/VoiceInitialization.js';

const { djRole, ownerID, statusChannel } = JSON.parse(readFileSync('./config.json', 'utf-8'));

export let integer;
export let search_term;

export default {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Resumes music')
    .addSubcommand(subcommand =>
      subcommand
        .setName('search')
        .setDescription('Search for a music track')
        .addStringOption(option =>
          option.setName('search_term')
            .setDescription('Input a search term for the music.')
        )
    )
    .addIntegerOption(option =>
      option.setName('int')
        .setDescription('Input a number for the selection for the audio file.')
    ),

  async execute(interaction, bot) {
    const channel = interaction.member.voice.channel;
    if (!channel) return await interaction.reply({ content: 'You need to be in a voice channel to use this command.', ephemeral: true });
    // if (!interaction.member.roles.cache.has(djRole) && interaction.user.id !== ownerID && !interaction.member.permission.has(PermissionFlagsBits.ManageGuild)) return interaction.reply({ content: 'You need a specific role to execute this command', ephemeral: true });
    await voiceInit(bot, channel.id);

    integer = interaction.options.getInteger('int') ?? null;
    search_term = interaction.options.getString('search_term') ?? null;
    if (integer !== null) {
      if (search_term !== null) {
        // write in the discord text channel (without doing interaction.reply, i want to be able to do that later): priority given to choice of a local track. Not searching for online track.
        try {
          bot.on('ready', () => {
            const channel = bot.channels.fetch(statusChannel).then(channel => {
              channel.send(`Priority given to choice of a local track. Not searching for online track.`);
            });
          });
        } catch (e) {
          console.log('Could not send message to status channel')
          console.log(e);
        }
      }
      if (integer < getFiles().length) {
        await inputAudio(bot, integer);
        await votes.clear();
        return await interaction.reply({ content: `Now playing: ${audio}`, ephemeral: true });
      } else {
        return await interaction.reply({ content: 'Number is too big, choose a number that\'s less than ' + getFiles().length + '.', ephemeral: true });
      }
    }
    else if (search_term !== null) {
      let match = searchForTrackLocally(search_term);
      if (match === null) {
        await interaction.reply({ content: 'Ripping audio from Tidal', ephemeral: true });
        const rip = await ripAudio(search_term);
        if (rip === "No results found"){
          try {
            await interaction.reply({ content: 'No results found', ephemeral: true });
          } 
          catch (e) {
            console.log(e);
          }
          updatePlaylist('next');
          return;
        }
        setAudioFile(rip);
      } else {
        setAudioFile(match);
        await interaction.reply({ content: `Now playing: ${audio}`, ephemeral: true });
      }
      
      await playAudio(bot);
      await votes.clear();
      return;
    }

    // if there is text in the interaction (even if options are empty), then try ripping audio from Tidal
    
    
    if (isAudioStatePaused) {
      toggleAudioState();
      return await interaction.reply({ content: 'Resuming music', ephemeral: true });
    } else {
      return await interaction.reply({ content: 'Music is already playing', ephemeral: true });
    }
  }
};
