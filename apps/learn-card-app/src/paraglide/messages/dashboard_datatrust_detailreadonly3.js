/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ read: NonNullable<unknown> }} Dashboard_Datatrust_Detailreadonly3Inputs */

const en_dashboard_datatrust_detailreadonly3 = /** @type {(inputs: Dashboard_Datatrust_Detailreadonly3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.read} can read. You're in control.`)
};

const es_dashboard_datatrust_detailreadonly3 = /** @type {(inputs: Dashboard_Datatrust_Detailreadonly3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.read} pueden leer. Tú tienes el control.`)
};

const fr_dashboard_datatrust_detailreadonly3 = /** @type {(inputs: Dashboard_Datatrust_Detailreadonly3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.read} peuvent lire. Vous gardez le contrôle.`)
};

const ar_dashboard_datatrust_detailreadonly3 = /** @type {(inputs: Dashboard_Datatrust_Detailreadonly3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`يمكن لـ ${i?.read} القراءة. أنت المتحكم.`)
};

/**
* | output |
* | --- |
* | "{read} can read. You're in control." |
*
* @param {Dashboard_Datatrust_Detailreadonly3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_datatrust_detailreadonly3 = /** @type {((inputs: Dashboard_Datatrust_Detailreadonly3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Datatrust_Detailreadonly3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_datatrust_detailreadonly3(inputs)
	if (locale === "es") return es_dashboard_datatrust_detailreadonly3(inputs)
	if (locale === "fr") return fr_dashboard_datatrust_detailreadonly3(inputs)
	return ar_dashboard_datatrust_detailreadonly3(inputs)
});
export { dashboard_datatrust_detailreadonly3 as "dashboard.dataTrust.detailReadOnly" }