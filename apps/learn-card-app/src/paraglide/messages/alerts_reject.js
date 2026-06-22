/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Alerts_RejectInputs */

const en_alerts_reject = /** @type {(inputs: Alerts_RejectInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reject`)
};

const es_alerts_reject = /** @type {(inputs: Alerts_RejectInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rechazar`)
};

const fr_alerts_reject = /** @type {(inputs: Alerts_RejectInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Refuser`)
};

const ar_alerts_reject = /** @type {(inputs: Alerts_RejectInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رفض`)
};

/**
* | output |
* | --- |
* | "Reject" |
*
* @param {Alerts_RejectInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const alerts_reject = /** @type {((inputs?: Alerts_RejectInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_RejectInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_reject(inputs)
	if (locale === "es") return es_alerts_reject(inputs)
	if (locale === "fr") return fr_alerts_reject(inputs)
	return ar_alerts_reject(inputs)
});
export { alerts_reject as "alerts.reject" }