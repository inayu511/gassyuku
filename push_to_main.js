const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Pushing latest fixes directly to GitHub main branch to update production URL...');

try {
  // Use git command line directly
  const gitPath = 'C:\\Users\\24011\\AppData\\Local\\GitHubDesktop\\app-3.6.4\\resources\\app\\git\\cmd\\git.exe';
  const repoDir = 'c:\\Users\\24011\\Desktop\\サークル合宿';

  // Force add files
  execSync(`"${gitPath}" -C "${repoDir}" add .`);
  try {
    execSync(`"${gitPath}" -C "${repoDir}" commit -m "fix: updated request modal checkin/checkout date pickers"`);
  } catch (e) {
    console.log('No new changes to commit or commit created.');
  }

  // Push to main
  const output = execSync(`"${gitPath}" -C "${repoDir}" push origin main`).toString();
  console.log('Push output:', output);
  console.log('Successfully pushed to GitHub main branch!');
} catch (err) {
  console.error('Git push error details:', err.stdout ? err.stdout.toString() : err.message);
}
