/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipathways_Discovery_Connectdescription2Inputs */

const en_aipathways_discovery_connectdescription2 = /** @type {(inputs: Aipathways_Discovery_Connectdescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pathways connect your skills to relevant courses, careers, salaries, and learning content.`)
};

const es_aipathways_discovery_connectdescription2 = /** @type {(inputs: Aipathways_Discovery_Connectdescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pathways conecta tus habilidades con cursos, carreras, salarios y contenido de aprendizaje relevantes.`)
};

const fr_aipathways_discovery_connectdescription2 = /** @type {(inputs: Aipathways_Discovery_Connectdescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pathways relie vos compétences à des cours, des carrières, des salaires et du contenu d'apprentissage pertinents.`)
};

const ar_aipathways_discovery_connectdescription2 = /** @type {(inputs: Aipathways_Discovery_Connectdescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تربط المسارات مهاراتك بالدورات والمهن والرواتب ومحتوى التعلّم ذي الصلة.`)
};

/**
* | output |
* | --- |
* | "Pathways connect your skills to relevant courses, careers, salaries, and learning content." |
*
* @param {Aipathways_Discovery_Connectdescription2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipathways_discovery_connectdescription2 = /** @type {((inputs?: Aipathways_Discovery_Connectdescription2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipathways_Discovery_Connectdescription2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipathways_discovery_connectdescription2(inputs)
	if (locale === "es") return es_aipathways_discovery_connectdescription2(inputs)
	if (locale === "fr") return fr_aipathways_discovery_connectdescription2(inputs)
	return ar_aipathways_discovery_connectdescription2(inputs)
});
export { aipathways_discovery_connectdescription2 as "aiPathways.discovery.connectDescription" }