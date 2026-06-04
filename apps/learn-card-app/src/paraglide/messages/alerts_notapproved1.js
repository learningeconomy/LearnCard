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

const de_alerts_notapproved1 = /** @type {(inputs: Alerts_Notapproved1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nicht genehmigt`)
};

const ar_alerts_notapproved1 = /** @type {(inputs: Alerts_Notapproved1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`غير موافق عليه`)
};

const fr_alerts_notapproved1 = /** @type {(inputs: Alerts_Notapproved1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Non approuvé`)
};

const ko_alerts_notapproved1 = /** @type {(inputs: Alerts_Notapproved1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`승인되지 않음`)
};

/**
* | output |
* | --- |
* | "Not Approved" |
*
* @param {Alerts_Notapproved1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const alerts_notapproved1 = /** @type {((inputs?: Alerts_Notapproved1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_Notapproved1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_notapproved1(inputs)
	if (locale === "es") return es_alerts_notapproved1(inputs)
	if (locale === "de") return de_alerts_notapproved1(inputs)
	if (locale === "ar") return ar_alerts_notapproved1(inputs)
	if (locale === "fr") return fr_alerts_notapproved1(inputs)
	return ko_alerts_notapproved1(inputs)
});
export { alerts_notapproved1 as "alerts.notApproved" }