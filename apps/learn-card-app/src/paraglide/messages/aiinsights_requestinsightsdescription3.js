/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Requestinsightsdescription3Inputs */

const en_aiinsights_requestinsightsdescription3 = /** @type {(inputs: Aiinsights_Requestinsightsdescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Request to see Top Skills, Learning Snapshots, and Suggested Pathways. You will also be able to send learning pathway suggestions.`)
};

const es_aiinsights_requestinsightsdescription3 = /** @type {(inputs: Aiinsights_Requestinsightsdescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solicita ver Habilidades principales, Instantáneas de aprendizaje y Rutas sugeridas. También podrás enviar sugerencias de rutas de aprendizaje.`)
};

const fr_aiinsights_requestinsightsdescription3 = /** @type {(inputs: Aiinsights_Requestinsightsdescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demandez à voir les Compétences principales, les Instantanés d'apprentissage et les Parcours suggérés. Vous pourrez également envoyer des suggestions de parcours d'apprentissage.`)
};

const ar_aiinsights_requestinsightsdescription3 = /** @type {(inputs: Aiinsights_Requestinsightsdescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اطلب الاطلاع على أهم المهارات ولقطات التعلم والمسارات المقترحة. ستتمكن أيضًا من إرسال اقتراحات مسارات التعلم.`)
};

/**
* | output |
* | --- |
* | "Request to see Top Skills, Learning Snapshots, and Suggested Pathways. You will also be able to send learning pathway suggestions." |
*
* @param {Aiinsights_Requestinsightsdescription3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_requestinsightsdescription3 = /** @type {((inputs?: Aiinsights_Requestinsightsdescription3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Requestinsightsdescription3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_requestinsightsdescription3(inputs)
	if (locale === "es") return es_aiinsights_requestinsightsdescription3(inputs)
	if (locale === "fr") return fr_aiinsights_requestinsightsdescription3(inputs)
	return ar_aiinsights_requestinsightsdescription3(inputs)
});
export { aiinsights_requestinsightsdescription3 as "aiInsights.requestInsightsDescription" }