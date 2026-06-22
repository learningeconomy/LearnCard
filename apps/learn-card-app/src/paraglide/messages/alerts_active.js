/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Alerts_ActiveInputs */

const en_alerts_active = /** @type {(inputs: Alerts_ActiveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Active`)
};

const es_alerts_active = /** @type {(inputs: Alerts_ActiveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Activas`)
};

const fr_alerts_active = /** @type {(inputs: Alerts_ActiveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Actives`)
};

const ar_alerts_active = /** @type {(inputs: Alerts_ActiveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نشطة`)
};

/**
* | output |
* | --- |
* | "Active" |
*
* @param {Alerts_ActiveInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const alerts_active = /** @type {((inputs?: Alerts_ActiveInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_ActiveInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_active(inputs)
	if (locale === "es") return es_alerts_active(inputs)
	if (locale === "fr") return fr_alerts_active(inputs)
	return ar_alerts_active(inputs)
});
export { alerts_active as "alerts.active" }