export const CATEGORY_GROUPS = [
    { label: 'Sacs', value: 'Sacs', subcategories: [] },
    { label: 'Chaussures', value: 'Chaussures', subcategories: ['Femme', 'Homme', 'Bebe'] },
    { label: 'Accessoires', value: 'Accessoires', subcategories: ['Colliers', 'Bagues', 'Bracelets'] },
    { label: 'Vetements', value: 'Vetements', subcategories: ['Robes', 'Abayas', 'Voiles & Hijabs'] },
];

export const normalize = (value = '') =>
    value
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[ªº]/g, '')
        .trim();

export const slugify = (value = '') =>
    normalize(value)
        .replace(/&/g, 'et')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

const GROUP_ALIASES = {
    sac: 'Sacs',
    sacs: 'Sacs',
    chaussure: 'Chaussures',
    chaussures: 'Chaussures',
    chassure: 'Chaussures',
    chassures: 'Chaussures',
    accessoire: 'Accessoires',
    accessoires: 'Accessoires',
    vetement: 'Vetements',
    vetements: 'Vetements',
    vatement: 'Vetements',
    vatements: 'Vetements',
};

const resolveGroupFromRaw = (raw = '') => {
    const key = normalize(raw);
    if (GROUP_ALIASES[key]) return GROUP_ALIASES[key];

    for (const group of CATEGORY_GROUPS) {
        const base = normalize(group.label || group.value || '');
        const groupKeys = new Set([base]);
        if (base.endsWith('s')) groupKeys.add(base.slice(0, -1));

        for (const k of groupKeys) {
            if (key === k || (k && key.includes(k))) return group.label;
        }

        for (const sub of group.subcategories || []) {
            const subKey = normalize(sub);
            if (key === subKey || (subKey && key.includes(subKey))) return group.label;
        }
    }

    return raw;
};

export const normalizeCategorySlug = (slug = '') => {
    const map = {
        sac: 'sacs',
        chaussure: 'chaussures',
        accessoire: 'accessoires',
        vetement: 'vetements',
    };
    return map[slug] || slug;
};

export const getGroupLabel = (product = {}) => {
    const raw = product.categoryGroup || product.category || '';
    return resolveGroupFromRaw(raw);
};

export const getSubcategoryLabel = (product = {}) => product.subcategory || '';

export const getDisplayCategory = (product = {}) =>
    product.subcategory || product.category || product.categoryGroup || '';

export const getGroupLabelFromSlug = (slug = '') => {
    const normalized = normalizeCategorySlug(slugify(slug));
    const map = {
        sacs: 'Sacs',
        chaussures: 'Chaussures',
        accessoires: 'Accessoires',
        vetements: 'Vetements',
    };
    return map[normalized] || slug;
};

export const getSubcategoryLabelFromSlug = (slug = '') => {
    const target = slugify(slug);
    for (const group of CATEGORY_GROUPS) {
        for (const sub of group.subcategories) {
            if (slugify(sub) === target) return sub;
        }
    }
    return slug;
};

export const isPromo = (product = {}) => {
    const price = Number(product.price);
    const oldPrice = Number(product.oldPrice);
    if (!Number.isFinite(price) || !Number.isFinite(oldPrice)) return false;
    return price < oldPrice;
};

export const getDiscountPercent = (product = {}) => {
    const price = Number(product.price);
    const oldPrice = Number(product.oldPrice);
    if (!Number.isFinite(price) || !Number.isFinite(oldPrice)) return null;
    if (oldPrice <= 0 || price >= oldPrice) return null;
    const percent = Math.round(((oldPrice - price) / oldPrice) * 100);
    return percent > 0 ? percent : null;
};

export const isNewProduct = (product = {}, days = 14) => {
    if (!product.createdAt) return false;
    const date = new Date(product.createdAt);
    if (Number.isNaN(date.getTime())) return false;
    const diffDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= days;
};
