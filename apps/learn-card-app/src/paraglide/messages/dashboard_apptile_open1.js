/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Dashboard_Apptile_Open1Inputs */

const en_dashboard_apptile_open1 = /** @type {(inputs: Dashboard_Apptile_Open1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Open ${i?.name}`)
};

const es_dashboard_apptile_open1 = /** @type {(inputs: Dashboard_Apptile_Open1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Abrir ${i?.name}`)
};

const fr_dashboard_apptile_open1 = /** @type {(inputs: Dashboard_Apptile_Open1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Ouvrir ${i?.name}`)
};

const ar_dashboard_apptile_open1 = /** @type {(inputs: Dashboard_Apptile_Open1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`فتح ${i?.name}`)
};

/**
* | output |
* | --- |
* | "Open {name}" |
*
* @param {Dashboard_Apptile_Open1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_apptile_open1 = /** @type {((inputs: Dashboard_Apptile_Open1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Apptile_Open1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_apptile_open1(inputs)
	if (locale === "es") return es_dashboard_apptile_open1(inputs)
	if (locale === "fr") return fr_dashboard_apptile_open1(inputs)
	return ar_dashboard_apptile_open1(inputs)
});
export { dashboard_apptile_open1 as "dashboard.appTile.open" }