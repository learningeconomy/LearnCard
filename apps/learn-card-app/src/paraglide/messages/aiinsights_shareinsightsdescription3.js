/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Shareinsightsdescription3Inputs */

const en_aiinsights_shareinsightsdescription3 = /** @type {(inputs: Aiinsights_Shareinsightsdescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Share your Top Skills, Learning Snapshots, and Suggested Pathways. You will also be able to receive learning pathway suggestions.`)
};

const es_aiinsights_shareinsightsdescription3 = /** @type {(inputs: Aiinsights_Shareinsightsdescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Comparte tus Habilidades principales, Instantáneas de aprendizaje y Rutas sugeridas. También podrás recibir sugerencias de rutas de aprendizaje.`)
};

const fr_aiinsights_shareinsightsdescription3 = /** @type {(inputs: Aiinsights_Shareinsightsdescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Partagez vos Compétences principales, Instantanés d'apprentissage et Parcours suggérés. Vous pourrez également recevoir des suggestions de parcours d'apprentissage.`)
};

const ar_aiinsights_shareinsightsdescription3 = /** @type {(inputs: Aiinsights_Shareinsightsdescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`شارك أهم مهاراتك ولقطات التعلم والمسارات المقترحة. ستتمكن أيضًا من تلقي اقتراحات مسارات التعلم.`)
};

/**
* | output |
* | --- |
* | "Share your Top Skills, Learning Snapshots, and Suggested Pathways. You will also be able to receive learning pathway suggestions." |
*
* @param {Aiinsights_Shareinsightsdescription3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_shareinsightsdescription3 = /** @type {((inputs?: Aiinsights_Shareinsightsdescription3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Shareinsightsdescription3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_shareinsightsdescription3(inputs)
	if (locale === "es") return es_aiinsights_shareinsightsdescription3(inputs)
	if (locale === "fr") return fr_aiinsights_shareinsightsdescription3(inputs)
	return ar_aiinsights_shareinsightsdescription3(inputs)
});
export { aiinsights_shareinsightsdescription3 as "aiInsights.shareInsightsDescription" }