/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Activity_Viewallpending2Inputs */

const en_dashboard_activity_viewallpending2 = /** @type {(inputs: Dashboard_Activity_Viewallpending2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`View all pending →`)
};

const es_dashboard_activity_viewallpending2 = /** @type {(inputs: Dashboard_Activity_Viewallpending2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ver todo lo pendiente →`)
};

const fr_dashboard_activity_viewallpending2 = /** @type {(inputs: Dashboard_Activity_Viewallpending2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voir tout ce qui est en attente →`)
};

const ar_dashboard_activity_viewallpending2 = /** @type {(inputs: Dashboard_Activity_Viewallpending2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عرض كل المعلّق →`)
};

/**
* | output |
* | --- |
* | "View all pending →" |
*
* @param {Dashboard_Activity_Viewallpending2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_activity_viewallpending2 = /** @type {((inputs?: Dashboard_Activity_Viewallpending2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Activity_Viewallpending2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_activity_viewallpending2(inputs)
	if (locale === "es") return es_dashboard_activity_viewallpending2(inputs)
	if (locale === "fr") return fr_dashboard_activity_viewallpending2(inputs)
	return ar_dashboard_activity_viewallpending2(inputs)
});
export { dashboard_activity_viewallpending2 as "dashboard.activity.viewAllPending" }