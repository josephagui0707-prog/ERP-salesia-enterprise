const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const elements = new Map();
const get = key => {
  if(!elements.has(key)) elements.set(key,{innerHTML:'',textContent:'',classList:{add(){},remove(){}},showModal(){},closeModal(){}});
  return elements.get(key);
};
const sandbox={
  console,Intl,Date,Math,JSON,Number,String,Object,Array,Set,Error,TextEncoder,Uint8Array,
  localStorage:{getItem(){return null},setItem(){}},
  location:{hash:'#inicio/resumen'},
  document:{querySelector:get,addEventListener(){},body:{classList:{remove(){},toggle(){}}}},
  window:{salesiaRole:'administrador',addEventListener(){}},
  setTimeout(){},clearTimeout(){}
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('src/legacy/app.js','utf8'),sandbox);
const result=vm.runInContext(`(() => {
  operationsReady=true;window.salesiaOperationsApi={};window.salesiaAnalyticalApi={};
  const date=today();
  operationsCustomers=[{id:'c1',code:'CLI1',name:'Cliente Uno',segment:'Minorista',status:'Activo'},{id:'c2',code:'CLI2',name:'Cliente Dos',segment:'Corporativo',status:'Activo'}];
  operationsSellers=[{id:'s1',code:'VEN1',name:'Vendedor Uno',goal:1000,status:'Activo'}];
  operationsProducts=[{id:'p1',code:'PRD1',name:'Producto A',category:'EPP',price:10,cost:5,stock:23,min:10,status:'Activo'},{id:'p2',code:'PRD2',name:'Producto B',category:'Otros',price:20,cost:8,stock:25,min:10,status:'Activo'}];
  operationsSales=[{id:'v1',code:'VTA1',date,customer:'c1',seller:'s1',total:100,status:'Pagada',method:'Efectivo',items:[{product:'p1',qty:10,price:10}]},
                   {id:'v2',code:'VTA2',date,customer:'c1',seller:'s1',total:20,status:'Pagada',method:'Efectivo',items:[{product:'p2',qty:1,price:20}]},
                   {id:'v3',code:'VTA3',date,customer:'c1',seller:'s1',total:100,status:'Pagada',method:'Efectivo',items:[{product:'p1',qty:10,price:10}]},
                   {id:'v4',code:'VTA4',date,customer:'c1',seller:'s1',total:100,status:'Pagada',method:'Efectivo',items:[{product:'p1',qty:10,price:10}]},
                   {id:'v5',code:'VTA5',date,customer:'c2',seller:'s1',total:30,status:'Pagada',method:'Efectivo',items:[{product:'p2',qty:1,price:30}]}];
  let report=buildReport('sales'); if(report.rows.length!==5||report.total!==5)throw Error('CSV source');
  query='VTA3';report=buildReport('sales');if(report.rows.length!==1)throw Error('Filtering report source');query='';
  const blob=xlsxWorkbook(report.headers,report.rows);if(blob[0]!==80||blob[1]!==75)throw Error('XLSX ZIP header');
  const reportHTML=reportsView();if(!reportHTML.includes('Vista previa')||!reportHTML.includes('report-xlsx'))throw Error('Report rendering');
  sub='variables';const variablesHTML=analyticsView();if(!variablesHTML.includes('Distribución empírica')||!variablesHTML.toLowerCase().includes('frecuencia'))throw Error('Frequency view');
  const insights=findings();if(!insights.some(i=>i.tag==='Productos')||!insights.some(i=>i.tag==='Clientes'))throw Error('Insights with evidence');
  if(insights.some(i=>i.tag==='Productos'&&!i.evidence?.sample_size))throw Error('Missing evidence');
  inventoryProducts=[{id:'p1',name:'Producto A',stock_quantity:23,minimum_stock:10}];
  const view={innerHTML:'',textContent:''},form={elements:{product:{value:'p1'},type:{value:'Salida'},qty:{value:'50'}},querySelector(selector){return selector==='#movement-preview'?view:null}};
  updateMovementPreview(form);if(!view.innerHTML.includes('Cantidad inválida'))throw Error('Overstock validation');
  form.elements.qty.value='5';updateMovementPreview(form);if(!view.innerHTML.includes('18'))throw Error('Stock preview');
  form.elements.type.value='Ajuste de saldo';form.elements.qty.value='0';updateMovementPreview(form);if(!view.innerHTML.includes('Atención'))throw Error('Zero adjustment');
  return {preview:reportHTML.includes('report-xlsx'),xlsxBytes:blob.length,findings:insights.length,tests:'filter report, XLSX, distributions, insights with evidence, inventory preview'};
})()`,sandbox);
console.log(JSON.stringify(result,null,2));
