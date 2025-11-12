#!/usr/bin/env node
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = join(__dirname, '..');

const adminFiles = ['config.yml', 'index.html', 'upload-adapter.js'];
const publicAdminDir = join(root, 'public', 'admin');

// Créer le dossier public/admin s'il n'existe pas
if (!existsSync(publicAdminDir)) {
  mkdirSync(publicAdminDir, { recursive: true });
}

// Copier chaque fichier
adminFiles.forEach(file => {
  const src = join(root, 'admin', file);
  const dest = join(publicAdminDir, file);

  if (existsSync(src)) {
    copyFileSync(src, dest);
    console.log(`✓ Copied ${file} to public/admin/`);
  } else {
    console.warn(`⚠ Warning: ${file} not found in admin/`);
  }
});

console.log('✓ Admin files copied successfully');
