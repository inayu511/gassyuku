const fs = require('fs');
const path = require('path');
const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');

const projectDir = 'c:\\Users\\24011\\Desktop\\サークル合宿';

async function autoPush() {
  try {
    console.log('Starting automated git push...');
    
    // Stage all necessary files
    const ignorePatterns = ['.git', 'node_modules', '.next', '.env.local', 'auto_deploy_github.js', '.vercel', 'git_commit.js', 'git_final_push.js', 'git_force_dynamic_commit.js'];

    function getAllFiles(dirPath, arrayOfFiles = []) {
      const files = fs.readdirSync(dirPath);
      files.forEach((file) => {
        if (ignorePatterns.includes(file)) return;
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
          arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
        } else {
          const relPath = path.relative(projectDir, fullPath).replace(/\\/g, '/');
          arrayOfFiles.push(relPath);
        }
      });
      return arrayOfFiles;
    }

    const filesToAdd = getAllFiles(projectDir);
    console.log(`Staging ${filesToAdd.length} files...`);

    for (const filepath of filesToAdd) {
      await git.add({ fs, dir: projectDir, filepath });
    }

    const sha = await git.commit({
      fs,
      dir: projectDir,
      author: {
        name: 'inayu511',
        email: 'inayu511@users.noreply.github.com',
      },
      message: 'feat: full automated deployment of circle resort catalog application',
    });

    console.log('Committed successfully. SHA:', sha);
  } catch (err) {
    console.error('Auto push error:', err);
  }
}

autoPush();
