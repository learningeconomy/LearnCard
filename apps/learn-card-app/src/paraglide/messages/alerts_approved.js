/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Alerts_ApprovedInputs */

const en_alerts_approved = /** @type {(inputs: Alerts_ApprovedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Approved`)
};

const es_alerts_approved = /** @type {(inputs: Alerts_ApprovedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aprobada`)
};

const de_alerts_approved = /** @type {(inputs: Alerts_ApprovedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Genehmigt`)
};

const ar_alerts_approved = /** @type {(inputs: Alerts_ApprovedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تمت الموافقة`)
};

const fr_alerts_approved = /** @type {(inputs: Alerts_ApprovedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Approuvé`)
};

const ko_alerts_approved = /** @type {(inputs: Alerts_ApprovedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`승인됨`)
};

/**
* | output |
* | --- |
* | "Approved" |
*
* @param {Alerts_ApprovedInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const alerts_approved = /** @type {((inputs?: Alerts_ApprovedInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_ApprovedInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_approved(inputs)
	if (locale === "es") return es_alerts_approved(inputs)
	if (locale === "de") return de_alerts_approved(inputs)
	if (locale === "ar") return ar_alerts_approved(inputs)
	if (locale === "fr") return fr_alerts_approved(inputs)
	return ko_alerts_approved(inputs)
});
export { alerts_approved as "alerts.approved" }