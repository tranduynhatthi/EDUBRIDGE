// Minimal syntax check. Requires `typescript` installed (`npm install` first).
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..', 'src');
function collect(dir) {
  return fs.readdirSync(dir, {withFileTypes:true}).flatMap(d=>d.isDirectory()?collect(path.join(dir,d.name)):(/\.tsx?$/.test(d.name)?[path.join(dir,d.name)]:[]));
}
let errors=0;
for(const file of collect(root)){
  const res=ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,reportDiagnostics:true,compilerOptions:{jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}});
  for(const d of (res.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error)){
    console.error(path.relative(root,file),ts.flattenDiagnosticMessageText(d.messageText,'\n'));errors++;
  }
}
console.log(`Checked ${collect(root).length} TS/TSX files. Syntax errors: ${errors}`);
process.exitCode=errors?1:0;
