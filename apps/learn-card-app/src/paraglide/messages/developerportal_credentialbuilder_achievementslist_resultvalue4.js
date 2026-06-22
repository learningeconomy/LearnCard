/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ n: NonNullable<unknown> }} Developerportal_Credentialbuilder_Achievementslist_Resultvalue4Inputs */

const en_developerportal_credentialbuilder_achievementslist_resultvalue4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Resultvalue4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Result ${i?.n} Value`)
};

const es_developerportal_credentialbuilder_achievementslist_resultvalue4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Resultvalue4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Valor del Resultado ${i?.n}`)
};

const fr_developerportal_credentialbuilder_achievementslist_resultvalue4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Resultvalue4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Valeur du Résultat ${i?.n}`)
};

const ar_developerportal_credentialbuilder_achievementslist_resultvalue4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Resultvalue4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`قيمة النتيجة ${i?.n}`)
};

/**
* | output |
* | --- |
* | "Result {n} Value" |
*
* @param {Developerportal_Credentialbuilder_Achievementslist_Resultvalue4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievementslist_resultvalue4 = /** @type {((inputs: Developerportal_Credentialbuilder_Achievementslist_Resultvalue4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievementslist_Resultvalue4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievementslist_resultvalue4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievementslist_resultvalue4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievementslist_resultvalue4(inputs)
	return ar_developerportal_credentialbuilder_achievementslist_resultvalue4(inputs)
});
export { developerportal_credentialbuilder_achievementslist_resultvalue4 as "developerPortal.credentialBuilder.achievementsList.resultValue" }