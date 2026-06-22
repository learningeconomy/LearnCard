/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievementslist_Resultsdescription4Inputs */

const en_developerportal_credentialbuilder_achievementslist_resultsdescription4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Resultsdescription4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Achieved outcomes for this entry — e.g., a letter grade (A), score (95%), or proficiency level.`)
};

const es_developerportal_credentialbuilder_achievementslist_resultsdescription4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Resultsdescription4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Resultados obtenidos para esta entrada — ej., una calificación (A), puntuación (95%) o nivel de competencia.`)
};

const fr_developerportal_credentialbuilder_achievementslist_resultsdescription4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Resultsdescription4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Résultats obtenus pour cette entrée — ex., une note (A), un score (95%) ou un niveau de compétence.`)
};

const ar_developerportal_credentialbuilder_achievementslist_resultsdescription4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Resultsdescription4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`النتائج المحققة لهذا الإدخال — مثال: درجة حرفية (A)، نقاط (95%)، أو مستوى كفاءة.`)
};

/**
* | output |
* | --- |
* | "Achieved outcomes for this entry — e.g., a letter grade (A), score (95%), or proficiency level." |
*
* @param {Developerportal_Credentialbuilder_Achievementslist_Resultsdescription4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievementslist_resultsdescription4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievementslist_Resultsdescription4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievementslist_Resultsdescription4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievementslist_resultsdescription4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievementslist_resultsdescription4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievementslist_resultsdescription4(inputs)
	return ar_developerportal_credentialbuilder_achievementslist_resultsdescription4(inputs)
});
export { developerportal_credentialbuilder_achievementslist_resultsdescription4 as "developerPortal.credentialBuilder.achievementsList.resultsDescription" }