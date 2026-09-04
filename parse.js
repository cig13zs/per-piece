/* Per Piece - quantity parsing and unit-price math.
 *
 * Pure functions, no DOM. Loaded as a plain script before content.js (which
 * uses the globals) and require()d by test/parse.test.js.
 *
 * Design rule that outranks coverage: a WRONG unit price is worse than none.
 * Anything ambiguous returns null and the tile simply gets no badge.
 */

// Multipliers to a base unit. Base: mass -> g, volume -> ml, count -> pc.
const UNITS = {
  mass: {
    g: 1, gr: 1, gm: 1, grm: 1, gram: 1, grams: 1, gramme: 1, grammes: 1,
    kg: 1000, kgs: 1000, kilo: 1000, kilos: 1000, kilogram: 1000, kilograms: 1000,
    mg: 0.001,
    oz: 28.3495, ounce: 28.3495, ounces: 28.3495,
    lb: 453.592, lbs: 453.592, pound: 453.592, pounds: 453.592,
  },
  volume: {
    ml: 1, mls: 1, milliliter: 1, milliliters: 1, millilitre: 1, millilitres: 1,
    cl: 10,
    l: 1000, li: 1000, lt: 1000, ltr: 1000,
    liter: 1000, liters: 1000, litre: 1000, litres: 1000,
  },
  count: {
    pc: 1, pcs: 1, pce: 1, piece: 1, pieces: 1,
    pack: 1, packs: 1, pk: 1, pouch: 1, pouches: 1,
    sachet: 1, sachets: 1, sach: 1,
    tab: 1, tabs: 1, tablet: 1, tablets: 1,
    cap: 1, caps: 1, capsule: 1, capsules: 1,
    sheet: 1, sheets: 1, ply: 1,
    roll: 1, rolls: 1,
    bottle: 1, bottles: 1, btl: 1,
    can: 1, cans: 1, tin: 1, tins: 1,
    bar: 1, bars: 1, stick: 1, sticks: 1,
    pair: 1, pairs: 1, set: 1, sets: 1,
    box: 1, boxes: 1, bundle: 1, bundles: 1,
    count: 1, counts: 1, cnt: 1,   // US shelf shorthand: "30 Count", "42 cnt"
    s: 1,            // PH retail shorthand: "Biogesic 10s" = 10 tablets
    dozen: 12, dozens: 12,
  },
};

// Unit token -> dimension, flattened once.
const UNIT_DIM = {};
for (const dim of Object.keys(UNITS)) {
  for (const u of Object.keys(UNITS[dim])) UNIT_DIM[u] = dim;
}

const ALL_UNITS = Object.keys(UNIT_DIM).sort((a, b) => b.length - a.length);
const UNIT_ALT = ALL_UNITS.join('|');

// Note: spec false positives ("iPhone 15 128GB", "16GB RAM", "5000mAh") are
// already blocked by the (?![a-z]) lookahead on every unit match - the "g" in
// "128GB" is followed by a letter, so it never matches. An additional
// whole-title spec veto was tried and removed: it wrongly killed real products
// like "Nescafe 3 in 1 28g x 10" and "Powerbank 20000mAh 2pcs".

// Explicit multipack forms, checked before the single-quantity scan.
// "500g x 3", "500 g*3", "3 x 500g", "3x500 ml", and the spelled-out "33g by 8"
// seen on real Shopee listings.
const MULT = String.raw`(?:[x×*]|\bby\b)`;
const MULT_QTY_FIRST = new RegExp(
  String.raw`(\d+(?:[.,]\d+)?)\s*(${UNIT_ALT})(?![a-z])\s*${MULT}\s*(\d{1,4})(?![\d.])`, 'i');
const MULT_COUNT_FIRST = new RegExp(
  String.raw`(\d{1,4})\s*${MULT}\s*(\d+(?:[.,]\d+)?)\s*(${UNIT_ALT})(?![a-z])`, 'i');

// "pack of 12", "set of 3", "box of 24"
const PACK_OF = /\b(?:pack|packs|set|sets|box|boxes|bundle|case)\s+of\s+(\d{1,4})\b/i;

// "Twin Pack", "Triple Pack" - common PH shelf wording for a 2x/3x bundle.
const NAMED_PACK = /\b(twin|double|triple|quad)\s*[- ]?\s*pack\b/i;
const NAMED_PACK_N = { twin: 2, double: 2, triple: 3, quad: 4 };

