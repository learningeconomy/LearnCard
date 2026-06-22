/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Dashboard_Quickactions_Connectactivecaptionmany4Inputs */

const en_dashboard_quickactions_connectactivecaptionmany4 = /** @type {(inputs: Dashboard_Quickactions_Connectactivecaptionmany4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} credentials`)
};

const es_dashboard_quickactions_connectactivecaptionmany4 = /** @type {(inputs: Dashboard_Quickactions_Connectactivecaptionmany4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} credenciales`)
};

const fr_dashboard_quickactions_connectactivecaptionmany4 = /** @type {(inputs: Dashboard_Quickactions_Connectactivecaptionmany4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} certifications`)
};

const ar_dashboard_quickactions_connectactivecaptionmany4 = /** @type {(inputs: Dashboard_Quickactions_Connectactivecaptionmany4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} شهادات`)
};

/**
* | output |
* | --- |
* | "{count} credentials" |
*
* @param {Dashboard_Quickactions_Connectactivecaptionmany4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_quickactions_connectactivecaptionmany4 = /** @type {((inputs: Dashboard_Quickactions_Connectactivecaptionmany4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Quickactions_Connectactivecaptionmany4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_quickactions_connectactivecaptionmany4(inputs)
	if (locale === "es") return es_dashboard_quickactions_connectactivecaptionmany4(inputs)
	if (locale === "fr") return fr_dashboard_quickactions_connectactivecaptionmany4(inputs)
	return ar_dashboard_quickactions_connectactivecaptionmany4(inputs)
});
export { dashboard_quickactions_connectactivecaptionmany4 as "dashboard.quickActions.connectActiveCaptionMany" }