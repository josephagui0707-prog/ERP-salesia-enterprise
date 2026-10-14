const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
let savedAnalysis=null,savedBayes=null,savedInsights=null;
const node=()=>({textContent:'',innerHTML:'',classList:{add(){},remove(){},toggle(){}},showModal(){},close(){}});
const elements=new Map();
const el=selector=>{if(!elements.has(selector))elements.set(selector,node());return elements.get(selector);};
const orgApi={async load(){return {
 categories:[{id:'c',name:'Tecnología'}],customers:[{id:'cli',code:'CLI-01',name:'Comprador real',segment:'corporativo',status:'activo'}],
 products:[{id:'prod',code:'PR-01',name:'Laptop',category_id:'c',price:100,cost:40,stock_quantity:3,minimum_stock:5,status:'activo'}],
 sellers:[{id:'seller',code:'V-01',name:'Vendedor',monthly_goal:2000,status:'activo'}],
 sales:[{id:'sale',code:'VTA-01',sold_at:new Date().toISOString(),customer_id:'cli',seller_id:'seller',status:'pagada',total:100,subtotal:100}],
 saleItems:[{id:'si',sale_id:'sale',product_id:'prod',quantity:1,unit_price:100}],orders:[],orderItems:[],payments:[]
};}};
const savedHistory={analyses:[],probabilities:[],findings:[],exports:[]};
const analyticsApi={
 async history(){return savedHistory;},
 async saveAnalysis(input){savedAnalysis=input;},
 async saveBayes(input){savedBayes=input;},
 async saveInsights(input){savedInsights=input;},
};
const c={console,Intl,Date,Math,JSON,Number,String,Object,Array,Set,Error,
 localStorage:{getItem(){return null},setItem(){}},
 location:{hash:'#analytics/estadistica'},
 document:{querySelector:el,addEventListener(){},body:{classList:{add(){},remove(){},toggle(){}}}},
 window:{addEventListener(){},salesiaRole:'administrador',salesiaOperationsApi:orgApi,salesiaAnalyticalApi:analyticsApi,
 salesiaCurrentUser:{organization:'Empresa prueba'}},setTimeout(){},clearTimeout(){} };
vm.createContext(c);
vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../src/legacy/app.js'),'utf8'),c);
(async()=>{
 await vm.runInContext('refreshOperationsData()',c);
 assert.match(el('#content').innerHTML,/Guardar análisis en Supabase/);
 await vm.runInContext("ACTIONS['save-analysis']()",c);
 assert.equal(savedAnalysis.n,1);
 assert.equal(savedAnalysis.mean,100);
 assert.equal(savedAnalysis.median,100);
 vm.runInContext("lastBayes={prior:.3,likelihood:.7,falsePositive:.2,evidence:.35,posterior:.6}",c);
 await vm.runInContext("ACTIONS['save-bayes']()",c);
 assert.equal(savedBayes.posterior,.6);
 await vm.runInContext("ACTIONS['save-findings']()",c);
 assert.ok(savedInsights.length>=1);
 assert.ok(savedInsights.some(i=>i.evidence.product_count===1));
 console.log('PASS: Supabase mock: media, Bayes, insights, evidencia y rol admin.');
})().catch(e=>{console.error(e);process.exitCode=1;});
