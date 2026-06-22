/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipathways_Explorerolessubtitle3Inputs */

const en_aipathways_explorerolessubtitle3 = /** @type {(inputs: Aipathways_Explorerolessubtitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use your current skills to start new opportunities.`)
};

const es_aipathways_explorerolessubtitle3 = /** @type {(inputs: Aipathways_Explorerolessubtitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Usa tus habilidades actuales para iniciar nuevas oportunidades.`)
};

const fr_aipathways_explorerolessubtitle3 = /** @type {(inputs: Aipathways_Explorerolessubtitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Utilisez vos compétences actuelles pour saisir de nouvelles opportunités.`)
};

const ar_aipathways_explorerolessubtitle3 = /** @type {(inputs: Aipathways_Explorerolessubtitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استخدم مهاراتك الحالية لبدء فرص جديدة.`)
};

/**
* | output |
* | --- |
* | "Use your current skills to start new opportunities." |
*
* @param {Aipathways_Explorerolessubtitle3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipathways_explorerolessubtitle3 = /** @type {((inputs?: Aipathways_Explorerolessubtitle3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipathways_Explorerolessubtitle3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipathways_explorerolessubtitle3(inputs)
	if (locale === "es") return es_aipathways_explorerolessubtitle3(inputs)
	if (locale === "fr") return fr_aipathways_explorerolessubtitle3(inputs)
	return ar_aipathways_explorerolessubtitle3(inputs)
});
export { aipathways_explorerolessubtitle3 as "aiPathways.exploreRolesSubtitle" }