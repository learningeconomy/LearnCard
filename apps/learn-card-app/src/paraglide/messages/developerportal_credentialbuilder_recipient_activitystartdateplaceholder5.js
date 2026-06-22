/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Recipient_Activitystartdateplaceholder5Inputs */

const en_developerportal_credentialbuilder_recipient_activitystartdateplaceholder5 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Activitystartdateplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`YYYY-MM-DD`)
};

const es_developerportal_credentialbuilder_recipient_activitystartdateplaceholder5 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Activitystartdateplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AAAA-MM-DD`)
};

const fr_developerportal_credentialbuilder_recipient_activitystartdateplaceholder5 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Activitystartdateplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AAAA-MM-JJ`)
};

const ar_developerportal_credentialbuilder_recipient_activitystartdateplaceholder5 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Activitystartdateplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`YYYY-MM-DD`)
};

/**
* | output |
* | --- |
* | "YYYY-MM-DD" |
*
* @param {Developerportal_Credentialbuilder_Recipient_Activitystartdateplaceholder5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_recipient_activitystartdateplaceholder5 = /** @type {((inputs?: Developerportal_Credentialbuilder_Recipient_Activitystartdateplaceholder5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Recipient_Activitystartdateplaceholder5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_recipient_activitystartdateplaceholder5(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_recipient_activitystartdateplaceholder5(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_recipient_activitystartdateplaceholder5(inputs)
	return ar_developerportal_credentialbuilder_recipient_activitystartdateplaceholder5(inputs)
});
export { developerportal_credentialbuilder_recipient_activitystartdateplaceholder5 as "developerPortal.credentialBuilder.recipient.activityStartDatePlaceholder" }