/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Nosuggestedroles3Inputs */

const en_aiinsights_nosuggestedroles3 = /** @type {(inputs: Aiinsights_Nosuggestedroles3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No suggested roles available yet.`)
};

const es_aiinsights_nosuggestedroles3 = /** @type {(inputs: Aiinsights_Nosuggestedroles3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no hay roles sugeridos disponibles.`)
};

const fr_aiinsights_nosuggestedroles3 = /** @type {(inputs: Aiinsights_Nosuggestedroles3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun rôle suggéré disponible pour le moment.`)
};

const ar_aiinsights_nosuggestedroles3 = /** @type {(inputs: Aiinsights_Nosuggestedroles3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد أدوار مقترحة متاحة بعد.`)
};

/**
* | output |
* | --- |
* | "No suggested roles available yet." |
*
* @param {Aiinsights_Nosuggestedroles3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_nosuggestedroles3 = /** @type {((inputs?: Aiinsights_Nosuggestedroles3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Nosuggestedroles3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_nosuggestedroles3(inputs)
	if (locale === "es") return es_aiinsights_nosuggestedroles3(inputs)
	if (locale === "fr") return fr_aiinsights_nosuggestedroles3(inputs)
	return ar_aiinsights_nosuggestedroles3(inputs)
});
export { aiinsights_nosuggestedroles3 as "aiInsights.noSuggestedRoles" }