/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Activity_Csvstatus_Sent2Inputs */

const en_developerportal_dashboards_activity_csvstatus_sent2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Csvstatus_Sent2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sent`)
};

const es_developerportal_dashboards_activity_csvstatus_sent2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Csvstatus_Sent2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviado`)
};

const fr_developerportal_dashboards_activity_csvstatus_sent2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Csvstatus_Sent2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoyé`)
};

const ar_developerportal_dashboards_activity_csvstatus_sent2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Csvstatus_Sent2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم الإرسال`)
};

/**
* | output |
* | --- |
* | "Sent" |
*
* @param {Developerportal_Dashboards_Activity_Csvstatus_Sent2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_activity_csvstatus_sent2 = /** @type {((inputs?: Developerportal_Dashboards_Activity_Csvstatus_Sent2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Activity_Csvstatus_Sent2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_activity_csvstatus_sent2(inputs)
	if (locale === "es") return es_developerportal_dashboards_activity_csvstatus_sent2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_activity_csvstatus_sent2(inputs)
	return ar_developerportal_dashboards_activity_csvstatus_sent2(inputs)
});
export { developerportal_dashboards_activity_csvstatus_sent2 as "developerPortal.dashboards.activity.csvStatus.sent" }