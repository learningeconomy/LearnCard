/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Strongestarea2Inputs */

const en_aiinsights_strongestarea2 = /** @type {(inputs: Aiinsights_Strongestarea2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Strongest Area`)
};

const es_aiinsights_strongestarea2 = /** @type {(inputs: Aiinsights_Strongestarea2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Área más fuerte`)
};

const fr_aiinsights_strongestarea2 = /** @type {(inputs: Aiinsights_Strongestarea2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Domaine le plus fort`)
};

const ar_aiinsights_strongestarea2 = /** @type {(inputs: Aiinsights_Strongestarea2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أقوى مجال`)
};

/**
* | output |
* | --- |
* | "Strongest Area" |
*
* @param {Aiinsights_Strongestarea2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_strongestarea2 = /** @type {((inputs?: Aiinsights_Strongestarea2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Strongestarea2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_strongestarea2(inputs)
	if (locale === "es") return es_aiinsights_strongestarea2(inputs)
	if (locale === "fr") return fr_aiinsights_strongestarea2(inputs)
	return ar_aiinsights_strongestarea2(inputs)
});
export { aiinsights_strongestarea2 as "aiInsights.strongestArea" }