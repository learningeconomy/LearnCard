/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Tips_Scanqrtitle2Inputs */

const en_dashboard_tips_scanqrtitle2 = /** @type {(inputs: Dashboard_Tips_Scanqrtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scan a QR code`)
};

const es_dashboard_tips_scanqrtitle2 = /** @type {(inputs: Dashboard_Tips_Scanqrtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Escanea un código QR`)
};

const fr_dashboard_tips_scanqrtitle2 = /** @type {(inputs: Dashboard_Tips_Scanqrtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scanner un code QR`)
};

const ar_dashboard_tips_scanqrtitle2 = /** @type {(inputs: Dashboard_Tips_Scanqrtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`امسح رمز QR`)
};

/**
* | output |
* | --- |
* | "Scan a QR code" |
*
* @param {Dashboard_Tips_Scanqrtitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_tips_scanqrtitle2 = /** @type {((inputs?: Dashboard_Tips_Scanqrtitle2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Tips_Scanqrtitle2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_tips_scanqrtitle2(inputs)
	if (locale === "es") return es_dashboard_tips_scanqrtitle2(inputs)
	if (locale === "fr") return fr_dashboard_tips_scanqrtitle2(inputs)
	return ar_dashboard_tips_scanqrtitle2(inputs)
});
export { dashboard_tips_scanqrtitle2 as "dashboard.tips.scanQrTitle" }