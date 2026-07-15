/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Introslides_Organizetroopsdesc3Inputs */

const en_introslides_organizetroopsdesc3 = /** @type {(inputs: Introslides_Organizetroopsdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Soon local troops can self organize and issue official scout badges.`)
};

const es_introslides_organizetroopsdesc3 = /** @type {(inputs: Introslides_Organizetroopsdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pronto los troops locales podrán organizarse y emitir insignias scout oficiales.`)
};

const fr_introslides_organizetroopsdesc3 = /** @type {(inputs: Introslides_Organizetroopsdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bientôt, les troupes locales pourront s'organiser et délivrer des badges scouts officiels.`)
};

const ar_introslides_organizetroopsdesc3 = /** @type {(inputs: Introslides_Organizetroopsdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قريباً ستتمكن الفرق المحلية من التنظيم الذاتي وإصدار شارات كشفية رسمية.`)
};

/**
* | output |
* | --- |
* | "Soon local troops can self organize and issue official scout badges." |
*
* @param {Introslides_Organizetroopsdesc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const introslides_organizetroopsdesc3 = /** @type {((inputs?: Introslides_Organizetroopsdesc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Introslides_Organizetroopsdesc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_introslides_organizetroopsdesc3(inputs)
	if (locale === "es") return es_introslides_organizetroopsdesc3(inputs)
	if (locale === "fr") return fr_introslides_organizetroopsdesc3(inputs)
	return ar_introslides_organizetroopsdesc3(inputs)
});
export { introslides_organizetroopsdesc3 as "introSlides.organizeTroopsDesc" }