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

const de_alerts_appapproved1 = /** @type {(inputs: Alerts_Appapproved1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`App genehmigt`)
};

const ar_alerts_appapproved1 = /** @type {(inputs: Alerts_Appapproved1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تمت الموافقة على التطبيق`)
};

const fr_alerts_appapproved1 = /** @type {(inputs: Alerts_Appapproved1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Application approuvée`)
};

const ko_alerts_appapproved1 = /** @type {(inputs: Alerts_Appapproved1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`앱 승인됨`)
};

/**
* | output |
* | --- |
* | "App Approved" |
*
* @param {Alerts_Appapproved1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const alerts_appapproved1 = /** @type {((inputs?: Alerts_Appapproved1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_Appapproved1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_appapproved1(inputs)
	if (locale === "es") return es_alerts_appapproved1(inputs)
	if (locale === "de") return de_alerts_appapproved1(inputs)
	if (locale === "ar") return ar_alerts_appapproved1(inputs)
	if (locale === "fr") return fr_alerts_appapproved1(inputs)
	return ko_alerts_appapproved1(inputs)
});
export { alerts_appapproved1 as "alerts.appApproved" }