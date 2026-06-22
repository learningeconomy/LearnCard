/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Moreroles2Inputs */

const en_aiinsights_moreroles2 = /** @type {(inputs: Aiinsights_Moreroles2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`More Roles`)
};

const es_aiinsights_moreroles2 = /** @type {(inputs: Aiinsights_Moreroles2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Más roles`)
};

const fr_aiinsights_moreroles2 = /** @type {(inputs: Aiinsights_Moreroles2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Plus de rôles`)
};

const ar_aiinsights_moreroles2 = /** @type {(inputs: Aiinsights_Moreroles2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المزيد من الأدوار`)
};

/**
* | output |
* | --- |
* | "More Roles" |
*
* @param {Aiinsights_Moreroles2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_moreroles2 = /** @type {((inputs?: Aiinsights_Moreroles2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Moreroles2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_moreroles2(inputs)
	if (locale === "es") return es_aiinsights_moreroles2(inputs)
	if (locale === "fr") return fr_aiinsights_moreroles2(inputs)
	return ar_aiinsights_moreroles2(inputs)
});
export { aiinsights_moreroles2 as "aiInsights.moreRoles" }