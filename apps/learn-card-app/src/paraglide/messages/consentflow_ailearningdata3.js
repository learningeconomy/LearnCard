/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Ailearningdata3Inputs */

const en_consentflow_ailearningdata3 = /** @type {(inputs: Consentflow_Ailearningdata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI Learning Data`)
};

const es_consentflow_ailearningdata3 = /** @type {(inputs: Consentflow_Ailearningdata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Datos de Aprendizaje de IA`)
};

const fr_consentflow_ailearningdata3 = /** @type {(inputs: Consentflow_Ailearningdata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Données d'apprentissage IA`)
};

const ar_consentflow_ailearningdata3 = /** @type {(inputs: Consentflow_Ailearningdata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بيانات التعلّم بالذكاء الاصطناعي`)
};

/**
* | output |
* | --- |
* | "AI Learning Data" |
*
* @param {Consentflow_Ailearningdata3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_ailearningdata3 = /** @type {((inputs?: Consentflow_Ailearningdata3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Ailearningdata3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_ailearningdata3(inputs)
	if (locale === "es") return es_consentflow_ailearningdata3(inputs)
	if (locale === "fr") return fr_consentflow_ailearningdata3(inputs)
	return ar_consentflow_ailearningdata3(inputs)
});
export { consentflow_ailearningdata3 as "consentFlow.aiLearningData" }