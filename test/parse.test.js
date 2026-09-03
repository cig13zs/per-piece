/* node test/parse.test.js  -  exits non-zero on first failure. */
const assert = require('assert');
const { parseQuantity, parsePrice, unitPrice, rank } = require('../parse.js');

let n = 0;
function q(title, expect, why) {
  n++;
  const got = parseQuantity(title);
  if (expect === null) {
    assert.strictEqual(got, null, `\n  ${title}\n  expected null (${why})\n  got ${JSON.stringify(got)}`);
    return;
  }
  assert.ok(got, `\n  ${title}\n  expected ${JSON.stringify(expect)}, got null`);
  assert.strictEqual(got.dimension, expect.dimension, `\n  ${title}\n  dimension`);
  assert.ok(Math.abs(got.amount - expect.amount) < 0.01,
    `\n  ${title}\n  expected ${expect.amount}${expect.dimension}, got ${got.amount}`);
}

// --- plain sizes ------------------------------------------------------------
q('Bear Brand Powdered Milk 300g', { dimension: 'mass', amount: 300 });
q('Datu Puti Soy Sauce 1L', { dimension: 'volume', amount: 1000 });
q('Safeguard Bar Soap 135 g', { dimension: 'mass', amount: 135 });
q('Sunsilk Shampoo 180ml', { dimension: 'volume', amount: 180 });
q('Sinandomeng Rice 25kg', { dimension: 'mass', amount: 25000 });
q('Optimum Nutrition Whey 5lbs', { dimension: 'mass', amount: 2267.96 });
q('Coke Mismo 295 mL', { dimension: 'volume', amount: 295 });

// --- counts, incl. PH retail shorthand -------------------------------------
q('Biogesic Paracetamol 500mg 10s', { dimension: 'count', amount: 10 },
  'size + count together must resolve to per-piece');
q('Joy Dishwashing Liquid 12 sachets', { dimension: 'count', amount: 12 });
q('Tissue Paper 12 rolls', { dimension: 'count', amount: 12 });
q('Pack of 24 Face Mask', { dimension: 'count', amount: 24 });
q('Eggs 1 dozen fresh', { dimension: 'count', amount: 12 });

// --- multipacks, both orders (this is the viral case) ----------------------
q('Nestle Bear Brand 300g x 6', { dimension: 'mass', amount: 1800 });
q('Milo Activ-Go 24 x 22g', { dimension: 'mass', amount: 528 });
q('Century Tuna 180g*3 BUNDLE SALE', { dimension: 'mass', amount: 540 });
q('Nescafe 3 in 1 Original Coffee 28g x 10', { dimension: 'mass', amount: 280 },
  '"3 in 1" must not be read as a spec or a quantity');
q('Powerbank 20000mAh 2pcs', { dimension: 'count', amount: 2 },
  'a spec in the title must not veto a real package count');

q('Colgate Toothpaste 150g Twin Pack', { dimension: 'mass', amount: 300 },
  'twin pack doubles the size');
q('Safeguard 135g Triple Pack', { dimension: 'mass', amount: 405 });

// --- container capacity is not value; must stay silent ---------------------
q('Backpack 30L Waterproof', null, 'capacity, not contents');
q('Rice Cooker 1.8L 10 cups', null, 'appliance capacity');
q('Air Fryer 5L Digital', null, 'appliance capacity');
q('Coffee Mug 350ml Ceramic', null, 'vessel capacity');
q('Aquarium Tank 20L', null, 'vessel capacity');
q('Tupperware 1L Container', null, 'vessel capacity');
q('Adjustable Dumbbell 20kg', null, 'equipment mass is not package mass');
q('Coke Zero 1.5L', { dimension: 'volume', amount: 1500 },
  'a drink must still parse - the capacity guard must not be greedy');

// --- must stay silent -------------------------------------------------------
q('iPhone 15 Pro Max 256GB Natural Titanium', null, 'storage is not mass');
q('Laptop 16GB RAM 512GB SSD', null, 'storage is not mass');
q('Samsung 55 inch 4K Smart TV', null, 'inches are not a package unit');
q('Nike Air Max 270 Running Shoes', null, 'model number, no unit');
q('Shampoo 400ml + Conditioner 250ml', null, 'two different sizes = ambiguous');
q('USB Cable Type C Fast Charging', null, 'no quantity at all');
q('', null, 'empty');
q(null, null, 'null input');

// --- price -----------------------------------------------------------------
n++; assert.strictEqual(parsePrice('₱1,234.50'), 1234.5);
n++; assert.strictEqual(parsePrice('₱99'), 99);
n++; assert.strictEqual(parsePrice('PHP 1,000'), 1000);
n++; assert.strictEqual(parsePrice('₱120 - ₱350'), 120, 'ranges take the low end');
n++; assert.strictEqual(parsePrice('P1234'), 1234, 'bare P touching its digits is a price');
n++; assert.strictEqual(parsePrice('Free Shipping'), null);
n++; assert.strictEqual(parsePrice(''), null);
n++; assert.strictEqual(parsePrice('Top 10 Best Sellers'), null, 'listing furniture is not a price');
n++; assert.strictEqual(parsePrice('Shop 500 items'), null, 'listing furniture is not a price');
n++; assert.strictEqual(parsePrice('Sulit Deals 2026'), null);

// --- unit price + the bundle trap ------------------------------------------
n++;
{
  const single = unitPrice(62, parseQuantity('Bear Brand 300g'));
  const bundle = unitPrice(420, parseQuantity('Bear Brand 300g x 6'));
  assert.ok(single && bundle, 'both should parse');
  // 62/300g = ₱20.67/100g   vs   420/1800g = ₱23.33/100g
  assert.ok(bundle.value > single.value,
    `bundle should be exposed as worse value: single ${single.text} bundle ${bundle.text}`);
  assert.strictEqual(single.label, '100g');
}

n++;
{
  const r = rank([20.67, 23.33, 45.0]);
  assert.strictEqual(r(20.67), 'best');
  assert.strictEqual(r(23.33), 'plain', 'only 13% worse - not worth shaming');
  assert.strictEqual(r(45.0), 'worst', '2.2x the cheapest');
  assert.strictEqual(rank([12])(12), 'plain', 'a lone tile has nothing to compare to');
}

console.log(`\n  ${n} assertions passed\n`);
