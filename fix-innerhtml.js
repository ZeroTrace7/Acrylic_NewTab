const fs = require('fs');
const path = require('path');

const rootDir = 'C:/Users/HP/IdeaProjects/Acrylic';

function getUtilsPath(filePath) {
    const relative = path.relative(path.dirname(filePath), path.join(rootDir, 'modules', 'utils.js'));
    return relative.replace(/\\/g, '/').replace(/^([^\.])/, './$1');
}

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    let modified = false;

    function replacer(match, p1, p2) {
        if (p2 === "''" || p2 === '""' || p2 === '``') {
            return `${p1}.textContent = '';`;
        }
        if (p2.includes('<') || p2.includes('`') || p2.includes('SVG') || p2.includes('iconData') || p2.includes('GLOBE')) {
            modified = true;
            return `safeInject(${p1}, ${p2});`;
        } else {
            return `${p1}.textContent = ${p2};`;
        }
    }

    // Match backtick strings
    content = content.replace(/([a-zA-Z0-9_\.\-]+(?:\[.*?\])?)\.innerHTML\s*=\s*(`[\s\S]*?`);/g, replacer);
    // Match single quote strings
    content = content.replace(/([a-zA-Z0-9_\.\-]+(?:\[.*?\])?)\.innerHTML\s*=\s*('[\s\S]*?');/g, replacer);
    // Match double quote strings
    content = content.replace(/([a-zA-Z0-9_\.\-]+(?:\[.*?\])?)\.innerHTML\s*=\s*("[\s\S]*?");/g, replacer);
    // Match plain variables / expressions (e.g. iconData, or isAssistant ? A : B)
    content = content.replace(/([a-zA-Z0-9_\.\-]+(?:\[.*?\])?)\.innerHTML\s*=\s*([^;'"`]+?);/g, replacer);

    if (modified && !content.includes('safeInject')) {
        const utilsPath = getUtilsPath(filePath);
        const importStmt = `import { safeInject } from '${utilsPath}';\n`;
        content = importStmt + content;
    } else if (original !== content && content.includes('safeInject') && !original.includes('safeInject')) {
        const utilsPath = getUtilsPath(filePath);
        const importStmt = `import { safeInject } from '${utilsPath}';\n`;
        content = importStmt + content;
    }

    if (original !== content) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed ' + filePath);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file === 'node_modules' || file === '.git' || file === 'archive' || file === 'src') continue;
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.js') && file !== 'utils.js' && file !== 'fix-innerhtml.js') {
            processFile(fullPath);
        }
    }
}

walkDir(rootDir);
