/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Activity_Recipienttype_Phone2Inputs */

const en_developerportal_dashboards_activity_recipienttype_phone2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Recipienttype_Phone2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Phone`)
};

const es_developerportal_dashboards_activity_recipienttype_phone2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Recipienttype_Phone2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Teléfono`)
};

const fr_developerportal_dashboards_activity_recipienttype_phone2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Recipienttype_Phone2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Téléphone`)
};

const ar_developerportal_dashboards_activity_recipienttype_phone2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Recipienttype_Phone2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الهاتف`)
};

/**
* | output |
* | --- |
* | "Phone" |
*
* @param {Developerportal_Dashboards_Activity_Recipienttype_Phone2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_activity_recipienttype_phone2 = /** @type {((inputs?: Developerportal_Dashboards_Activity_Recipienttype_Phone2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Activity_Recipienttype_Phone2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_activity_recipienttype_phone2(inputs)
	if (locale === "es") return es_developerportal_dashboards_activity_recipienttype_phone2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_activity_recipienttype_phone2(inputs)
	return ar_developerportal_dashboards_activity_recipienttype_phone2(inputs)
});
export { developerportal_dashboards_activity_recipienttype_phone2 as "developerPortal.dashboards.activity.recipientType.phone" }