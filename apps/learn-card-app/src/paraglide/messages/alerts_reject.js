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

const de_alerts_reject = /** @type {(inputs: Alerts_RejectInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ablehnen`)
};

const ar_alerts_reject = /** @type {(inputs: Alerts_RejectInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رفض`)
};

const fr_alerts_reject = /** @type {(inputs: Alerts_RejectInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Refuser`)
};

const ko_alerts_reject = /** @type {(inputs: Alerts_RejectInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`거부`)
};

/**
* | output |
* | --- |
* | "Reject" |
*
* @param {Alerts_RejectInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const alerts_reject = /** @type {((inputs?: Alerts_RejectInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_RejectInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_reject(inputs)
	if (locale === "es") return es_alerts_reject(inputs)
	if (locale === "de") return de_alerts_reject(inputs)
	if (locale === "ar") return ar_alerts_reject(inputs)
	if (locale === "fr") return fr_alerts_reject(inputs)
	return ko_alerts_reject(inputs)
});
export { alerts_reject as "alerts.reject" }