const fs = require('fs');
const path = require('path');

function getImports(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getImports(fullPath, fileList);
    } else if (/\.(tsx?|jsx?)$/.test(file)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const importRegex = /(?:import\s+(?:[\w*\s{},]*\s+from\s+)?['"]([^'"]+)['"]|require\(['"]([^'"]+)['"]\))/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        const pkg = match[1] || match[2];
        if (!pkg.startsWith('.') && !pkg.startsWith('/')) {
          const parts = pkg.split('/');
          const name = pkg.startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];
          fileList.push({ name, file: fullPath });
        }
      }
    }
  }
  return fileList;
}

function analyzePackage(pkgDir) {
  const pkgJsonPath = path.join(pkgDir, 'package.json');
  if (!fs.existsSync(pkgJsonPath)) return;
  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
  const srcDir = path.join(pkgDir, 'src');
  if (!fs.existsSync(srcDir)) return;

  const imports = getImports(srcDir);
  const usedPkgs = new Set(imports.map(i => i.name));
  
  const declaredDeps = Object.keys(pkgJson.dependencies || {});
  const declaredDevDeps = Object.keys(pkgJson.devDependencies || {});
  const allDeclared = new Set([...declaredDeps, ...declaredDevDeps, 'react/jsx-runtime']);

  const missing = [];
  for (const used of usedPkgs) {
    if (!allDeclared.has(used)) {
      missing.push(used);
    }
  }

  const unusedDeps = declaredDeps.filter(d => !usedPkgs.has(d));

  console.log(`\n======================================================`);
  console.log(`Package: ${pkgJson.name} (${pkgDir})`);
  console.log(`======================================================`);
  console.log(`Used packages count: ${usedPkgs.size}`);
  console.log(`Used:`, Array.from(usedPkgs).join(', '));
  console.log(`\nMissing dependencies (imported in code but not in package.json):`);
  console.log(missing.length ? missing.join(', ') : 'None! (All imports are declared)');
  console.log(`\nUnused production dependencies (declared in package.json dependencies but not directly imported in src):`);
  console.log(unusedDeps.length ? unusedDeps.join(', ') : 'None');
}

analyzePackage(path.resolve(__dirname, '../packages/admin-web'));
analyzePackage(path.resolve(__dirname, '../packages/customer-provider-mobile'));
analyzePackage(path.resolve(__dirname, '../packages/backend-api'));
