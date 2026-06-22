/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Recipient_Activitystartdate4Inputs */

const en_developerportal_credentialbuilder_recipient_activitystartdate4 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Activitystartdate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Activity Start Date`)
};

const es_developerportal_credentialbuilder_recipient_activitystartdate4 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Activitystartdate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fecha de Inicio`)
};

const fr_developerportal_credentialbuilder_recipient_activitystartdate4 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Activitystartdate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Date de Début`)
};

const ar_developerportal_credentialbuilder_recipient_activitystartdate4 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Activitystartdate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تاريخ البدء`)
};

/**
* | output |
* | --- |
* | "Activity Start Date" |
*
* @param {Developerportal_Credentialbuilder_Recipient_Activitystartdate4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_recipient_activitystartdate4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Recipient_Activitystartdate4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Recipient_Activitystartdate4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_recipient_activitystartdate4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_recipient_activitystartdate4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_recipient_activitystartdate4(inputs)
	return ar_developerportal_credentialbuilder_recipient_activitystartdate4(inputs)
});
export { developerportal_credentialbuilder_recipient_activitystartdate4 as "developerPortal.credentialBuilder.recipient.activityStartDate" }