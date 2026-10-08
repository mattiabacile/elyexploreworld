// Scoped compatibility patch for the vendored Sveltia CMS 0.229.0 bundle.
// Reapply after replacing the bundle. Fail closed if upstream code has changed.
const fs = require('node:fs'), path = require('node:path');
const target = path.join(__dirname, 'sveltia-cms.js');
let source = fs.readFileSync(target, 'utf8');
const patches = [
  [
    "N0=({fileName:e,originalEntry:t})=>e??t?.slug??``",
    "N0=e=>window.elyDraftBackup?.key(e)??e.fileName??e.originalEntry?.slug??``"
  ],
  [
    "P0=({originalEntry:e})=>e?.arrayIndex!==void 0",
    "P0=e=>e.originalEntry?.arrayIndex!==void 0&&!window.elyDraftBackup?.supports(e)"
  ],
  [
    "if(!(QL.useDraftBackup??!0)||!e.interacted||LZ(e)||P0(e))return",
    "if(!(window.elyDraftBackup?.supports(e)||(QL.useDraftBackup??!0))||!e.interacted||LZ(e)||P0(e))return"
  ],
  [
    "if(!(QL.useDraftBackup??!0)||LZ(e)||P0(e))return",
    "if(!(window.elyDraftBackup?.supports(e)||(QL.useDraftBackup??!0))||LZ(e)||P0(e))return"
  ],
  [
    "UPe=e=>{globalThis.clearTimeout(E0),e&&D0&&(E0=globalThis.setTimeout(()=>{LPe(e)},500))}",
    "UPe=e=>{globalThis.clearTimeout(E0);if(!e||window.elyDraftBackup?.supports(e)){if(e&&!D0){let t=OV.current?.repository?.databaseName;if(t)D0=new YD(t,`draft-backups`,{keyPath:[`collectionName`,`slug`]})}window.elyDraftBackup?.schedule(e,e&&D0?()=>LPe(e):null,e?QZ(e):!1);return}e&&D0&&(E0=globalThis.setTimeout(()=>{LPe(e)},500))}"
  ],
  [
    "M0=async(e,t=``)=>{let n=await D0?.get([e,t]);",
    "M0=async(e,t=``)=>{if(!D0){let n=OV.current?.repository?.databaseName;if(n)D0=new YD(n,`draft-backups`,{keyPath:[`collectionName`,`slug`]})}let n=await D0?.get([e,t]);"
  ]
];
for (const [before, after] of patches) {
  if (source.includes(after)) continue;
  if (source.split(before).length !== 2) throw new Error('Sveltia draft patch no longer matches. Review the upstream backup implementation before updating.');
  source = source.replace(before, after);
}
fs.writeFileSync(target, source);
console.log('Sveltia article draft compatibility patch applied.');
