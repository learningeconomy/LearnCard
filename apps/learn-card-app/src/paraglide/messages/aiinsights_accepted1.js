/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Accepted1Inputs */

const en_aiinsights_accepted1 = /** @type {(inputs: Aiinsights_Accepted1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accepted`)
};

const es_aiinsights_accepted1 = /** @type {(inputs: Aiinsights_Accepted1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aceptado`)
};

const fr_aiinsights_accepted1 = /** @type {(inputs: Aiinsights_Accepted1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accepté`)
};

const ar_aiinsights_accepted1 = /** @type {(inputs: Aiinsights_Accepted1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مقبول`)
};

/**
* | output |
* | --- |
* | "Accepted" |
*
* @param {Aiinsights_Accepted1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_accepted1 = /** @type {((inputs?: Aiinsights_Accepted1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Accepted1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_accepted1(inputs)
	if (locale === "es") return es_aiinsights_accepted1(inputs)
	if (locale === "fr") return fr_aiinsights_accepted1(inputs)
	return ar_aiinsights_accepted1(inputs)
});
export { aiinsights_accepted1 as "aiInsights.accepted" }