/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Dashboard_Activity_Wantstoconnect2Inputs */

const en_dashboard_activity_wantstoconnect2 = /** @type {(inputs: Dashboard_Activity_Wantstoconnect2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.name} wants to connect`)
};

const es_dashboard_activity_wantstoconnect2 = /** @type {(inputs: Dashboard_Activity_Wantstoconnect2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.name} quiere conectarse`)
};

const fr_dashboard_activity_wantstoconnect2 = /** @type {(inputs: Dashboard_Activity_Wantstoconnect2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.name} souhaite se connecter`)
};

const ar_dashboard_activity_wantstoconnect2 = /** @type {(inputs: Dashboard_Activity_Wantstoconnect2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`يريد ${i?.name} التواصل معك`)
};

/**
* | output |
* | --- |
* | "{name} wants to connect" |
*
* @param {Dashboard_Activity_Wantstoconnect2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_activity_wantstoconnect2 = /** @type {((inputs: Dashboard_Activity_Wantstoconnect2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Activity_Wantstoconnect2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_activity_wantstoconnect2(inputs)
	if (locale === "es") return es_dashboard_activity_wantstoconnect2(inputs)
	if (locale === "fr") return fr_dashboard_activity_wantstoconnect2(inputs)
	return ar_dashboard_activity_wantstoconnect2(inputs)
});
export { dashboard_activity_wantstoconnect2 as "dashboard.activity.wantsToConnect" }