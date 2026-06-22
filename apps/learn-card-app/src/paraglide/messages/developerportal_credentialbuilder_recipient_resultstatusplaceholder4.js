/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Recipient_Resultstatusplaceholder4Inputs */

const en_developerportal_credentialbuilder_recipient_resultstatusplaceholder4 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Resultstatusplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`e.g., Completed, Passed`)
};

const es_developerportal_credentialbuilder_recipient_resultstatusplaceholder4 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Resultstatusplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ej., Completado, Aprobado`)
};

const fr_developerportal_credentialbuilder_recipient_resultstatusplaceholder4 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Resultstatusplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ex., Terminé, Réussi`)
};

const ar_developerportal_credentialbuilder_recipient_resultstatusplaceholder4 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Resultstatusplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مثال: مكتمل, ناجح`)
};

/**
* | output |
* | --- |
* | "e.g., Completed, Passed" |
*
* @param {Developerportal_Credentialbuilder_Recipient_Resultstatusplaceholder4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_recipient_resultstatusplaceholder4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Recipient_Resultstatusplaceholder4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Recipient_Resultstatusplaceholder4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_recipient_resultstatusplaceholder4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_recipient_resultstatusplaceholder4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_recipient_resultstatusplaceholder4(inputs)
	return ar_developerportal_credentialbuilder_recipient_resultstatusplaceholder4(inputs)
});
export { developerportal_credentialbuilder_recipient_resultstatusplaceholder4 as "developerPortal.credentialBuilder.recipient.resultStatusPlaceholder" }