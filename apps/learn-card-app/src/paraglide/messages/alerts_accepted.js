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

const de_alerts_accepted = /** @type {(inputs: Alerts_AcceptedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Akzeptiert`)
};

const ar_alerts_accepted = /** @type {(inputs: Alerts_AcceptedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مقبول`)
};

const fr_alerts_accepted = /** @type {(inputs: Alerts_AcceptedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accepté`)
};

const ko_alerts_accepted = /** @type {(inputs: Alerts_AcceptedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`수락됨`)
};

/**
* | output |
* | --- |
* | "Accepted" |
*
* @param {Alerts_AcceptedInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const alerts_accepted = /** @type {((inputs?: Alerts_AcceptedInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_AcceptedInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_accepted(inputs)
	if (locale === "es") return es_alerts_accepted(inputs)
	if (locale === "de") return de_alerts_accepted(inputs)
	if (locale === "ar") return ar_alerts_accepted(inputs)
	if (locale === "fr") return fr_alerts_accepted(inputs)
	return ko_alerts_accepted(inputs)
});
export { alerts_accepted as "alerts.accepted" }