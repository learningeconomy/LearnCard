/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Activity_Recipienttype_Email2Inputs */

const en_developerportal_dashboards_activity_recipienttype_email2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Recipienttype_Email2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Email`)
};

const es_developerportal_dashboards_activity_recipienttype_email2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Recipienttype_Email2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Correo`)
};

const fr_developerportal_dashboards_activity_recipienttype_email2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Recipienttype_Email2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`E-mail`)
};

const ar_developerportal_dashboards_activity_recipienttype_email2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Recipienttype_Email2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`البريد الإلكتروني`)
};

/**
* | output |
* | --- |
* | "Email" |
*
* @param {Developerportal_Dashboards_Activity_Recipienttype_Email2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_activity_recipienttype_email2 = /** @type {((inputs?: Developerportal_Dashboards_Activity_Recipienttype_Email2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Activity_Recipienttype_Email2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_activity_recipienttype_email2(inputs)
	if (locale === "es") return es_developerportal_dashboards_activity_recipienttype_email2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_activity_recipienttype_email2(inputs)
	return ar_developerportal_dashboards_activity_recipienttype_email2(inputs)
});
export { developerportal_dashboards_activity_recipienttype_email2 as "developerPortal.dashboards.activity.recipientType.email" }