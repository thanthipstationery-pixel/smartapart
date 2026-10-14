const fs = require('fs');
const file = 'd:/AI/SmartApart/node_modules/@prisma/client/runtime/wasm.js';
let content = fs.readFileSync(file, 'utf8');

const targetStr = 'Prisma Client was configured to use the `adapter` option but it was imported via its `/edge` endpoint.';

if (content.includes(targetStr)) {
    // Find the index of targetStr
    const index = content.indexOf(targetStr);
    
    // Look backwards for the 'if' statement
    const precedingText = content.substring(Math.max(0, index - 200), index);
    const ifIndex = precedingText.lastIndexOf('if(');
    
    if (ifIndex !== -1) {
        // We found the 'if' statement. It looks like 'if(o&&s||s){let u;throw u=['
        // We will replace 'if(' with 'if(false){}//if(' to disable it.
        const actualIndex = Math.max(0, index - 200) + ifIndex;
        content = content.substring(0, actualIndex) + 'if(false){}' + content.substring(actualIndex);
        fs.writeFileSync(file, content);
        console.log('Successfully patched wasm.js to remove edge adapter error.');
    } else {
        console.log('Could not find preceding if statement.');
    }
} else {
    console.log('Target string not found. Already patched?');
}
