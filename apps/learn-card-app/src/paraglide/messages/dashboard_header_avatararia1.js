/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ brand: NonNullable<unknown> }} Dashboard_Header_Avatararia1Inputs */

const en_dashboard_header_avatararia1 = /** @type {(inputs: Dashboard_Header_Avatararia1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Open your ${i?.brand}`)
};

const es_dashboard_header_avatararia1 = /** @type {(inputs: Dashboard_Header_Avatararia1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Abre tu ${i?.brand}`)
};

const fr_dashboard_header_avatararia1 = /** @type {(inputs: Dashboard_Header_Avatararia1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Ouvrir votre ${i?.brand}`)
};

const ar_dashboard_header_avatararia1 = /** @type {(inputs: Dashboard_Header_Avatararia1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`افتح ${i?.brand} الخاص بك`)
};

/**
* | output |
* | --- |
* | "Open your {brand}" |
*
* @param {Dashboard_Header_Avatararia1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_header_avatararia1 = /** @type {((inputs: Dashboard_Header_Avatararia1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Header_Avatararia1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_header_avatararia1(inputs)
	if (locale === "es") return es_dashboard_header_avatararia1(inputs)
	if (locale === "fr") return fr_dashboard_header_avatararia1(inputs)
	return ar_dashboard_header_avatararia1(inputs)
});
export { dashboard_header_avatararia1 as "dashboard.header.avatarAria" }