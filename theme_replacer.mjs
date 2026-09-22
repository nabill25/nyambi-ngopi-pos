import fs from 'fs';
import path from 'path';

function walkSync(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkSync(fullPath, callback);
    } else {
      callback(fullPath);
    }
  }
}

let modifiedCount = 0;
const targetDir = 'C:\\Users\\hp\\.gemini\\antigravity-ide\\scratch\\nyambi-ngopi-pos\\src';

walkSync(targetDir, (filePath) => {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;

  const originalContent = fs.readFileSync(filePath, 'utf-8');
  let content = originalContent;

  // Step 1: Replace background and surface colors
  content = content.replace(/bg-surface-2/g, 'bg-white');
  content = content.replace(/bg-surface/g, 'bg-slate-50');
  content = content.replace(/bg-background/g, 'bg-slate-100');
  content = content.replace(/bg-white\/5/g, 'bg-white');
  content = content.replace(/bg-white\/10/g, 'bg-slate-50');
  content = content.replace(/bg-white\/20/g, 'bg-slate-100');

  // Step 2: Replace border colors
  content = content.replace(/border-white\/5/g, 'border-slate-100');
  content = content.replace(/border-white\/10/g, 'border-slate-200');
  content = content.replace(/border-white\/20/g, 'border-slate-300');

  // Step 3: Replace faded text colors
  content = content.replace(/text-white\/20/g, 'text-slate-400');
  content = content.replace(/text-white\/30/g, 'text-slate-400');
  content = content.replace(/text-white\/40/g, 'text-slate-500');
  content = content.replace(/text-white\/50/g, 'text-slate-500');
  content = content.replace(/text-white\/60/g, 'text-slate-600');
  content = content.replace(/text-white\/70/g, 'text-slate-700');
  content = content.replace(/placeholder-white\/20/g, 'placeholder-slate-400');
  content = content.replace(/placeholder-white\/30/g, 'placeholder-slate-400');

  // Step 4: Replace pure white text with dark text
  content = content.replace(/text-white(?!\/)/g, 'text-slate-800');

  // Step 5: Replace primary color amber -> emerald
  content = content.replace(/amber/g, 'emerald');

  // Step 6: Fix buttons and badges where text should remain white because the background is colored
  content = content.replace(/(className=|className\(\{.*?\}|cn\()([\s\S]*?)(?=\)|\}|\n)/g, (match, prefix, innerClasses) => {
    let newInner = innerClasses;
    // If the class string contains a strong colored background
    if (newInner.match(/bg-(emerald|red|blue|green|orange)-(400|500|600)/)) {
      newInner = newInner.replace(/text-slate-800/g, 'text-white');
      newInner = newInner.replace(/text-slate-\d00/g, 'text-white/90');
    }
    return prefix + newInner;
  });

  // Small fixes for Login Page background
  if (filePath.includes('LoginPage')) {
    content = content.replace(/bg-emerald-500\/10/g, 'bg-emerald-100');
    content = content.replace(/bg-orange-500\/10/g, 'bg-emerald-50');
    content = content.replace(/bg-emerald-500\/3/g, 'bg-white');
  }

  // Small fixes for Recharts grids which had stroke="rgba(255,255,255,0.05)"
  content = content.replace(/rgba\(255,255,255,0\.05\)/g, '#f1f5f9');
  content = content.replace(/rgba\(255,255,255,0\.4\)/g, '#64748b');
  content = content.replace(/rgba\(255,255,255,0\.03\)/g, '#f8fafc');

  // Recharts tooltip text color fix
  content = content.replace(/color: '#fff'/g, "color: '#1e293b'");
  content = content.replace(/background: '#1e1e2e'/g, "background: '#ffffff'");

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    modifiedCount++;
  }
});

console.log(`Successfully updated ${modifiedCount} files in src/`);
