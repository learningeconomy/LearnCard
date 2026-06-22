/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipathways_Ailearningsessions3Inputs */

const en_aipathways_ailearningsessions3 = /** @type {(inputs: Aipathways_Ailearningsessions3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI Learning Sessions`)
};

const es_aipathways_ailearningsessions3 = /** @type {(inputs: Aipathways_Ailearningsessions3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sesiones de aprendizaje con IA`)
};

const fr_aipathways_ailearningsessions3 = /** @type {(inputs: Aipathways_Ailearningsessions3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sessions d'apprentissage par IA`)
};

const ar_aipathways_ailearningsessions3 = /** @type {(inputs: Aipathways_Ailearningsessions3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جلسات التعلّم بالذكاء الاصطناعي`)
};

/**
* | output |
* | --- |
* | "AI Learning Sessions" |
*
* @param {Aipathways_Ailearningsessions3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipathways_ailearningsessions3 = /** @type {((inputs?: Aipathways_Ailearningsessions3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipathways_Ailearningsessions3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipathways_ailearningsessions3(inputs)
	if (locale === "es") return es_aipathways_ailearningsessions3(inputs)
	if (locale === "fr") return fr_aipathways_ailearningsessions3(inputs)
	return ar_aipathways_ailearningsessions3(inputs)
});
export { aipathways_ailearningsessions3 as "aiPathways.aiLearningSessions" }