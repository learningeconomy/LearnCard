/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Dashboard_Apptile_Opensuggested2Inputs */

const en_dashboard_apptile_opensuggested2 = /** @type {(inputs: Dashboard_Apptile_Opensuggested2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Open ${i?.name} — suggested app`)
};

const es_dashboard_apptile_opensuggested2 = /** @type {(inputs: Dashboard_Apptile_Opensuggested2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Abrir ${i?.name} — app sugerida`)
};

const fr_dashboard_apptile_opensuggested2 = /** @type {(inputs: Dashboard_Apptile_Opensuggested2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Ouvrir ${i?.name} — app suggérée`)
};

const ar_dashboard_apptile_opensuggested2 = /** @type {(inputs: Dashboard_Apptile_Opensuggested2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`فتح ${i?.name} — تطبيق مُقترح`)
};

/**
* | output |
* | --- |
* | "Open {name} — suggested app" |
*
* @param {Dashboard_Apptile_Opensuggested2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_apptile_opensuggested2 = /** @type {((inputs: Dashboard_Apptile_Opensuggested2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Apptile_Opensuggested2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_apptile_opensuggested2(inputs)
	if (locale === "es") return es_dashboard_apptile_opensuggested2(inputs)
	if (locale === "fr") return fr_dashboard_apptile_opensuggested2(inputs)
	return ar_dashboard_apptile_opensuggested2(inputs)
});
export { dashboard_apptile_opensuggested2 as "dashboard.appTile.openSuggested" }