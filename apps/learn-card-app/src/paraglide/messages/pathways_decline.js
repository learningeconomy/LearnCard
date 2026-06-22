/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Pathways_DeclineInputs */

const en_pathways_decline = /** @type {(inputs: Pathways_DeclineInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Decline in the Job Market`)
};

const es_pathways_decline = /** @type {(inputs: Pathways_DeclineInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Declive en el mercado laboral`)
};

const fr_pathways_decline = /** @type {(inputs: Pathways_DeclineInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Déclin sur le marché du travail`)
};

const ar_pathways_decline = /** @type {(inputs: Pathways_DeclineInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التراجع في سوق العمل`)
};

/**
* | output |
* | --- |
* | "Decline in the Job Market" |
*
* @param {Pathways_DeclineInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const pathways_decline = /** @type {((inputs?: Pathways_DeclineInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pathways_DeclineInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_pathways_decline(inputs)
	if (locale === "es") return es_pathways_decline(inputs)
	if (locale === "fr") return fr_pathways_decline(inputs)
	return ar_pathways_decline(inputs)
});
export { pathways_decline as "pathways.decline" }