const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const path = require('path');

const elements = new Map();
const el = (s) => {
  if (!elements.has(s)) elements.set(s, {
    textContent: '', innerHTML: '', classList: { add() {}, remove() {} },
    showModal() {}, close() {},
  });
  return elements.get(s);
};
const c = {
  console, Intl, Date, Math, JSON, Number, String, Object, Array, Set, Error,
  localStorage: { getItem() { return null; }, setItem() {} },
  location: { hash: '#inicio/resumen' },
  document: { querySelector: el, addEventListener() {}, body: { classList: { remove() {}, toggle() {} } } },
  window: { addEventListener() {} }, setTimeout() {}, clearTimeout() {},
};
vm.createContext(c);
const enginePath = path.join(__dirname, '../src/legacy/app.js');
vm.runInContext(fs.readFileSync(enginePath, 'utf8'), c);
const result = vm.runInContext(`(() => {
  let count = 0;
  for (const m of MODULES) for (const tab of m[4]) {
    current = m[0]; sub = tab[0]; render();
    const html = document.querySelector('#content').innerHTML;
    if (!html.includes('<h1>') || html.includes('undefined') || html.includes('NaN')) throw Error('Vista inválida: ' + m[0] + '/' + tab[0]);
    count++;
  }
  if (stats([1,2,3,4]).median !== 2.5 || stats([1,8,2]).median !== 2 || stats([]).n !== 0) throw Error('Mediana');
  if (Math.abs(bayes(.3,.7,.2).posterior - .6) > 1e-10) throw Error('Bayes');
  let throws = false; try { bayes(0,0,0); } catch(e) { throws = true; } if (!throws) throw Error('Evidencia nula');
  validateBackup(seed());
  const p = state.products[0], stock = p.stock, n = state.sales.length;
  recordSale({customer:state.customers[0].id,seller:state.sellers[0].id,status:'Pagada',method:'Efectivo'},[{product:p.id,qty:1},{product:p.id,qty:2}]);
  if (p.stock !== stock - 3 || state.sales.length !== n + 1 || state.sales.at(-1).total !== 3 * p.price || state.movements.length !== 1) throw Error('Integración venta-stock');
  throws = false; try { recordSale({customer:state.customers[0].id,seller:state.sellers[0].id,status:'Pagada',method:'Tarjeta'},[{product:p.id,qty:999999}]); } catch(e) { throws = true; }
  if (!throws || p.stock !== stock - 3) throw Error('Sobreventa');
  validateBackup(state);
  const order = state.orders[0];
  recordSale({customer:order.customer,seller:state.sellers[0].id,status:'Pendiente',method:'Tarjeta'},[{product:order.product,qty:order.qty}],order.id);
  throws = false; try { recordSale({customer:order.customer,seller:state.sellers[0].id,status:'Pendiente',method:'Tarjeta'},[{product:order.product,qty:order.qty}],order.id); } catch(e) { throws = true; }
  if (!throws) throw Error('Pedido duplicado');
  const invalid = seed(); invalid.products[0].stock = -1; throws = false;
  try { validateBackup(invalid); } catch(e) { throws = true; } if (!throws) throw Error('Importación inválida');
  state = seed(); state.sales = []; state.products = []; state.customers = []; state.sellers = []; state.orders = [];
  for (const m of MODULES) for (const tab of m[4]) { current = m[0]; sub = tab[0]; render(); if (document.querySelector('#content').innerHTML.includes('NaN')) throw Error('Estado vacío: ' + m[0]); }
  return { modules: MODULES.length, views: count, tests: 'Vistas con datos y vacías; estadística; Bayes; venta-stock; sobreventa; pedidos duplicados; validación de respaldo' };
})()`, c);
assert.strictEqual(result.modules, 9);
assert.strictEqual(result.views, 32);
console.log(JSON.stringify(result, null, 2));
