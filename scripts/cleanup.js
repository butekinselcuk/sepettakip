/**
 * Code cleanup utility script for SepetTakip
 * 
 * This script helps identify and optionally remove:
 * 1. Unused imports and dependencies
 * 2. Console.log statements
 * 3. TODO comments
 * 4. Test artifacts and mock data
 * 5. Unused files and components
 * 
 * Run with: node scripts/cleanup.js
 * Options:
 *   --fix      Automatically fix issues when possible
 *   --verbose  Show detailed output
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  // Directories to scan
  includeDirs: ['app', 'components', 'lib', 'pages', 'prisma', 'public', 'utils'],
  
  // File extensions to check
  extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  
  // Patterns to search for
  patterns: {
    consoleLogs: /console\.(log|warn|info|error|debug)\(/g,
    todos: /\/\/\s*TODO/g,
    mockData: /\/\/\s*MOCK DATA|MOCK_DATA|mock data|mockData/gi,
    unusedVars: /^.*?'([^']+)' is (defined but never used|declared but its value is never read).*$/gm,
    testArtifacts: /\.spec\.|\.test\.|test-utils|__tests__|__mocks__|jest|cypress/g,
    privateMethods: /private\s+\w+\(.*?\)/g
  },
  
  // Files to ignore
  ignoreFiles: [
    'node_modules',
    '.next',
    '.git',
    'package.json',
    'package-lock.json',
    'yarn.lock',
    'dist',
    'build',
    'coverage',
    'jest.config.js',
    'cypress.json',
    'tsconfig.json',
    'next.config.js',
    '.env',
    '.env.local',
    'README.md',
    'LICENSE',
    'CHANGELOG.md'
  ],
  
  // Directories to ignore
  ignoreDirs: [
    'node_modules',
    '.next',
    '.git',
    'coverage',
    'dist',
    'build'
  ]
};

// State for tracking results
const results = {
  consoleLogs: [],
  todos: [],
  mockData: [],
  unusedImports: [],
  testArtifacts: [],
  unusedFiles: [],
  unusedDependencies: []
};

/**
 * Check if a path should be ignored
 */
function shouldIgnore(itemPath) {
  const basename = path.basename(itemPath);
  
  if (CONFIG.ignoreFiles.includes(basename)) {
    return true;
  }
  
  for (const ignoreDir of CONFIG.ignoreDirs) {
    if (itemPath.includes(`/${ignoreDir}/`) || itemPath.endsWith(`/${ignoreDir}`)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get all files in a directory recursively
 */
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    
    if (shouldIgnore(filePath)) {
      continue;
    }
    
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      // Check if the file has an extension we care about
      const ext = path.extname(filePath);
      if (CONFIG.extensions.includes(ext)) {
        arrayOfFiles.push(filePath);
      }
    }
  }
  
  return arrayOfFiles;
}

/**
 * Find console.log statements
 */
function findConsoleLogs(files) {
  console.log('Scanning for console.log statements...');
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const matches = content.match(CONFIG.patterns.consoleLogs);
    
    if (matches) {
      results.consoleLogs.push({
        file,
        count: matches.length,
        matches
      });
    }
  }
}

/**
 * Find TODO comments
 */
function findTodos(files) {
  console.log('Scanning for TODO comments...');
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const matches = content.match(CONFIG.patterns.todos);
    
    if (matches) {
      results.todos.push({
        file,
        count: matches.length,
        matches
      });
    }
  }
}

/**
 * Find mock data
 */
function findMockData(files) {
  console.log('Scanning for mock data...');
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const matches = content.match(CONFIG.patterns.mockData);
    
    if (matches) {
      results.mockData.push({
        file,
        count: matches.length,
        matches
      });
    }
  }
}

/**
 * Find test artifacts
 */
function findTestArtifacts(files) {
  console.log('Scanning for test artifacts...');
  
  for (const file of files) {
    if (CONFIG.patterns.testArtifacts.test(file)) {
      results.testArtifacts.push(file);
    }
  }
}

/**
 * Find unused files by checking imports
 */
