import { getFiles, getTempFiles } from '../AudioBackend/AudioControl.js';

export function searchForTrackLocally(searchterm){
    const localFiles = getFiles();
    const match_index = lowestLevenshteinDistanceIndex(searchterm, localFiles);
    console.log("match index: "+match_index);
    if (match_index === -1) {
        return null;
    }
    return localFiles[match_index];
}

export function searchForTemporalTrack(searchterm){
    const tempFiles = getTempFiles();
    const match_index = lowestLevenshteinDistanceIndex(searchterm, tempFiles);
    if (match_index === -1) {
        return null;
    }
    return tempFiles[match_index];
}

function lowestLevenshteinDistanceIndex(searchterm, localFiles){
    let lowestDistance = Infinity;
    let lowestIndex = -1;
    for (let i = 0; i < localFiles.length; i++) {
        const distance = levenshteinDistance(searchterm, localFiles[i]);
        if (distance < lowestDistance) {
            lowestDistance = distance;
            lowestIndex = i;
        }
    }
    if (lowestDistance > searchterm.length * 0.5) {
        return -1;
    }
    return lowestIndex;
}

function levenshteinDistance(a, b) {
  const matrix = [];
   
  let i;
  for (i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  let j;
  for (j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (i = 1; i <= b.length; i++) {
    for (j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
            Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}
