import { execSync } from 'child_process';
import { getFiles, getTempFiles } from '../AudioBackend/AudioControl.js';
import { writeFileSync } from 'fs';

export async function ripAudio(searchterm){

  // check the contents of /music/tmp before ripping so we can 
  // catch the filename and pass it to the player
  const prevFiles = getFiles();
  console.log("Ripping audio from Tidal");

  // sanitize searchterm
  searchterm = searchterm.replace(/[^a-zA-Z0-9 ]/g, "");
  
  let res = execSync("rip search tidal track --first '"+searchterm+"'");
  console.log(res.toString());
  console.log("Rip complete");
  
  if (res.toString().includes("No search results")){
    console.log("Searchin' on soundcloud instead...");
    res = execSync("rip search soundcloud track --first '"+searchterm+"'");
  }

  if (res.toString().includes("No search results")){
    return "No results found";
  }
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