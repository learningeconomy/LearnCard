/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Alerts_TitleInputs */

const en_alerts_title = /** @type {(inputs: Alerts_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alerts`)
};

const es_alerts_title = /** @type {(inputs: Alerts_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alertas`)
};

const fr_alerts_title = /** @type {(inputs: Alerts_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alertes`)
};

const ar_alerts_title = /** @type {(inputs: Alerts_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التنبيهات`)
};

/**
* | output |
* | --- |
* | "Alerts" |
*
* @param {Alerts_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const alerts_title = /** @type {((inputs?: Alerts_TitleInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_TitleInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_title(inputs)
	if (locale === "es") return es_alerts_title(inputs)
	if (locale === "fr") return fr_alerts_title(inputs)
	return ar_alerts_title(inputs)
});
export { alerts_title as "alerts.title" }