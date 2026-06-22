/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Alerts_Viewcredential1Inputs */

const en_alerts_viewcredential1 = /** @type {(inputs: Alerts_Viewcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`View Credential`)
};

const es_alerts_viewcredential1 = /** @type {(inputs: Alerts_Viewcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ver credencial`)
};

const fr_alerts_viewcredential1 = /** @type {(inputs: Alerts_Viewcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voir la crédention`)
};

const ar_alerts_viewcredential1 = /** @type {(inputs: Alerts_Viewcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عرض الشهادة`)
};

/**
* | output |
* | --- |
* | "View Credential" |
*
* @param {Alerts_Viewcredential1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const alerts_viewcredential1 = /** @type {((inputs?: Alerts_Viewcredential1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_Viewcredential1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_viewcredential1(inputs)
	if (locale === "es") return es_alerts_viewcredential1(inputs)
	if (locale === "fr") return fr_alerts_viewcredential1(inputs)
	return ar_alerts_viewcredential1(inputs)
});
export { alerts_viewcredential1 as "alerts.viewCredential" }