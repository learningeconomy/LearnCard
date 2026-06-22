/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Recipient_Activityenddate4Inputs */

const en_developerportal_credentialbuilder_recipient_activityenddate4 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Activityenddate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Activity End Date`)
};

const es_developerportal_credentialbuilder_recipient_activityenddate4 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Activityenddate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fecha de Fin`)
};

const fr_developerportal_credentialbuilder_recipient_activityenddate4 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Activityenddate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Date de Fin`)
};

const ar_developerportal_credentialbuilder_recipient_activityenddate4 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Activityenddate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تاريخ الانتهاء`)
};

/**
* | output |
* | --- |
* | "Activity End Date" |
*
* @param {Developerportal_Credentialbuilder_Recipient_Activityenddate4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_recipient_activityenddate4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Recipient_Activityenddate4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Recipient_Activityenddate4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_recipient_activityenddate4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_recipient_activityenddate4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_recipient_activityenddate4(inputs)
	return ar_developerportal_credentialbuilder_recipient_activityenddate4(inputs)
});
export { developerportal_credentialbuilder_recipient_activityenddate4 as "developerPortal.credentialBuilder.recipient.activityEndDate" }