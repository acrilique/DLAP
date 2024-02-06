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
import { statSync, readdirSync, readFileSync, unlinkSync } from 'node:fs';
import { shufflePlaylist, orderPlaylist, setFiles, files } from './QueueSystem.js';
import { playAudio, currentTrack, updatePlaylist, audio } from './PlayAudio.js';
import { player } from './VoiceInitialization.js';
import { join } from 'node:path';

const { shuffle, repeat } = JSON.parse(readFileSync('./config.json', 'utf-8'));

export let tempbool = false;

export function setTempBool(bool) {
  tempbool = bool;
  setFiles();
}

export function getTempFiles() {
  return readdirSync('music/tmp').filter(item => statSync( "music/tmp/"+item ).isFile());
}

export function getLocalFiles() {
  return readdirSync('music').filter(item => statSync( "music/"+item ).isFile());
}

export function getFiles() {
  try {
    const files = tempbool ? getTempFiles() : getLocalFiles();
    return files;
  } catch (err) {
    return getLocalFiles();
  }
}

export let playerState;
export let isAudioStatePaused;

let totalTrack = getLocalFiles().length;

async function repeatCheck(bot) {
  if (repeat) {
    console.log('All beats in the playlist has finished, repeating beats...');
    totalTrack = files.length;
    return (shuffle) ? await shufflePlaylist(bot) : await orderPlaylist(bot);
  } else {
    console.log('All beats in the playlist has finished.');
    updatePlaylist('stop');
    audioState(2);
  }
}

function deleteFile(filePath) {
  try {
    unlinkSync(filePath);
    console.log(`Deleted file: ${filePath}`);
  } catch (err) {
    console.error(`Error deleting file: ${filePath}`, err);
  }
}

export async function nextAudio(bot, interaction) {
  if (tempbool === true) {
    const files = getTempFiles();
    const filesToDelete = files.filter(file => file.startsWith(audio));

    for (const file of filesToDelete) {
      unlinkSync(join('music/tmp', file));
    }
  }
  if (readdirSync('music/tmp').length === 0) {
    tempbool = false;
  }
  if (currentTrack >= totalTrack - 1) {
    return await repeatCheck(bot);
  } else {
    if (interaction !== undefined) {await interaction.reply({ content: 'Playing next track' }); }
    updatePlaylist('next');
    return await playAudio(bot);
  }
}

export async function previousAudio(bot, interaction) {
  if (currentTrack <= 0) {
    return await interaction.reply({ content: 'You are at the beginning of the playlist, cannot go further than this', ephemeral: true });
  } else {
    await interaction.reply({ content: 'Playing previous track' });
    player.stop();
    updatePlaylist('back');
    return await playAudio(bot);
  }
}

export function toggleAudioState() {
  if (isAudioStatePaused) {
    audioState(0);
  } else {
    audioState(1);
  }
}

export function audioState(state) {
  switch (state) {
    case 0:
      playerState = 'Playing';
      isAudioStatePaused = false;
      player.unpause();
      break;
    case 1:
      playerState = 'Paused';
      isAudioStatePaused = true;
      player.pause();
      break;
    case 2:
      playerState = 'Stopped';
      for (let i = 0; i < getTempFiles().length; i++) {
        deleteFile('music/tmp/' + getTempFiles()[i]);
      }
      totalTrack = files.length;
      isAudioStatePaused = true;
      player.stop();
      break;
  }
}
