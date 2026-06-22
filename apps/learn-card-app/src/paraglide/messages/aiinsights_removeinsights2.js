/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Removeinsights2Inputs */

const en_aiinsights_removeinsights2 = /** @type {(inputs: Aiinsights_Removeinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Remove Insights`)
};

const es_aiinsights_removeinsights2 = /** @type {(inputs: Aiinsights_Removeinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eliminar Insights`)
};

const fr_aiinsights_removeinsights2 = /** @type {(inputs: Aiinsights_Removeinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Supprimer les Insights`)
};

const ar_aiinsights_removeinsights2 = /** @type {(inputs: Aiinsights_Removeinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إزالة الرؤى`)
};

/**
* | output |
* | --- |
* | "Remove Insights" |
*
* @param {Aiinsights_Removeinsights2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_removeinsights2 = /** @type {((inputs?: Aiinsights_Removeinsights2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Removeinsights2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_removeinsights2(inputs)
	if (locale === "es") return es_aiinsights_removeinsights2(inputs)
	if (locale === "fr") return fr_aiinsights_removeinsights2(inputs)
	return ar_aiinsights_removeinsights2(inputs)
});
export { aiinsights_removeinsights2 as "aiInsights.removeInsights" }