// Capacity, not contents. "Backpack 30L", "Rice Cooker 1.8L", "Coffee Mug
// 350ml" all carry a real volume that says nothing about value-for-money, so
// a per-100ml badge on them is actively misleading. Verified against a probe
// of real Shopee-style titles. "bottle" is deliberately NOT here - on grocery
// searches it is far more often a drink ("Coke 1.5L bottle") than a flask.
const CAPACITY_NOUN = new RegExp(String.raw`\b(?:cooker|fryer|blender|kettle|thermos|flask|tumbler|mug|carafe|dispenser|humidifier|diffuser|nebulizer|steamer|oven|toaster|crockpot|pot|pan|wok|casserole|tank|aquarium|backpack|luggage|suitcase|cooler|chiller|freezer|refrigerator|ref|washer|washing\s+machine|vacuum|sprayer|watering|reservoir|lunchbox|organizer|dumbbell|kettlebell|barbell|weighing\s+scale)\b`, 'i');

// Sold both ways, so the noun alone cannot decide. A "30L bag" is luggage
// capacity; a "12 oz bag" of coffee is a package size. Bags, buckets and
// canisters state their capacity in litres and their contents in grams or
// ounces, so the dimension is the discriminator - veto volume only. Juice
// cartons keep "box" out of this list, and drinks keep "bottle" out.
const VESSEL_NOUN = /\b(?:bag|sack|bucket|pail|basin|drum|canister|container|tupperware|jug|pitcher)\b/i;

// Any single "<number><unit>" occurrence.
const SINGLE = new RegExp(
  String.raw`(\d+(?:[.,]\d+)?)\s*(${UNIT_ALT})(?![a-z])`, 'gi');

// Plausible package sizes. Outside these the match is almost certainly a model
// number, a spec, or a parse error.
const RANGE = {
  mass:   [0.5, 100000],    // 0.5 g .. 100 kg
  volume: [1, 100000],      // 1 ml .. 100 L
  count:  [1, 1000],
};

const BASE_LABEL = { mass: 'g', volume: 'ml', count: 'pc' };

// How the badge is expressed: per 100 g / per 100 ml / per piece.
const DISPLAY = {
  mass:   { per: 100, label: '100g' },
  volume: { per: 100, label: '100ml' },
  count:  { per: 1,   label: 'pc' },
};

