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
import { statSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { shufflePlaylist, orderPlaylist, setFiles, files } from './QueueSystem.js';
import { playAudio, currentTrack, updatePlaylist } from './PlayAudio.js';
import { player } from './VoiceInitialization.js';
import { join } from 'node:path';

const { shuffle, repeat, musicFolder } = JSON.parse(readFileSync('./config.json', 'utf-8'));

export const folder = musicFolder;

export function getTempFiles() {
  try {
  return readFileSync('tmp.txt', 'utf-8').split('\n');
  }
  catch (err) {
    console.log('No temporary files found.');
    return [];
  }
}

export function getFiles() {
  return readdirSync(folder).filter(item => statSync( "music/"+item ).isFile());
}

export function makeFilePermanent(file) {
  const tempFiles = getTempFiles();
  try {
    tempFiles.splice(tempFiles.indexOf(file), 1);
    writeFileSync('tmp.txt', tempFiles.join('\n'));
  } catch (err) {
    console.log('File not found in temporary files');
  }
}

export function cleanTempFiles() {
  const tempFiles = getTempFiles();
  for (let i = 0; i < tempFiles.length; i++) {
    try {
      unlinkSync(join(folder+'/', tempFiles[i]));
    } catch (err) {
      console.log(`File: ${tempFiles[i]} was probably already deleted`);
    }
  }
  try {
    unlinkSync('tmp.txt');
  } catch (err) {
    console.log('Temporary file not found');
  }
}

export let playerState;
export let isAudioStatePaused;

let totalTrack = getFiles().length;

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


export async function nextAudio(bot, interaction) {

  if (currentTrack >= totalTrack - 1) {
    return await repeatCheck(bot);
  } else {
    if (interaction !== undefined) {await interaction.reply({ content: 'Playing next track' }); }
    cleanTempFiles();
    totalTrack = files.length;
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
      cleanTempFiles();
      repeatCheck();
      totalTrack = files.length;
      isAudioStatePaused = true;
      player.stop();
      break;
  }
}
