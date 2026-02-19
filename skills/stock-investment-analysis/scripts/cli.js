#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const scriptsDir = path.join(__dirname);

const args = process.argv.slice(2);
const command = args[0];

function runPython(script, scriptArgs) {
  const python = spawn('python3', [path.join(scriptsDir, script), ...scriptArgs], {
    stdio: 'inherit'
  });
  
  python.on('error', (err) => {
    console.error('Error:', err.message);
    console.error('Please install: pip install akshare pandas');
    process.exit(1);
  });
  
  python.on('close', (code) => {
    process.exit(code || 0);
  });
}

function showHelp() {
  console.log(`
Stock Investment Analysis

Usage:
  npx stock-analysis <command> [options]

Commands:
  fetch <symbol>     Fetch stock data
  analyze <symbol>   Generate analysis report

Fetch Options:
  --type, -t        all, basic, financial, industry, valuation, reports, yearly
  --years, -y       Years for financial data (default: 5)
  --limit, -l       Number of reports (default: 5)
  --output, -o      Output JSON file

Analyze Options:
  --data, -d        Input JSON file
  --output, -o      Output report file

Examples:
  npx stock-analysis fetch 600519 --type all
  npx stock-analysis fetch 600519 --type reports -l 5
  npx stock-analysis analyze 600519 -o report.md
`);
}

if (!command || command === 'help' || command === '--help') {
  showHelp();
  process.exit(0);
}

if (command === 'fetch') {
  runPython('fetch_data.py', args.slice(1));
} else if (command === 'analyze') {
  runPython('analyze.py', args.slice(1));
} else {
  console.error(`Unknown: ${command}`);
  showHelp();
  process.exit(1);
}
