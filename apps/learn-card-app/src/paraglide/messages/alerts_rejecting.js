/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Alerts_RejectingInputs */

const en_alerts_rejecting = /** @type {(inputs: Alerts_RejectingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rejecting...`)
};

const es_alerts_rejecting = /** @type {(inputs: Alerts_RejectingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rechazando...`)
};

const de_alerts_rejecting = /** @type {(inputs: Alerts_RejectingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wird abgelehnt...`)
};

const ar_alerts_rejecting = /** @type {(inputs: Alerts_RejectingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري الرفض...`)
};

const fr_alerts_rejecting = /** @type {(inputs: Alerts_RejectingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Refus...`)
};

const ko_alerts_rejecting = /** @type {(inputs: Alerts_RejectingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`거부 중...`)
};

/**
* | output |
* | --- |
* | "Rejecting..." |
*
* @param {Alerts_RejectingInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const alerts_rejecting = /** @type {((inputs?: Alerts_RejectingInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_RejectingInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_rejecting(inputs)
	if (locale === "es") return es_alerts_rejecting(inputs)
	if (locale === "de") return de_alerts_rejecting(inputs)
	if (locale === "ar") return ar_alerts_rejecting(inputs)
	if (locale === "fr") return fr_alerts_rejecting(inputs)
	return ko_alerts_rejecting(inputs)
});
export { alerts_rejecting as "alerts.rejecting" }