/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Activity_Anapp1Inputs */

const en_dashboard_activity_anapp1 = /** @type {(inputs: Dashboard_Activity_Anapp1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`An app`)
};

const es_dashboard_activity_anapp1 = /** @type {(inputs: Dashboard_Activity_Anapp1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Una app`)
};

const fr_dashboard_activity_anapp1 = /** @type {(inputs: Dashboard_Activity_Anapp1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Une app`)
};

const ar_dashboard_activity_anapp1 = /** @type {(inputs: Dashboard_Activity_Anapp1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تطبيق`)
};

/**
* | output |
* | --- |
* | "An app" |
*
* @param {Dashboard_Activity_Anapp1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_activity_anapp1 = /** @type {((inputs?: Dashboard_Activity_Anapp1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Activity_Anapp1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_activity_anapp1(inputs)
	if (locale === "es") return es_dashboard_activity_anapp1(inputs)
	if (locale === "fr") return fr_dashboard_activity_anapp1(inputs)
	return ar_dashboard_activity_anapp1(inputs)
});
export { dashboard_activity_anapp1 as "dashboard.activity.anApp" }