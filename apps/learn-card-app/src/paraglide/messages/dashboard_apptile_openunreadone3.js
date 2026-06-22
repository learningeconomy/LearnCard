/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown>, count: NonNullable<unknown> }} Dashboard_Apptile_Openunreadone3Inputs */

const en_dashboard_apptile_openunreadone3 = /** @type {(inputs: Dashboard_Apptile_Openunreadone3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Open ${i?.name}, ${i?.count} unread notification`)
};

const es_dashboard_apptile_openunreadone3 = /** @type {(inputs: Dashboard_Apptile_Openunreadone3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Abrir ${i?.name}, ${i?.count} notificación sin leer`)
};

const fr_dashboard_apptile_openunreadone3 = /** @type {(inputs: Dashboard_Apptile_Openunreadone3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Ouvrir ${i?.name}, ${i?.count} notification non lue`)
};

const ar_dashboard_apptile_openunreadone3 = /** @type {(inputs: Dashboard_Apptile_Openunreadone3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`فتح ${i?.name}، ${i?.count} إشعار غير مقروء`)
};

/**
* | output |
* | --- |
* | "Open {name}, {count} unread notification" |
*
* @param {Dashboard_Apptile_Openunreadone3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_apptile_openunreadone3 = /** @type {((inputs: Dashboard_Apptile_Openunreadone3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Apptile_Openunreadone3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_apptile_openunreadone3(inputs)
	if (locale === "es") return es_dashboard_apptile_openunreadone3(inputs)
	if (locale === "fr") return fr_dashboard_apptile_openunreadone3(inputs)
	return ar_dashboard_apptile_openunreadone3(inputs)
});
export { dashboard_apptile_openunreadone3 as "dashboard.appTile.openUnreadOne" }