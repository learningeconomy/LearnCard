/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Activity_Emptytitle1Inputs */

const en_dashboard_activity_emptytitle1 = /** @type {(inputs: Dashboard_Activity_Emptytitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No alerts right now`)
};

const es_dashboard_activity_emptytitle1 = /** @type {(inputs: Dashboard_Activity_Emptytitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No hay alertas por ahora`)
};

const fr_dashboard_activity_emptytitle1 = /** @type {(inputs: Dashboard_Activity_Emptytitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune alerte pour le moment`)
};

const ar_dashboard_activity_emptytitle1 = /** @type {(inputs: Dashboard_Activity_Emptytitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد تنبيهات الآن`)
};

/**
* | output |
* | --- |
* | "No alerts right now" |
*
* @param {Dashboard_Activity_Emptytitle1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_activity_emptytitle1 = /** @type {((inputs?: Dashboard_Activity_Emptytitle1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Activity_Emptytitle1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_activity_emptytitle1(inputs)
	if (locale === "es") return es_dashboard_activity_emptytitle1(inputs)
	if (locale === "fr") return fr_dashboard_activity_emptytitle1(inputs)
	return ar_dashboard_activity_emptytitle1(inputs)
});
export { dashboard_activity_emptytitle1 as "dashboard.activity.emptyTitle" }