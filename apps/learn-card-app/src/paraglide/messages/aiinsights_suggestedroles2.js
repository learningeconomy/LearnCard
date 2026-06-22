/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Suggestedroles2Inputs */

const en_aiinsights_suggestedroles2 = /** @type {(inputs: Aiinsights_Suggestedroles2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Suggested Roles`)
};

const es_aiinsights_suggestedroles2 = /** @type {(inputs: Aiinsights_Suggestedroles2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Roles sugeridos`)
};

const fr_aiinsights_suggestedroles2 = /** @type {(inputs: Aiinsights_Suggestedroles2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rôles suggérés`)
};

const ar_aiinsights_suggestedroles2 = /** @type {(inputs: Aiinsights_Suggestedroles2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الأدوار المقترحة`)
};

/**
* | output |
* | --- |
* | "Suggested Roles" |
*
* @param {Aiinsights_Suggestedroles2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_suggestedroles2 = /** @type {((inputs?: Aiinsights_Suggestedroles2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Suggestedroles2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_suggestedroles2(inputs)
	if (locale === "es") return es_aiinsights_suggestedroles2(inputs)
	if (locale === "fr") return fr_aiinsights_suggestedroles2(inputs)
	return ar_aiinsights_suggestedroles2(inputs)
});
export { aiinsights_suggestedroles2 as "aiInsights.suggestedRoles" }