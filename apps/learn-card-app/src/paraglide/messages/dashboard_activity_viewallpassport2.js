/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Activity_Viewallpassport2Inputs */

const en_dashboard_activity_viewallpassport2 = /** @type {(inputs: Dashboard_Activity_Viewallpassport2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`View all in passport →`)
};

const es_dashboard_activity_viewallpassport2 = /** @type {(inputs: Dashboard_Activity_Viewallpassport2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ver todo en el pasaporte →`)
};

const fr_dashboard_activity_viewallpassport2 = /** @type {(inputs: Dashboard_Activity_Viewallpassport2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tout voir dans le passeport →`)
};

const ar_dashboard_activity_viewallpassport2 = /** @type {(inputs: Dashboard_Activity_Viewallpassport2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عرض الكل في جواز السفر →`)
};

/**
* | output |
* | --- |
* | "View all in passport →" |
*
* @param {Dashboard_Activity_Viewallpassport2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_activity_viewallpassport2 = /** @type {((inputs?: Dashboard_Activity_Viewallpassport2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Activity_Viewallpassport2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_activity_viewallpassport2(inputs)
	if (locale === "es") return es_dashboard_activity_viewallpassport2(inputs)
	if (locale === "fr") return fr_dashboard_activity_viewallpassport2(inputs)
	return ar_dashboard_activity_viewallpassport2(inputs)
});
export { dashboard_activity_viewallpassport2 as "dashboard.activity.viewAllPassport" }