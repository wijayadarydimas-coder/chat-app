#!/usr/bin/env node
// scripts/add-runtime.js
// Jalankan: node scripts/add-runtime.js
// Script ini akan menambahkan `export const runtime = 'nodejs'` ke semua API routes

const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');

function getAllRouteFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      results.push(...getAllRouteFiles(filePath));
    } else if (file === 'route.js' || file === 'route.ts') {
      results.push(filePath);
    }
  }
  return results;
}

const routeFiles = getAllRouteFiles(apiDir);
let patchedCount = 0;

for (const filePath of routeFiles) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  if (content.includes("export const runtime")) {
    console.log(`⏭  Skip (already has runtime): ${filePath.replace(process.cwd(), '')}`);
    continue;
  }
  
  // Tambahkan setelah import terakhir
  // Cari posisi setelah semua baris import
  const lines = content.split('\n');
  let lastImportIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('import ') || lines[i].startsWith("const ") && lines[i].includes("require(")) {
      lastImportIndex = i;
    }
  }
  
  if (lastImportIndex === -1) {
    // Tidak ada import, tambahkan di awal
    content = `export const runtime = 'nodejs';\n\n` + content;
  } else {
    lines.splice(lastImportIndex + 1, 0, '', `export const runtime = 'nodejs';`);
    content = lines.join('\n');
  }
  
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`✅ Patched: ${filePath.replace(process.cwd(), '')}`);
  patchedCount++;
}

console.log(`\n🎉 Done! Patched ${patchedCount} route files.`);