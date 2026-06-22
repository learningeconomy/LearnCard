/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Dashboard_Datatrust_Sharingwithmany3Inputs */

const en_dashboard_datatrust_sharingwithmany3 = /** @type {(inputs: Dashboard_Datatrust_Sharingwithmany3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Sharing with ${i?.count} places.`)
};

const es_dashboard_datatrust_sharingwithmany3 = /** @type {(inputs: Dashboard_Datatrust_Sharingwithmany3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Compartiendo con ${i?.count} lugares.`)
};

const fr_dashboard_datatrust_sharingwithmany3 = /** @type {(inputs: Dashboard_Datatrust_Sharingwithmany3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Partagé avec ${i?.count} endroits.`)
};

const ar_dashboard_datatrust_sharingwithmany3 = /** @type {(inputs: Dashboard_Datatrust_Sharingwithmany3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`تتم المشاركة مع ${i?.count} جهات.`)
};

/**
* | output |
* | --- |
* | "Sharing with {count} places." |
*
* @param {Dashboard_Datatrust_Sharingwithmany3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_datatrust_sharingwithmany3 = /** @type {((inputs: Dashboard_Datatrust_Sharingwithmany3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Datatrust_Sharingwithmany3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_datatrust_sharingwithmany3(inputs)
	if (locale === "es") return es_dashboard_datatrust_sharingwithmany3(inputs)
	if (locale === "fr") return fr_dashboard_datatrust_sharingwithmany3(inputs)
	return ar_dashboard_datatrust_sharingwithmany3(inputs)
});
export { dashboard_datatrust_sharingwithmany3 as "dashboard.dataTrust.sharingWithMany" }