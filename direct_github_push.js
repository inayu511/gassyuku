const fs = require('fs');
const path = require('path');
const https = require('https');

const projectDir = 'c:\\Users\\24011\\Desktop\\サークル合宿';

// Local files to compare & ensure uploaded with correct paths
console.log('Verifying local code state for deployment...');

const filesToUpload = [
  'app/page.tsx',
  'app/layout.tsx',
  'app/globals.css',
  'app/api/notify/route.ts',
  'components/Header.tsx',
  'components/AccommodationCard.tsx',
  'components/AccommodationDetail.tsx',
  'components/RequestModal.tsx',
  'components/SearchFilter.tsx',
  'components/LiffProvider.tsx',
  'lib/supabase.ts',
  'lib/liff.ts',
  'lib/mockData.ts',
  'types/index.ts',
  'next.config.js',
  'package.json',
  'tsconfig.json',
  'tailwind.config.ts',
  'postcss.config.mjs',
  'vercel.json',
  'supabase_schema.sql',
  '.gitignore',
  '.env.example'
];

let missing = [];
filesToUpload.forEach(f => {
  const fullPath = path.join(projectDir, f);
  if (!fs.existsSync(fullPath)) {
    missing.push(f);
  }
});

if (missing.length === 0) {
  console.log('All 23 core files verified locally.');
} else {
  console.warn('Missing local files:', missing);
}
