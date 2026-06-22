/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Contractdescription2Inputs */

const en_aiinsights_contractdescription2 = /** @type {(inputs: Aiinsights_Contractdescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Allows your teacher to view selected insights`)
};

const es_aiinsights_contractdescription2 = /** @type {(inputs: Aiinsights_Contractdescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Permite a tu profesor ver los insights seleccionados`)
};

const fr_aiinsights_contractdescription2 = /** @type {(inputs: Aiinsights_Contractdescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Permet à votre enseignant de voir les insights sélectionnés`)
};

const ar_aiinsights_contractdescription2 = /** @type {(inputs: Aiinsights_Contractdescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يتيح لمعلمك عرض الرؤى المحددة`)
};

/**
* | output |
* | --- |
* | "Allows your teacher to view selected insights" |
*
* @param {Aiinsights_Contractdescription2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_contractdescription2 = /** @type {((inputs?: Aiinsights_Contractdescription2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Contractdescription2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_contractdescription2(inputs)
	if (locale === "es") return es_aiinsights_contractdescription2(inputs)
	if (locale === "fr") return fr_aiinsights_contractdescription2(inputs)
	return ar_aiinsights_contractdescription2(inputs)
});
export { aiinsights_contractdescription2 as "aiInsights.contractDescription" }