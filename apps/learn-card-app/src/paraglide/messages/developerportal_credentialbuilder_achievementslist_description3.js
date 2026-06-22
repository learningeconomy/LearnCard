/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievementslist_Description3Inputs */

const en_developerportal_credentialbuilder_achievementslist_description3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add multiple achievements to this CLR credential. Each achievement represents a distinct learning outcome or competency.`)
};

const es_developerportal_credentialbuilder_achievementslist_description3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añade múltiples logros a esta credencial CLR. Cada logro representa un resultado de aprendizaje o competencia distinto.`)
};

const fr_developerportal_credentialbuilder_achievementslist_description3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajoutez plusieurs réalisations à ce crédential CLR. Chaque réalisation représente un résultat d'apprentissage ou une compétence distinct.`)
};

const ar_developerportal_credentialbuilder_achievementslist_description3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أضف إنجازات متعددة إلى اعتماد CLR هذا. يمثل كل إنجاز نتيجة تعلم أو كفاءة متميزة.`)
};

/**
* | output |
* | --- |
* | "Add multiple achievements to this CLR credential. Each achievement represents a distinct learning outcome or competency." |
*
* @param {Developerportal_Credentialbuilder_Achievementslist_Description3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievementslist_description3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievementslist_Description3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievementslist_Description3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievementslist_description3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievementslist_description3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievementslist_description3(inputs)
	return ar_developerportal_credentialbuilder_achievementslist_description3(inputs)
});
export { developerportal_credentialbuilder_achievementslist_description3 as "developerPortal.credentialBuilder.achievementsList.description" }