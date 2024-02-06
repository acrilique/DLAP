import { execSync } from 'child_process';
import { getTempFiles } from '../AudioBackend/AudioControl.js';
import { type } from 'os';

export function ripAudio(searchterm){

  // check the contents of /music/tmp before ripping so we can 
  // catch the filename and pass it to the player
  const prevTempFiles = getTempFiles();
  console.log("Ripping audio from Tidal");

  // sanitize searchterm
  searchterm = searchterm.replace(/[^a-zA-Z0-9 ]/g, "");
  
  let res = execSync("rip search tidal track --first '"+searchterm+"'");
  console.log("Rip complete");
  console.log(res.toString());
  
  const tempFiles = getTempFiles();
  const newTrack = tempFiles.filter(x => !prevTempFiles.includes(x));

  return newTrack.toString();

}

