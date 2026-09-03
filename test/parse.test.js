/* node test/parse.test.js  -  exits non-zero on first failure. */
const assert = require('assert');
const { parseQuantity, parsePrice, parseMoney, toNumber, unitPrice, rank, plausible,
  formatMoney } = require('../parse.js');

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
q('Nespresso Capsules VertuoLine, 30 Count', { dimension: 'count', amount: 30 },
  'US shelf shorthand');
q('Starbucks Pike Place Ground Coffee, 12 oz Bag', { dimension: 'mass', amount: 340.19 });
q('Cuisinart Coffee Maker 14 Cup Programmable Carafe', null, 'appliance capacity');
q('Diamond Solitaire Ring 1.5ct White Gold', null,
  'ct is carats on jewellery, so it is deliberately not a count unit');

// Both found by the in-extension report button on a live shopee.ph search.
q('Bear brand Powdered Milk drink 33g by 8', { dimension: 'mass', amount: 264 },
  '"by" is a multiplier just like x');
q('Bear Brand Fortified Choco Powdered Milk Drink 300g - Pack of 2',
  { dimension: 'mass', amount: 600 },
  'a pack count means whole packages, so it multiplies the size');
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
n++; assert.strictEqual(parsePrice('Canon Printer P1000 Ink Cartridge'), null,
  'a bare P mid-text is a model number, not a peso price');
n++; assert.strictEqual(parsePrice('P199 300g'), 199,
  'a size in the same node must not be swallowed into the number');

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

// --- localised numbers: getting this backwards is a 1000x error ------------
n++; assert.strictEqual(toNumber('1,234.50'), 1234.5, 'US/PH grouping');
n++; assert.strictEqual(toNumber('1.234,56'), 1234.56, 'EU/ID grouping');
n++; assert.strictEqual(toNumber('1,234'), 1234, 'one separator + 3 digits = thousands');
n++; assert.strictEqual(toNumber('1.234'), 1234, 'same, the other way round');
n++; assert.strictEqual(toNumber('12,99'), 12.99, 'EU decimal comma');
n++; assert.strictEqual(toNumber('0.50'), 0.5);
n++; assert.strictEqual(toNumber('1,234,567'), 1234567);
n++; assert.strictEqual(toNumber('1.234.567'), 1234567);
n++; assert.strictEqual(toNumber('99'), 99);
n++; assert.strictEqual(toNumber('1 234,56'), 1234.56, 'fr/pl/se space grouping');

// --- currencies ------------------------------------------------------------
const money = (t) => { const m = parseMoney(t); return m && `${m.symbol}${m.value}`; };
n++; assert.strictEqual(money('₱1,234.50'), '₱1234.5');
n++; assert.strictEqual(money('$24.99'), '$24.99', 'Amazon US');
n++; assert.strictEqual(money('£12.50'), '£12.5');
n++; assert.strictEqual(money('12,99 €'), '€12.99', 'symbol after the number');
n++; assert.strictEqual(money('RM 45.90'), 'RM45.9', 'Shopee Malaysia');
n++; assert.strictEqual(money('Rp 125.000'), 'Rp125000', 'Rupiah: dots are thousands');
n++; assert.strictEqual(money('S$18.40'), 'S$18.4', 'S$ must beat a bare $');
n++; assert.strictEqual(money('HK$250'), 'HK$250');
n++; assert.strictEqual(money('₫250.000'), '₫250000');
n++; assert.strictEqual(money('฿399'), '฿399');
n++; assert.strictEqual(money('₹1,299'), '₹1299');
n++; assert.strictEqual(money('1 234,56 €'), '€1234.56', 'space-grouped euros');
n++; assert.strictEqual(parseMoney('Top 10 Best Sellers'), null, 'still not a price');
n++; assert.strictEqual(parseMoney('Free Shipping'), null);
n++; assert.strictEqual(formatMoney(24.99, '$'), '$24.99');
n++; assert.strictEqual(formatMoney(1234.5, '£'), '£1,235');

// A dollar page must badge in dollars, not pesos.
n++;
{
  const up = unitPrice(24.99, parseQuantity('Coffee Beans 340g'), '$');
  assert.strictEqual(up.text, '$7.35/100g');
}

// --- outlier suppression, from a live shopee.ph search --------------------
n++;
{
  // Real page: nine milk tiles clustered near ₱42/100g plus one listing whose
  // title said "33g" while the photo showed a bundle -> ₱378.8/100g.
  const page = [41.9, 42.0, 44.7, 42.3, 42.3, 40.2, 70.5, 125.1, 157.3, 378.8];
  const ok = plausible(page);
  assert.strictEqual(ok(378.8), false, 'a 9x outlier is a listing lie, not a bargain');
  assert.strictEqual(ok(41.9), true);
  assert.strictEqual(ok(157.3), true, 'a genuinely pricier product must survive');

  // The mirror case: a title claiming 25kg for a 1kg bag reads far too cheap,
  // and would wrongly win "best".
  assert.strictEqual(plausible([40, 42, 44, 46, 1.2])(1.2), false);

  // Too few tiles to trust a median - never suppress.
  assert.strictEqual(plausible([20, 900])(900), true);
  assert.strictEqual(plausible([])(5), true);
}

console.log(`\n  ${n} assertions passed\n`);
