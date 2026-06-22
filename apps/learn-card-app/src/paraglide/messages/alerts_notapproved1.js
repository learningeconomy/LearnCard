/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Alerts_Notapproved1Inputs */

const en_alerts_notapproved1 = /** @type {(inputs: Alerts_Notapproved1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Not Approved`)
};

const es_alerts_notapproved1 = /** @type {(inputs: Alerts_Notapproved1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No aprobada`)
};

const fr_alerts_notapproved1 = /** @type {(inputs: Alerts_Notapproved1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Non approuvé`)
};

const ar_alerts_notapproved1 = /** @type {(inputs: Alerts_Notapproved1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`غير موافق عليه`)
};

/**
* | output |
* | --- |
* | "Not Approved" |
*
* @param {Alerts_Notapproved1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const alerts_notapproved1 = /** @type {((inputs?: Alerts_Notapproved1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_Notapproved1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_notapproved1(inputs)
	if (locale === "es") return es_alerts_notapproved1(inputs)
	if (locale === "fr") return fr_alerts_notapproved1(inputs)
	return ar_alerts_notapproved1(inputs)
});
export { alerts_notapproved1 as "alerts.notApproved" }