function findUnusedFiles(files) {
  console.log('Analyzing for potentially unused files...');
  
  // Extract base name without extension from each file
  const allFiles = files.map(file => {
    const baseName = path.basename(file);
    const nameWithoutExt = baseName.split('.').slice(0, -1).join('.');
    return {
      path: file,
      name: nameWithoutExt
    };
  });
  
  // For each file, check if it's imported anywhere
  for (const file of allFiles) {
    // Skip index files and pages (they're entry points)
    if (file.name === 'index' || file.path.includes('/pages/') || file.path.includes('/app/')) {
      continue;
    }
    
    // Skip files that start with underscore (often utility files)
    if (file.name.startsWith('_')) {
      continue;
    }
    
    let isImported = false;
    
    // Check if the file is imported in any other file
    for (const otherFile of files) {
      if (otherFile === file.path) continue;
      
      const content = fs.readFileSync(otherFile, 'utf8');
      
      // Check for various import patterns
      const importPatterns = [
        `import ${file.name}`,
        `import { ${file.name}`,
        `from '${file.name}'`,
        `from "./${file.name}"`,
        `from '../${file.name}'`,
        `require('${file.name}')`,
        `require("./${file.name}")`,
        `dynamic('${file.name}')`,
        `dynamic(()`,
        `"component": "${file.name}"`,
        `component: "${file.name}"`,
        `component: '${file.name}'`
      ];
      
      for (const pattern of importPatterns) {
        if (content.includes(pattern)) {
          isImported = true;
          break;
        }
      }
      
      if (isImported) break;
    }
    
    if (!isImported) {
      results.unusedFiles.push(file.path);
    }
  }
}

/**
 * Find unused dependencies in package.json
 */
function findUnusedDependencies() {
  console.log('Checking for unused npm packages...');
  
  try {
    // Check if we have depcheck installed
    try {
      execSync('npx depcheck --version', { stdio: 'ignore' });
    } catch (e) {
      console.log('Installing depcheck...');
      execSync('npm install -g depcheck', { stdio: 'ignore' });
    }
    
    // Run depcheck
    const output = execSync('npx depcheck --json', { encoding: 'utf8' });
    const depcheckResults = JSON.parse(output);
    
    if (depcheckResults.dependencies) {
      results.unusedDependencies = Object.keys(depcheckResults.dependencies);
    }
  } catch (error) {
    console.error('Error checking unused dependencies:', error.message);
  }
}

/**
 * Check for unused imports using TypeScript compiler
 */
function findUnusedImports() {
  console.log('Analyzing TypeScript files for unused imports...');
  
  try {
    // Run TypeScript compiler with the --noEmit flag to just check for errors
    const output = execSync('npx tsc --noEmit', { encoding: 'utf8', stdio: 'pipe' });
    
    // Parse the output to find unused import statements
    const lines = output.split('\n');
    
    for (const line of lines) {
      if (line.includes("is defined but never used") || line.includes("is declared but its value is never read")) {
        const match = line.match(/^(.*?)\(\d+,\d+\):(.*?)$/);
        if (match) {
          results.unusedImports.push({
            file: match[1].trim(),
            message: match[2].trim()
          });
        }
      }
    }
  } catch (error) {
    // The command will fail if there are TypeScript errors, but that's fine
    // We're just looking for the output
    if (error.stdout) {
      const lines = error.stdout.toString().split('\n');
      
      for (const line of lines) {
        if (line.includes("is defined but never used") || line.includes("is declared but its value is never read")) {
          const match = line.match(/^(.*?)\(\d+,\d+\):(.*?)$/);
          if (match) {
            results.unusedImports.push({
              file: match[1].trim(),
              message: match[2].trim()
            });
          }
        }
      }
    }
  }
}

/**
 * Fix console.log statements
 */
