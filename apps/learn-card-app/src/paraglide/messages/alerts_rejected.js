/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Alerts_RejectedInputs */

const en_alerts_rejected = /** @type {(inputs: Alerts_RejectedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rejected`)
};

const es_alerts_rejected = /** @type {(inputs: Alerts_RejectedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rechazado`)
};

const fr_alerts_rejected = /** @type {(inputs: Alerts_RejectedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rejeté`)
};

const ar_alerts_rejected = /** @type {(inputs: Alerts_RejectedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مرفوض`)
};

/**
* | output |
* | --- |
* | "Rejected" |
*
* @param {Alerts_RejectedInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const alerts_rejected = /** @type {((inputs?: Alerts_RejectedInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_RejectedInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_rejected(inputs)
	if (locale === "es") return es_alerts_rejected(inputs)
	if (locale === "fr") return fr_alerts_rejected(inputs)
	return ar_alerts_rejected(inputs)
});
export { alerts_rejected as "alerts.rejected" }