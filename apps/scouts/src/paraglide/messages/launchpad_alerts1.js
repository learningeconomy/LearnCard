/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Alerts1Inputs */

const en_launchpad_alerts1 = /** @type {(inputs: Launchpad_Alerts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alerts`)
};

const es_launchpad_alerts1 = /** @type {(inputs: Launchpad_Alerts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alertas`)
};

const fr_launchpad_alerts1 = /** @type {(inputs: Launchpad_Alerts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alertes`)
};

const ar_launchpad_alerts1 = /** @type {(inputs: Launchpad_Alerts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alerts`)
};

/**
* | output |
* | --- |
* | "Alerts" |
*
* @param {Launchpad_Alerts1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_alerts1 = /** @type {((inputs?: Launchpad_Alerts1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Alerts1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_alerts1(inputs)
	if (locale === "es") return es_launchpad_alerts1(inputs)
	if (locale === "fr") return fr_launchpad_alerts1(inputs)
	return ar_launchpad_alerts1(inputs)
});
export { launchpad_alerts1 as "launchPad.alerts" }