function fixConsoleLogs(dryRun = true) {
  console.log(`${dryRun ? '[DRY RUN] ' : ''}Fixing console.log statements...`);
  
  for (const item of results.consoleLogs) {
    const content = fs.readFileSync(item.file, 'utf8');
    
    // Replace with logger calls
    const newContent = content.replace(
      CONFIG.patterns.consoleLogs,
      (match) => {
        const level = match.includes('log') ? 'debug' : 
                      match.includes('warn') ? 'warn' : 
                      match.includes('error') ? 'error' : 'info';
        
        return `log.${level}`;
      }
    );
    
    if (!dryRun && content !== newContent) {
      fs.writeFileSync(item.file, newContent, 'utf8');
      console.log(`  Fixed console statements in ${item.file}`);
    }
  }
}

/**
 * Display the results
 */
function displayResults() {
  console.log('\n----- CLEANUP REPORT -----\n');
  
  console.log(`Found ${results.consoleLogs.length} files with console statements`);
  if (results.consoleLogs.length > 0) {
    console.log('  Files with console statements:');
    for (const item of results.consoleLogs) {
      console.log(`  - ${item.file} (${item.count} occurrences)`);
    }
    console.log('');
  }
  
  console.log(`Found ${results.todos.length} files with TODO comments`);
  if (results.todos.length > 0) {
    console.log('  Files with TODO comments:');
    for (const item of results.todos) {
      console.log(`  - ${item.file} (${item.count} occurrences)`);
    }
    console.log('');
  }
  
  console.log(`Found ${results.mockData.length} files with mock data`);
  if (results.mockData.length > 0) {
    console.log('  Files with mock data:');
    for (const item of results.mockData) {
      console.log(`  - ${item.file}`);
    }
    console.log('');
  }
  
  console.log(`Found ${results.testArtifacts.length} test artifact files`);
  if (results.testArtifacts.length > 0) {
    console.log('  Test artifact files:');
    for (const file of results.testArtifacts) {
      console.log(`  - ${file}`);
    }
    console.log('');
  }
  
  console.log(`Found ${results.unusedImports.length} unused imports`);
  if (results.unusedImports.length > 0) {
    console.log('  Unused imports:');
    for (const item of results.unusedImports.slice(0, 10)) {
      console.log(`  - ${item.file}: ${item.message}`);
    }
    if (results.unusedImports.length > 10) {
      console.log(`  ... and ${results.unusedImports.length - 10} more`);
    }
    console.log('');
  }
  
  console.log(`Found ${results.unusedFiles.length} potentially unused files`);
  if (results.unusedFiles.length > 0) {
    console.log('  Potentially unused files:');
    for (const file of results.unusedFiles) {
      console.log(`  - ${file}`);
    }
    console.log('');
  }
  
  console.log(`Found ${results.unusedDependencies.length} unused npm dependencies`);
  if (results.unusedDependencies.length > 0) {
    console.log('  Unused dependencies:');
    for (const dep of results.unusedDependencies) {
      console.log(`  - ${dep}`);
    }
    console.log('');
  }
  
  console.log('Cleanup recommendations:');
  console.log(' 1. Replace console.log statements with proper logging');
  console.log(' 2. Address TODO comments before final release');
  console.log(' 3. Remove mock data and replace with real data sources');
  console.log(' 4. Review and remove test artifacts if not needed');
  console.log(' 5. Clean up unused imports for better code quality');
  console.log(' 6. Verify and remove unused files and dependencies if not needed');
  
  console.log('\n--------------------------\n');
}

/**
 * Main function
 */
function main() {
  console.log('Starting code cleanup analysis...');
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const shouldFix = args.includes('--fix');
  const verbose = args.includes('--verbose');
  
  // Get all files to analyze
  let allFiles = [];
  for (const dir of CONFIG.includeDirs) {
    if (fs.existsSync(dir)) {
      allFiles = allFiles.concat(getAllFiles(dir));
    }
  }
  
  console.log(`Found ${allFiles.length} files to analyze`);
  
  // Run analysis
  findConsoleLogs(allFiles);
  findTodos(allFiles);
  findMockData(allFiles);
  findTestArtifacts(allFiles);
  findUnusedFiles(allFiles);
  findUnusedImports();
  findUnusedDependencies();
  
  // Display results
  displayResults();
  
  // Fix issues if requested
  if (shouldFix) {
    fixConsoleLogs(false);
  }
  
  console.log('Analysis complete!');
}

// Run the script
main(); 