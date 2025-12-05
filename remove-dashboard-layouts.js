#!/usr/bin/env node

/**
 * Script to remove DashboardLayout from pages inside (dashboard) folder
 * These pages should only render content - the layout is inherited from (dashboard)/layout.tsx
 */

const fs = require('fs');
const path = require('path');

const pagesToFix = [
    'src/app/(dashboard)/customers/page.tsx',
    'src/app/(dashboard)/expenses/page.tsx',
    'src/app/(dashboard)/sales/page.tsx',
    'src/app/(dashboard)/products/[id]/page.tsx',
    'src/app/(dashboard)/inventory/page.tsx',
    'src/app/(dashboard)/inventory/transferencias/page.tsx',
    'src/app/(dashboard)/products/page.tsx',
    'src/app/(dashboard)/products/nuevo/page.tsx',
    'src/app/(dashboard)/reports/page.tsx',
    'src/app/(dashboard)/reports/ventas/page.tsx',
    'src/app/(dashboard)/admin/catalog/page.tsx',
    'src/app/(dashboard)/settings/page.tsx',
];

function removeDashboardLayout(filePath) {
    console.log(`Processing: ${filePath}`);

    const fullPath = path.join(process.cwd(), filePath);

    if (!fs.existsSync(fullPath)) {
        console.log(`  ⚠️  File not found: ${filePath}`);
        return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');

    // Remove DashboardLayout import
    content = content.replace(/import DashboardLayout from ['"]@\/components\/templates\/DashboardLayout['"];?\n/g, '');

    // Remove other potentially unused imports (useAuthStore, useRouter if only used for layout)
    // We'll be conservative and only remove if they're clearly only for the layout

    // Find and extract the return statement content (what's inside <DashboardLayout>...</DashboardLayout>)
    const dashboardLayoutMatch = content.match(/<DashboardLayout[^>]*>([\s\S]*)<\/DashboardLayout>/);

    if (dashboardLayoutMatch) {
        const innerContent = dashboardLayoutMatch[1];

        // Replace the entire return statement
        content = content.replace(
            /return \(\s*<DashboardLayout[\s\S]*?<\/DashboardLayout>\s*\);/,
            `return (${innerContent});`
        );

        console.log(`  ✅ Removed DashboardLayout wrapper`);
    } else {
        console.log(`  ℹ️  No DashboardLayout wrapper found`);
    }

    // Write back
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`  💾 Saved\n`);
}

console.log('🚀 Removing DashboardLayout from pages...\n');

pagesToFix.forEach(removeDashboardLayout);

console.log('✨ Done!');
