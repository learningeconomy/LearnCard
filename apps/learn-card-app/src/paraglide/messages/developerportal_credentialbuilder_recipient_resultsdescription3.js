/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Recipient_Resultsdescription3Inputs */

const en_developerportal_credentialbuilder_recipient_resultsdescription3 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Resultsdescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Record grades, scores, or completion status`)
};

const es_developerportal_credentialbuilder_recipient_resultsdescription3 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Resultsdescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Registra calificaciones, puntuaciones o estado de finalización`)
};

const fr_developerportal_credentialbuilder_recipient_resultsdescription3 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Resultsdescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enregistrer les notes, scores ou statut d'achèvement`)
};

const ar_developerportal_credentialbuilder_recipient_resultsdescription3 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Resultsdescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تسجيل الدرجات أو النقاط أو حالة الإكمال`)
};

/**
* | output |
* | --- |
* | "Record grades, scores, or completion status" |
*
* @param {Developerportal_Credentialbuilder_Recipient_Resultsdescription3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_recipient_resultsdescription3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Recipient_Resultsdescription3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Recipient_Resultsdescription3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_recipient_resultsdescription3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_recipient_resultsdescription3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_recipient_resultsdescription3(inputs)
	return ar_developerportal_credentialbuilder_recipient_resultsdescription3(inputs)
});
export { developerportal_credentialbuilder_recipient_resultsdescription3 as "developerPortal.credentialBuilder.recipient.resultsDescription" }