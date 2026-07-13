const fs = require('fs');
const files = [
  'd:/Projects/ERP/Mobile App/services/receipt.js',
  'd:/Projects/ERP/Mobile App/components/sales/InvoiceView.js'
];
files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/text-transform:\s*uppercase;?/gi, '');
  content = content.replace(/className=\"([^\"]*)\"/gi, (match, p1) => {
    return 'className="' + p1.replace(/\buppercase\b/g, '').replace(/\s+/g, ' ').trim() + '"';
  });
  content = content.replace(/class=\"([^\"]*)\"/gi, (match, p1) => {
    return 'class="' + p1.replace(/\buppercase\b/g, '').replace(/\s+/g, ' ').trim() + '"';
  });
  content = content.replace(/\.toUpperCase\(\)/g, '');
  fs.writeFileSync(file, content);
  console.log('Processed:', file);
});
