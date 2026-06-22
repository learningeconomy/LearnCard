/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Activity_Sent1Inputs */

const en_developerportal_dashboards_activity_sent1 = /** @type {(inputs: Developerportal_Dashboards_Activity_Sent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sent`)
};

const es_developerportal_dashboards_activity_sent1 = /** @type {(inputs: Developerportal_Dashboards_Activity_Sent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviado`)
};

const fr_developerportal_dashboards_activity_sent1 = /** @type {(inputs: Developerportal_Dashboards_Activity_Sent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoyé`)
};

const ar_developerportal_dashboards_activity_sent1 = /** @type {(inputs: Developerportal_Dashboards_Activity_Sent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم الإرسال`)
};

/**
* | output |
* | --- |
* | "Sent" |
*
* @param {Developerportal_Dashboards_Activity_Sent1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_activity_sent1 = /** @type {((inputs?: Developerportal_Dashboards_Activity_Sent1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Activity_Sent1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_activity_sent1(inputs)
	if (locale === "es") return es_developerportal_dashboards_activity_sent1(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_activity_sent1(inputs)
	return ar_developerportal_dashboards_activity_sent1(inputs)
});
export { developerportal_dashboards_activity_sent1 as "developerPortal.dashboards.activity.sent" }