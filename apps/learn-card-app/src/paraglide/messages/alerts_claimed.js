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

const fr_alerts_claimed = /** @type {(inputs: Alerts_ClaimedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réclamé`)
};

const ar_alerts_claimed = /** @type {(inputs: Alerts_ClaimedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم المطالبة`)
};

/**
* | output |
* | --- |
* | "Claimed" |
*
* @param {Alerts_ClaimedInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const alerts_claimed = /** @type {((inputs?: Alerts_ClaimedInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_ClaimedInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_claimed(inputs)
	if (locale === "es") return es_alerts_claimed(inputs)
	if (locale === "fr") return fr_alerts_claimed(inputs)
	return ar_alerts_claimed(inputs)
});
export { alerts_claimed as "alerts.claimed" }