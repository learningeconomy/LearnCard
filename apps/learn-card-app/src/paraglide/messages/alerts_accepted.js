/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Alerts_AcceptedInputs */

const en_alerts_accepted = /** @type {(inputs: Alerts_AcceptedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accepted`)
};

const es_alerts_accepted = /** @type {(inputs: Alerts_AcceptedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aceptada`)
};

const fr_alerts_accepted = /** @type {(inputs: Alerts_AcceptedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accepté`)
};

const ar_alerts_accepted = /** @type {(inputs: Alerts_AcceptedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مقبول`)
};

/**
* | output |
* | --- |
* | "Accepted" |
*
* @param {Alerts_AcceptedInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const alerts_accepted = /** @type {((inputs?: Alerts_AcceptedInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_AcceptedInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_accepted(inputs)
	if (locale === "es") return es_alerts_accepted(inputs)
	if (locale === "fr") return fr_alerts_accepted(inputs)
	return ar_alerts_accepted(inputs)
});
export { alerts_accepted as "alerts.accepted" }