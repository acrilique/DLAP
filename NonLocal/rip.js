import { exec } from 'child_process';
import { getFiles, getTempFiles } from '../AudioBackend/AudioControl.js';
import { writeFileSync } from 'fs';

export async function ripAudio(searchterm){

  // check the contents of /music/tmp before ripping so we can 
  // catch the filename and pass it to the player
  const prevFiles = getFiles();
  console.log("Ripping audio from Tidal");

  // sanitize searchterm
  searchterm = searchterm.replace(/[^a-zA-Z0-9 ]/g, "");
  
  let res = await execPromise("/home/llucsm/.local/bin/rip search tidal track --first '"+searchterm+"'");
  console.log(res.toString());
  
  if (res.toString().includes("No search results")){
    console.log("Searchin' on soundcloud instead...");
    res = execPromise("/home/llucsm/.local/bin/rip search soundcloud track --first '"+searchterm+"'");
  }

  if (res.toString().includes("No search results")){
    return "No results found";
  }

  console.log("Rip complete");

  const files = getFiles();
  const newTrack = files.filter(x => !prevFiles.includes(x)).toString();
  console.log("newTrack: "+newTrack);

  if(newTrack.length > 0){
    writeNewFiles(newTrack);
  }

  return newTrack;

}

function writeNewFiles(newTrack){
  const tempFiles = getTempFiles();
  tempFiles.push(newTrack);
  writeFileSync('tmp.txt', tempFiles.join('\n'));
}

function execPromise(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.warn(error);
        reject(error);
      }
      resolve(stdout? stdout : stderr);
    });
  });
}
