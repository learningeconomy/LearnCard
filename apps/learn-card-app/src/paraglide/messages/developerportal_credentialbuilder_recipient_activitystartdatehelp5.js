/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Recipient_Activitystartdatehelp5Inputs */

const en_developerportal_credentialbuilder_recipient_activitystartdatehelp5 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Activitystartdatehelp5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`When the activity started`)
};

const es_developerportal_credentialbuilder_recipient_activitystartdatehelp5 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Activitystartdatehelp5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cuándo comenzó la actividad`)
};

const fr_developerportal_credentialbuilder_recipient_activitystartdatehelp5 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Activitystartdatehelp5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Quand l'activité a commencé`)
};

const ar_developerportal_credentialbuilder_recipient_activitystartdatehelp5 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Activitystartdatehelp5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`متى بدأ النشاط`)
};

/**
* | output |
* | --- |
* | "When the activity started" |
*
* @param {Developerportal_Credentialbuilder_Recipient_Activitystartdatehelp5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_recipient_activitystartdatehelp5 = /** @type {((inputs?: Developerportal_Credentialbuilder_Recipient_Activitystartdatehelp5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Recipient_Activitystartdatehelp5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_recipient_activitystartdatehelp5(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_recipient_activitystartdatehelp5(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_recipient_activitystartdatehelp5(inputs)
	return ar_developerportal_credentialbuilder_recipient_activitystartdatehelp5(inputs)
});
export { developerportal_credentialbuilder_recipient_activitystartdatehelp5 as "developerPortal.credentialBuilder.recipient.activityStartDateHelp" }