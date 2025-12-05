#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const filesToFix = [
    'src/app/(dashboard)/expenses/page.tsx',
    'src/app/(dashboard)/products/[id]/page.tsx',
    'src/app/(dashboard)/products/nuevo/page.tsx',
    'src/app/(dashboard)/reports/page.tsx',
    'src/app/(dashboard)/reports/ventas/page.tsx',
];

function fixFile(filePath) {
    console.log(`Fixing: ${filePath}`);
    const fullPath = path.join(process.cwd(), filePath);

    if (!fs.existsSync(fullPath)) {
        console.log(`  File not found`);
        return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');

    // Fix the malformed return statement
    // Match: return ( console.log... and everything until the closing );
    const badReturn = /return \( console\.log\('Logging out\.\.\.'\)\}[\s\S]*?sidebarItems=\{[\s\S]*?\]\}\s*>\s*/;

    if (badReturn.test(content)) {
        content = content.replace(badReturn, 'return (\n    ');
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`  ✅ Fixed`);
    } else {
        console.log(`  ℹ️  No issue found`);
    }
}

filesToFix.forEach(fixFile);
console.log('✅ Done');