function num(raw) {
  // "1,5" and "1.5" both appear; commas inside integers are thousands sep.
  const s = String(raw).replace(/,(\d{3})\b/g, '$1').replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

function inRange(dim, value) {
  const [lo, hi] = RANGE[dim];
  return value >= lo && value <= hi;
}

function make(dim, value) {
  if (value == null || !Number.isFinite(value) || !inRange(dim, value)) return null;
  return { dimension: dim, amount: value, unit: BASE_LABEL[dim] };
}

// Every plausible "<number><unit>" in the title, in base units.
function scanSingles(t) {
  const hits = [];
  SINGLE.lastIndex = 0;
  let s;
  while ((s = SINGLE.exec(t)) !== null) {
    const unit = s[2];
    const dim = UNIT_DIM[unit];
    const value = num(s[1]) * UNITS[dim][unit];
    if (value == null || !inRange(dim, value)) continue;
    // Bare "s" only counts glued to its number ("10s"), never "10 s".
    if (unit === 's' && !/^\d+s$/.test(s[0].replace(/\s+/g, ''))) continue;
    hits.push({ dim, value, unit });
  }
  return hits;
}

/**
 * Extract total package quantity from a product title.
 * Returns { dimension, amount, unit } in base units, or null when unsure.
 */
function parseQuantity(title) {
  const r = readQuantity(title);
  if (!r) return null;
  if (r.dimension === 'volume' && VESSEL_NOUN.test(title.toLowerCase())) return null;
  return r;
}

function readQuantity(title) {
  if (!title || typeof title !== 'string') return null;
  const t = title.toLowerCase();

  // The number describes the vessel, not what you consume out of it.
  if (CAPACITY_NOUN.test(t)) return null;

  let m = t.match(MULT_QTY_FIRST);
  if (m) {
    const dim = UNIT_DIM[m[2]];
    const each = num(m[1]) * UNITS[dim][m[2]];
    return make(dim, each * parseInt(m[3], 10));
  }

  m = t.match(MULT_COUNT_FIRST);
  if (m) {
    const dim = UNIT_DIM[m[3]];
    const each = num(m[2]) * UNITS[dim][m[3]];
    return make(dim, each * parseInt(m[1], 10));
  }

  m = t.match(PACK_OF);
  if (m) {
    const n = parseInt(m[1], 10);
    // "300g - Pack of 2" is 600 g. A pack count always means whole packages,
    // so multiplying is safe here in a way it is not for a per-dose size like
    // "500mg 10s", and it keeps the tile comparable with the rest of the page.
    const sizes = scanSingles(t).filter((h) => h.dim !== 'count');
    if (sizes.length === 1) return make(sizes[0].dim, sizes[0].value * n);
    return make('count', n);
  }

  // "Colgate 150g Twin Pack" is 300 g, not 150 g.
  const named = t.match(NAMED_PACK);
  const packMult = named ? NAMED_PACK_N[named[1].toLowerCase()] : 1;

  // Single quantities. Collect them all so we can detect ambiguity.
  const hits = scanSingles(t);
  if (hits.length === 0) return null;

  // When a size AND a count both appear with no multiplier joining them
  // ("Vitamin C 500mg 100s", "6 cans 330ml"), the listing means "N units of
  // that size". Per-piece is then the only always-correct reading - per-100g
  // of a 100-tablet bottle is nonsense. So count wins whenever both appear.
  const counts = hits.filter((h) => h.dim === 'count');
  const sizes = hits.filter((h) => h.dim !== 'count');
  const pool = counts.length && sizes.length ? counts
    : (sizes.length ? sizes : counts);

  // Several unrelated quantities of the same dimension with no multiplier
  // between them ("400ml + 200ml", "shampoo 400ml conditioner 250ml") is
  // ambiguous. Silence beats a wrong number.
  if (pool.length > 2) return null;
  if (pool.length === 2 && pool[0].value !== pool[1].value) return null;

  return make(pool[0].dim, pool[0].value * packMult);
}

// --- money -----------------------------------------------------------------
// Symbol or ISO code -> what we print back. Longest match wins, so "S$" and
// "HK$" are tried before a bare "$".
const CURRENCY = {
  '₱': '₱', php: '₱',
  'hk$': 'HK$', hkd: 'HK$', 'nt$': 'NT$', twd: 'NT$',
  's$': 'S$', sgd: 'S$', 'a$': 'A$', aud: 'A$', 'c$': 'C$', cad: 'C$',
  'r$': 'R$', brl: 'R$', 'nz$': 'NZ$', nzd: 'NZ$',
  $: '$', usd: '$', mxn: 'MX$',
  '£': '£', gbp: '£', '€': '€', eur: '€',
  '¥': '¥', jpy: '¥', cny: '¥', rmb: '¥',
  '₹': '₹', inr: '₹', '₩': '₩', krw: '₩',
  '฿': '฿', thb: '฿', '₫': '₫', vnd: '₫',
  rp: 'Rp', idr: 'Rp', rm: 'RM', myr: 'RM',
  chf: 'CHF', aed: 'AED', sar: 'SAR', zar: 'R',
  'zł': 'zł', pln: 'zł', 'kč': 'Kč', czk: 'Kč',
  kr: 'kr', sek: 'kr', nok: 'kr', dkk: 'kr',
};

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const SYMS = Object.keys(CURRENCY).sort((a, b) => b.length - a.length).map(esc).join('|');

// Digits with any mix of thousands and decimal separators. The first branch
// is space-grouped money ("1 234,56" on fr/pl/se pages); its lookahead stops
// it eating a pack size that sits in the same node, as in "P199 300g".
const SP = String.raw`[ \u00a0\u202f]`;
const NUM = String.raw`\d{1,3}(?:${SP}\d{3})+(?:[.,]\d{1,2})?(?!\s*[a-z])|\d[\d.,]*\d|\d`;

// Symbol before the number is the common case; "12,99 €" puts it after.
// A bare "P" for pesos is only trusted when the text STARTS with it. Anywhere
// else it is far more often a model number - "Canon Printer P1000 Ink 30ml"
// would otherwise badge as ₱3333/100ml - and listing furniture like
// "Top 10" or "Shop 500" would read as a price too.
const PRICE_RE = new RegExp(
  String.raw`(?:(${SYMS})\s*(${NUM}))|(?:(${NUM})\s*(${SYMS})(?![a-z]))|(?:^\s*p(?=\d)(${NUM}))`, 'i');

/** Cheap prefilter for the DOM side: does this text contain a price at all? */
const hasMoney = (t) => !!t && PRICE_RE.test(t);

/**
 * Turn a localised number into a Number.
 * "1,234.50" and "1.234,56" are both 1234.5-ish; "1,234" and "1.234" are both
 * 1234. Getting this backwards is a 1000x error, so the rule is explicit:
 * the LAST separator is the decimal point, unless there is exactly one
 * separator followed by exactly three digits, which is a thousands group.
 */
function toNumber(raw) {
  let s = String(raw).replace(/[\s  ]/g, '');
  const dots = (s.match(/\./g) || []).length;
  const coms = (s.match(/,/g) || []).length;
  const split = (at) => s.slice(0, at).replace(/[.,]/g, '') + '.' + s.slice(at + 1);

  if (dots && coms) {
    // Both appear, so the later one is the decimal point.
    s = split(Math.max(s.lastIndexOf('.'), s.lastIndexOf(',')));
  } else if (dots + coms > 1) {
    // The same separator repeated is always grouping: "1,234,567".
    s = s.replace(/[.,]/g, '');
  } else if (dots + coms === 1) {
    const at = Math.max(s.lastIndexOf('.'), s.lastIndexOf(','));
    // Exactly three trailing digits reads as a thousands group, which is the
    // right call for prices: "Rp 125.000" is 125000, not 125.
    s = (s.length - at - 1) === 3 ? s.replace(/[.,]/g, '') : split(at);
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

/** { value, symbol } for the first price in the text, or null. */
function parseMoney(text) {
  if (!text) return null;
  const m = String(text).match(PRICE_RE);
  if (!m) return null;
  const sym = (m[1] || m[4] || '₱').toLowerCase();
  const n = toNumber(m[2] || m[3] || m[5]);
  if (!Number.isFinite(n) || n <= 0) return null;
  return { value: n, symbol: CURRENCY[sym] || '₱' };
}

/** Back-compat numeric form, used by the tests and the ranking maths. */
function parsePrice(text) {
  const m = parseMoney(text);
  return m ? m.value : null;
}

/**
 * Unit price for a tile. Returns { value, label, text, dimension } or null.
 * `value` is comparable only against the same `dimension`.
 */
function unitPrice(price, qty, symbol) {
  if (!price || !qty) return null;
  const d = DISPLAY[qty.dimension];
  const value = (price / qty.amount) * d.per;
  if (!Number.isFinite(value) || value <= 0) return null;
  return {
    value,
    dimension: qty.dimension,
    label: d.label,
    text: `${formatMoney(value, symbol || '₱')}/${d.label}`,
  };
}

function formatMoney(v, symbol) {
  // Currency-agnostic: keep two decimals while the number is small enough for
  // them to matter. A peso rule of 'two decimals under 10' would print $25
  // for a $24.99 item on Amazon.
  const decimals = v < 100 ? 2 : v < 1000 ? 1 : 0;
  const n = v.toFixed(decimals).replace(/\.0+$/, '');
  const [whole, frac] = n.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (symbol || '₱') + grouped + (frac ? '.' + frac : '');
}

/**
 * Rank unit prices within one dimension so the grid can be colour-coded.
 * Cheapest -> 'best'. At least WORST_RATIO more expensive -> 'worst'.
 */
const WORST_RATIO = 1.5;

// Some listings state a size that does not cover what is actually being sold:
// a photo of ten sachets titled only "33g". Nothing in the text can reveal
// that, and the result is a unit price wildly out of line with the rest of the
// page. Caught on a live Shopee search - one tile read ₱378.8/100g against a
// page median around ₱43. Those are listing lies rather than bargains, and a
// badge nine times off is exactly the kind of wrong that earns a one-star
// review, so drop them instead. Needs a real sample before the median means
// anything.
const OUTLIER = 4;
const MIN_SAMPLE = 4;

function median(sorted) {
  const n = sorted.length;
  return n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
}

/** Predicate: is this unit price believable next to the rest of the page? */
function plausible(values) {
  const f = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (f.length < MIN_SAMPLE) return () => true;
  const mid = median(f);
  if (!(mid > 0)) return () => true;
  return (v) => Number.isFinite(v) && v <= mid * OUTLIER && v >= mid / OUTLIER;
}

function rank(values) {
  const finite = values.filter((v) => Number.isFinite(v));
  if (finite.length < 2) return () => 'plain';
  const min = Math.min(...finite);
  return (v) => {
    if (!Number.isFinite(v)) return 'plain';
    if (v === min) return 'best';
    if (v >= min * WORST_RATIO) return 'worst';
    return 'plain';
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    parseQuantity, parsePrice, parseMoney, toNumber, hasMoney,
    unitPrice, rank, plausible, formatMoney,
  };
}
