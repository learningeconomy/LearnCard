/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Alerts_AcceptInputs */

const en_alerts_accept = /** @type {(inputs: Alerts_AcceptInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accept`)
};

const es_alerts_accept = /** @type {(inputs: Alerts_AcceptInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aceptar`)
};

const de_alerts_accept = /** @type {(inputs: Alerts_AcceptInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Akzeptieren`)
};

const ar_alerts_accept = /** @type {(inputs: Alerts_AcceptInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قبول`)
};

const fr_alerts_accept = /** @type {(inputs: Alerts_AcceptInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accepter`)
};

const ko_alerts_accept = /** @type {(inputs: Alerts_AcceptInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`수락`)
};

/**
* | output |
* | --- |
* | "Accept" |
*
* @param {Alerts_AcceptInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const alerts_accept = /** @type {((inputs?: Alerts_AcceptInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_AcceptInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_accept(inputs)
	if (locale === "es") return es_alerts_accept(inputs)
	if (locale === "de") return de_alerts_accept(inputs)
	if (locale === "ar") return ar_alerts_accept(inputs)
	if (locale === "fr") return fr_alerts_accept(inputs)
	return ko_alerts_accept(inputs)
});
export { alerts_accept as "alerts.accept" }