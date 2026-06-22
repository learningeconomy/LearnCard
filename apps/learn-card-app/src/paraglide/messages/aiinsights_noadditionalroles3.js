/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Noadditionalroles3Inputs */

const en_aiinsights_noadditionalroles3 = /** @type {(inputs: Aiinsights_Noadditionalroles3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No additional roles are available yet.`)
};

const es_aiinsights_noadditionalroles3 = /** @type {(inputs: Aiinsights_Noadditionalroles3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No hay roles adicionales disponibles aún.`)
};

const fr_aiinsights_noadditionalroles3 = /** @type {(inputs: Aiinsights_Noadditionalroles3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun rôle supplémentaire disponible pour le moment.`)
};

const ar_aiinsights_noadditionalroles3 = /** @type {(inputs: Aiinsights_Noadditionalroles3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد أدوار إضافية متاحة بعد.`)
};

/**
* | output |
* | --- |
* | "No additional roles are available yet." |
*
* @param {Aiinsights_Noadditionalroles3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_noadditionalroles3 = /** @type {((inputs?: Aiinsights_Noadditionalroles3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Noadditionalroles3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_noadditionalroles3(inputs)
	if (locale === "es") return es_aiinsights_noadditionalroles3(inputs)
	if (locale === "fr") return fr_aiinsights_noadditionalroles3(inputs)
	return ar_aiinsights_noadditionalroles3(inputs)
});
export { aiinsights_noadditionalroles3 as "aiInsights.noAdditionalRoles" }