/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Aipathways_Plusmore2Inputs */

const en_aipathways_plusmore2 = /** @type {(inputs: Aipathways_Plusmore2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`+ ${i?.count} more`)
};

const es_aipathways_plusmore2 = /** @type {(inputs: Aipathways_Plusmore2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`+ ${i?.count} más`)
};

const fr_aipathways_plusmore2 = /** @type {(inputs: Aipathways_Plusmore2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`+ ${i?.count} de plus`)
};

const ar_aipathways_plusmore2 = /** @type {(inputs: Aipathways_Plusmore2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`+ ${i?.count} أخرى`)
};

/**
* | output |
* | --- |
* | "+ {count} more" |
*
* @param {Aipathways_Plusmore2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipathways_plusmore2 = /** @type {((inputs: Aipathways_Plusmore2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipathways_Plusmore2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipathways_plusmore2(inputs)
	if (locale === "es") return es_aipathways_plusmore2(inputs)
	if (locale === "fr") return fr_aipathways_plusmore2(inputs)
	return ar_aipathways_plusmore2(inputs)
});
export { aipathways_plusmore2 as "aiPathways.plusMore" }