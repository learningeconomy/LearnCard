/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ brand: NonNullable<unknown> }} Aipathways_Discovery_Buildtounlock3Inputs */

const en_aipathways_discovery_buildtounlock3 = /** @type {(inputs: Aipathways_Discovery_Buildtounlock3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Build your ${i?.brand} to unlock personalized pathways to discover career routes and learning experiences aligned with your skills.`)
};

const es_aipathways_discovery_buildtounlock3 = /** @type {(inputs: Aipathways_Discovery_Buildtounlock3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Crea tu ${i?.brand} para desbloquear rutas personalizadas y descubrir trayectorias profesionales y experiencias de aprendizaje alineadas con tus habilidades.`)
};

const fr_aipathways_discovery_buildtounlock3 = /** @type {(inputs: Aipathways_Discovery_Buildtounlock3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Construisez votre ${i?.brand} pour débloquer des parcours personnalisés et découvrir des trajectoires professionnelles et des expériences d'apprentissage adaptées à vos compétences.`)
};

const ar_aipathways_discovery_buildtounlock3 = /** @type {(inputs: Aipathways_Discovery_Buildtounlock3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`ابنِ ${i?.brand} الخاص بك لفتح مسارات مخصّصة واكتشاف مسارات مهنية وتجارب تعلّم تتوافق مع مهاراتك.`)
};

/**
* | output |
* | --- |
* | "Build your {brand} to unlock personalized pathways to discover career routes and learning experiences aligned with your skills." |
*
* @param {Aipathways_Discovery_Buildtounlock3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipathways_discovery_buildtounlock3 = /** @type {((inputs: Aipathways_Discovery_Buildtounlock3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipathways_Discovery_Buildtounlock3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipathways_discovery_buildtounlock3(inputs)
	if (locale === "es") return es_aipathways_discovery_buildtounlock3(inputs)
	if (locale === "fr") return fr_aipathways_discovery_buildtounlock3(inputs)
	return ar_aipathways_discovery_buildtounlock3(inputs)
});
export { aipathways_discovery_buildtounlock3 as "aiPathways.discovery.buildToUnlock" }