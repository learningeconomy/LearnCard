/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Dashboard_Quickactions_Connectactivecaptionone4Inputs */

const en_dashboard_quickactions_connectactivecaptionone4 = /** @type {(inputs: Dashboard_Quickactions_Connectactivecaptionone4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} credential`)
};

const es_dashboard_quickactions_connectactivecaptionone4 = /** @type {(inputs: Dashboard_Quickactions_Connectactivecaptionone4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} credencial`)
};

const fr_dashboard_quickactions_connectactivecaptionone4 = /** @type {(inputs: Dashboard_Quickactions_Connectactivecaptionone4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} certification`)
};

const ar_dashboard_quickactions_connectactivecaptionone4 = /** @type {(inputs: Dashboard_Quickactions_Connectactivecaptionone4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} شهادة`)
};

/**
* | output |
* | --- |
* | "{count} credential" |
*
* @param {Dashboard_Quickactions_Connectactivecaptionone4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_quickactions_connectactivecaptionone4 = /** @type {((inputs: Dashboard_Quickactions_Connectactivecaptionone4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Quickactions_Connectactivecaptionone4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_quickactions_connectactivecaptionone4(inputs)
	if (locale === "es") return es_dashboard_quickactions_connectactivecaptionone4(inputs)
	if (locale === "fr") return fr_dashboard_quickactions_connectactivecaptionone4(inputs)
	return ar_dashboard_quickactions_connectactivecaptionone4(inputs)
});
export { dashboard_quickactions_connectactivecaptionone4 as "dashboard.quickActions.connectActiveCaptionOne" }