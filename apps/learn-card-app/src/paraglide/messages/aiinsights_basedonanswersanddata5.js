/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Basedonanswersanddata5Inputs */

const en_aiinsights_basedonanswersanddata5 = /** @type {(inputs: Aiinsights_Basedonanswersanddata5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Based on your answers and occupation data.`)
};

const es_aiinsights_basedonanswersanddata5 = /** @type {(inputs: Aiinsights_Basedonanswersanddata5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Basado en tus respuestas y datos de ocupación.`)
};

const fr_aiinsights_basedonanswersanddata5 = /** @type {(inputs: Aiinsights_Basedonanswersanddata5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Basé sur vos réponses et les données professionnelles.`)
};

const ar_aiinsights_basedonanswersanddata5 = /** @type {(inputs: Aiinsights_Basedonanswersanddata5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بناءً على إجاباتك وبيانات المهنة.`)
};

/**
* | output |
* | --- |
* | "Based on your answers and occupation data." |
*
* @param {Aiinsights_Basedonanswersanddata5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_basedonanswersanddata5 = /** @type {((inputs?: Aiinsights_Basedonanswersanddata5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Basedonanswersanddata5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_basedonanswersanddata5(inputs)
	if (locale === "es") return es_aiinsights_basedonanswersanddata5(inputs)
	if (locale === "fr") return fr_aiinsights_basedonanswersanddata5(inputs)
	return ar_aiinsights_basedonanswersanddata5(inputs)
});
export { aiinsights_basedonanswersanddata5 as "aiInsights.basedOnAnswersAndData" }