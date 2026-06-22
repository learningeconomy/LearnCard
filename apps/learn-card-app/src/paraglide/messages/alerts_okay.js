/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Alerts_OkayInputs */

const en_alerts_okay = /** @type {(inputs: Alerts_OkayInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Okay`)
};

const es_alerts_okay = /** @type {(inputs: Alerts_OkayInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`De acuerdo`)
};

const fr_alerts_okay = /** @type {(inputs: Alerts_OkayInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`OK`)
};

const ar_alerts_okay = /** @type {(inputs: Alerts_OkayInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حسناً`)
};

/**
* | output |
* | --- |
* | "Okay" |
*
* @param {Alerts_OkayInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const alerts_okay = /** @type {((inputs?: Alerts_OkayInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_OkayInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_okay(inputs)
	if (locale === "es") return es_alerts_okay(inputs)
	if (locale === "fr") return fr_alerts_okay(inputs)
	return ar_alerts_okay(inputs)
});
export { alerts_okay as "alerts.okay" }