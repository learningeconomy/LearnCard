/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Norolesfound3Inputs */

const en_aiinsights_norolesfound3 = /** @type {(inputs: Aiinsights_Norolesfound3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No roles found for that search.`)
};

const es_aiinsights_norolesfound3 = /** @type {(inputs: Aiinsights_Norolesfound3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se encontraron roles para esa búsqueda.`)
};

const fr_aiinsights_norolesfound3 = /** @type {(inputs: Aiinsights_Norolesfound3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun rôle trouvé pour cette recherche.`)
};

const ar_aiinsights_norolesfound3 = /** @type {(inputs: Aiinsights_Norolesfound3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم العثور على أدوار لهذا البحث.`)
};

/**
* | output |
* | --- |
* | "No roles found for that search." |
*
* @param {Aiinsights_Norolesfound3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_norolesfound3 = /** @type {((inputs?: Aiinsights_Norolesfound3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Norolesfound3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_norolesfound3(inputs)
	if (locale === "es") return es_aiinsights_norolesfound3(inputs)
	if (locale === "fr") return fr_aiinsights_norolesfound3(inputs)
	return ar_aiinsights_norolesfound3(inputs)
});
export { aiinsights_norolesfound3 as "aiInsights.noRolesFound" }