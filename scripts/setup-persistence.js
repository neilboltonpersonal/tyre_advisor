#!/usr/bin/env node

/**
 * Setup script for persistent database storage
 * 
 * This script helps you create a GitHub Gist to store the tyre database
 * persistently across Vercel deployments.
 * 
 * Steps:
 * 1. Create a GitHub Personal Access Token with gist permissions
 * 2. Run this script to create a Gist
 * 3. Add the Gist ID and GitHub token to Vercel environment variables
 */

const https = require('https');

async function createGist(githubToken) {
  const gistData = {
    description: 'Tyre Advisor Database - Persistent storage for tyre data',
    public: false,
    files: {
      'tyre-database.json': {
        content: JSON.stringify({
          tyres: [],
          discussions: [],
          usageStats: [],
          lastSync: new Date().toISOString()
        }, null, 2)
      }
    }
  };

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(gistData);
    
    const options = {
      hostname: 'api.github.com',
      port: 443,
      path: '/gists',
      method: 'POST',
      headers: {
        'Authorization': `token ${githubToken}`,
        'User-Agent': 'Tyre-Advisor-Setup',
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 201) {
          const gist = JSON.parse(data);
          resolve(gist);
        } else {
          reject(new Error(`GitHub API error: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('🚀 Tyre Advisor Database Setup\n');
  
  const githubToken = process.argv[2];
  
  if (!githubToken) {
    console.log('❌ Please provide a GitHub Personal Access Token');
    console.log('\nUsage: node scripts/setup-persistence.js <github-token>');
    console.log('\nTo create a GitHub token:');
    console.log('1. Go to https://github.com/settings/tokens');
    console.log('2. Click "Generate new token (classic)"');
    console.log('3. Select "gist" permission');
    console.log('4. Copy the token and run this script');
    process.exit(1);
  }

  try {
    console.log('📦 Creating GitHub Gist for database storage...');
    const gist = await createGist(githubToken);
    
    console.log('✅ Gist created successfully!');
    console.log(`📋 Gist ID: ${gist.id}`);
    console.log(`🔗 Gist URL: ${gist.html_url}`);
    
    console.log('\n📝 Next steps:');
    console.log('1. Update lib/persistent-database.ts with the Gist ID:');
    console.log(`   const GIST_ID = '${gist.id}';`);
    console.log('\n2. Add environment variables to Vercel:');
    console.log(`   GITHUB_TOKEN=${githubToken}`);
    
    console.log('\n🎉 Setup complete! Your database will now persist across deployments.');
    
  } catch (error) {
    console.error('❌ Error creating Gist:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
} 