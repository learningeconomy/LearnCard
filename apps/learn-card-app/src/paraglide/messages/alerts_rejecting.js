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

const fr_alerts_rejecting = /** @type {(inputs: Alerts_RejectingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Refus...`)
};

const ar_alerts_rejecting = /** @type {(inputs: Alerts_RejectingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري الرفض...`)
};

/**
* | output |
* | --- |
* | "Rejecting..." |
*
* @param {Alerts_RejectingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const alerts_rejecting = /** @type {((inputs?: Alerts_RejectingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_RejectingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_rejecting(inputs)
	if (locale === "es") return es_alerts_rejecting(inputs)
	if (locale === "fr") return fr_alerts_rejecting(inputs)
	return ar_alerts_rejecting(inputs)
});
export { alerts_rejecting as "alerts.rejecting" }