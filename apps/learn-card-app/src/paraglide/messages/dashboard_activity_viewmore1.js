/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Dashboard_Activity_Viewmore1Inputs */

const en_dashboard_activity_viewmore1 = /** @type {(inputs: Dashboard_Activity_Viewmore1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`View ${i?.count} more →`)
};

const es_dashboard_activity_viewmore1 = /** @type {(inputs: Dashboard_Activity_Viewmore1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Ver ${i?.count} más →`)
};

const fr_dashboard_activity_viewmore1 = /** @type {(inputs: Dashboard_Activity_Viewmore1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Voir ${i?.count} de plus →`)
};

const ar_dashboard_activity_viewmore1 = /** @type {(inputs: Dashboard_Activity_Viewmore1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`عرض ${i?.count} إضافية →`)
};

/**
* | output |
* | --- |
* | "View {count} more →" |
*
* @param {Dashboard_Activity_Viewmore1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_activity_viewmore1 = /** @type {((inputs: Dashboard_Activity_Viewmore1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Activity_Viewmore1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_activity_viewmore1(inputs)
	if (locale === "es") return es_dashboard_activity_viewmore1(inputs)
	if (locale === "fr") return fr_dashboard_activity_viewmore1(inputs)
	return ar_dashboard_activity_viewmore1(inputs)
});
export { dashboard_activity_viewmore1 as "dashboard.activity.viewMore" }