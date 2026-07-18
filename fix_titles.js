const fs = require('fs');
const glob = require('glob');
const files = glob.sync('d:/Projects/ERP/Mobile App/components/**/*.js');
let changedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Replace <h2 ...> with <Drawer.Title ...> and </h2> with </Drawer.Title> inside Drawer components.
  content = content.replace(/<h2 className="text-xl([^>]*?)>(.*?)<\/h2>/gs, '<Drawer.Title className="text-xl$1>$2</Drawer.Title>');
  content = content.replace(/<h2 className="text-lg([^>]*?)>(.*?)<\/h2>/gs, '<Drawer.Title className="text-lg$1>$2</Drawer.Title>');
  
  // Update import if needed. We don't need to actually, because Drawer is already imported from 'vaul' 
  // and Drawer.Title is a property of Drawer. So it works automatically!

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log('Updated', file);
    changedCount++;
  }
}
console.log('Total changed:', changedCount);
