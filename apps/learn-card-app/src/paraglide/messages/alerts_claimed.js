/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Alerts_ClaimedInputs */

const en_alerts_claimed = /** @type {(inputs: Alerts_ClaimedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Claimed`)
};

const es_alerts_claimed = /** @type {(inputs: Alerts_ClaimedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reclamada`)
};

const de_alerts_claimed = /** @type {(inputs: Alerts_ClaimedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Beansprucht`)
};

const ar_alerts_claimed = /** @type {(inputs: Alerts_ClaimedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم المطالبة`)
};

const fr_alerts_claimed = /** @type {(inputs: Alerts_ClaimedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réclamé`)
};

const ko_alerts_claimed = /** @type {(inputs: Alerts_ClaimedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`수령됨`)
};

/**
* | output |
* | --- |
* | "Claimed" |
*
* @param {Alerts_ClaimedInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const alerts_claimed = /** @type {((inputs?: Alerts_ClaimedInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_ClaimedInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_claimed(inputs)
	if (locale === "es") return es_alerts_claimed(inputs)
	if (locale === "de") return de_alerts_claimed(inputs)
	if (locale === "ar") return ar_alerts_claimed(inputs)
	if (locale === "fr") return fr_alerts_claimed(inputs)
	return ko_alerts_claimed(inputs)
});
export { alerts_claimed as "alerts.claimed" }