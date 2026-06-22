/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Alerts_Appapproved1Inputs */

const en_alerts_appapproved1 = /** @type {(inputs: Alerts_Appapproved1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`App Approved`)
};

const es_alerts_appapproved1 = /** @type {(inputs: Alerts_Appapproved1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aplicación aprobada`)
};

const fr_alerts_appapproved1 = /** @type {(inputs: Alerts_Appapproved1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Application approuvée`)
};

const ar_alerts_appapproved1 = /** @type {(inputs: Alerts_Appapproved1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تمت الموافقة على التطبيق`)
};

/**
* | output |
* | --- |
* | "App Approved" |
*
* @param {Alerts_Appapproved1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const alerts_appapproved1 = /** @type {((inputs?: Alerts_Appapproved1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_Appapproved1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_appapproved1(inputs)
	if (locale === "es") return es_alerts_appapproved1(inputs)
	if (locale === "fr") return fr_alerts_appapproved1(inputs)
	return ar_alerts_appapproved1(inputs)
});
export { alerts_appapproved1 as "alerts.appApproved" }