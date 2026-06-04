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

const de_alerts_active = /** @type {(inputs: Alerts_ActiveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aktiv`)
};

const ar_alerts_active = /** @type {(inputs: Alerts_ActiveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نشطة`)
};

const fr_alerts_active = /** @type {(inputs: Alerts_ActiveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Actives`)
};

const ko_alerts_active = /** @type {(inputs: Alerts_ActiveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`활성`)
};

/**
* | output |
* | --- |
* | "Active" |
*
* @param {Alerts_ActiveInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const alerts_active = /** @type {((inputs?: Alerts_ActiveInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_ActiveInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_active(inputs)
	if (locale === "es") return es_alerts_active(inputs)
	if (locale === "de") return de_alerts_active(inputs)
	if (locale === "ar") return ar_alerts_active(inputs)
	if (locale === "fr") return fr_alerts_active(inputs)
	return ko_alerts_active(inputs)
});
export { alerts_active as "alerts.active" }