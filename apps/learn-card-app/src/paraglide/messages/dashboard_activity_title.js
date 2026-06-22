/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Activity_TitleInputs */

const en_dashboard_activity_title = /** @type {(inputs: Dashboard_Activity_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Activity`)
};

const es_dashboard_activity_title = /** @type {(inputs: Dashboard_Activity_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Actividad`)
};

const fr_dashboard_activity_title = /** @type {(inputs: Dashboard_Activity_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Activité`)
};

const ar_dashboard_activity_title = /** @type {(inputs: Dashboard_Activity_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`النشاط`)
};

/**
* | output |
* | --- |
* | "Activity" |
*
* @param {Dashboard_Activity_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_activity_title = /** @type {((inputs?: Dashboard_Activity_TitleInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Activity_TitleInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_activity_title(inputs)
	if (locale === "es") return es_dashboard_activity_title(inputs)
	if (locale === "fr") return fr_dashboard_activity_title(inputs)
	return ar_dashboard_activity_title(inputs)
});
export { dashboard_activity_title as "dashboard.activity.title" }