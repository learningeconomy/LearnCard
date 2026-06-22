/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Recipient_Activitydetails3Inputs */

const en_developerportal_credentialbuilder_recipient_activitydetails3 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Activitydetails3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Activity Details`)
};

const es_developerportal_credentialbuilder_recipient_activitydetails3 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Activitydetails3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Detalles de la Actividad`)
};

const fr_developerportal_credentialbuilder_recipient_activitydetails3 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Activitydetails3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Détails de l'Activité`)
};

const ar_developerportal_credentialbuilder_recipient_activitydetails3 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Activitydetails3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تفاصيل النشاط`)
};

/**
* | output |
* | --- |
* | "Activity Details" |
*
* @param {Developerportal_Credentialbuilder_Recipient_Activitydetails3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_recipient_activitydetails3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Recipient_Activitydetails3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Recipient_Activitydetails3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_recipient_activitydetails3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_recipient_activitydetails3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_recipient_activitydetails3(inputs)
	return ar_developerportal_credentialbuilder_recipient_activitydetails3(inputs)
});
export { developerportal_credentialbuilder_recipient_activitydetails3 as "developerPortal.credentialBuilder.recipient.activityDetails" }