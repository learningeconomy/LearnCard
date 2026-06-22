/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Dashboard_Activity_Requesteddataaccess2Inputs */

const en_dashboard_activity_requesteddataaccess2 = /** @type {(inputs: Dashboard_Activity_Requesteddataaccess2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.name} requested data access`)
};

const es_dashboard_activity_requesteddataaccess2 = /** @type {(inputs: Dashboard_Activity_Requesteddataaccess2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.name} solicitó acceso a tus datos`)
};

const fr_dashboard_activity_requesteddataaccess2 = /** @type {(inputs: Dashboard_Activity_Requesteddataaccess2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.name} a demandé l'accès à vos données`)
};

const ar_dashboard_activity_requesteddataaccess2 = /** @type {(inputs: Dashboard_Activity_Requesteddataaccess2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`طلب ${i?.name} الوصول إلى بياناتك`)
};

/**
* | output |
* | --- |
* | "{name} requested data access" |
*
* @param {Dashboard_Activity_Requesteddataaccess2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_activity_requesteddataaccess2 = /** @type {((inputs: Dashboard_Activity_Requesteddataaccess2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Activity_Requesteddataaccess2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_activity_requesteddataaccess2(inputs)
	if (locale === "es") return es_dashboard_activity_requesteddataaccess2(inputs)
	if (locale === "fr") return fr_dashboard_activity_requesteddataaccess2(inputs)
	return ar_dashboard_activity_requesteddataaccess2(inputs)
});
export { dashboard_activity_requesteddataaccess2 as "dashboard.activity.requestedDataAccess" }