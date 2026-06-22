/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Recipient_Activityenddatehelp5Inputs */

const en_developerportal_credentialbuilder_recipient_activityenddatehelp5 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Activityenddatehelp5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`When the activity ended (completion date)`)
};

const es_developerportal_credentialbuilder_recipient_activityenddatehelp5 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Activityenddatehelp5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cuándo terminó la actividad (fecha de finalización)`)
};

const fr_developerportal_credentialbuilder_recipient_activityenddatehelp5 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Activityenddatehelp5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Quand l'activité s'est terminée (date d'achèvement)`)
};

const ar_developerportal_credentialbuilder_recipient_activityenddatehelp5 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Activityenddatehelp5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`متى انتهى النشاط (تاريخ الإكمال)`)
};

/**
* | output |
* | --- |
* | "When the activity ended (completion date)" |
*
* @param {Developerportal_Credentialbuilder_Recipient_Activityenddatehelp5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_recipient_activityenddatehelp5 = /** @type {((inputs?: Developerportal_Credentialbuilder_Recipient_Activityenddatehelp5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Recipient_Activityenddatehelp5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_recipient_activityenddatehelp5(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_recipient_activityenddatehelp5(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_recipient_activityenddatehelp5(inputs)
	return ar_developerportal_credentialbuilder_recipient_activityenddatehelp5(inputs)
});
export { developerportal_credentialbuilder_recipient_activityenddatehelp5 as "developerPortal.credentialBuilder.recipient.activityEndDateHelp" }