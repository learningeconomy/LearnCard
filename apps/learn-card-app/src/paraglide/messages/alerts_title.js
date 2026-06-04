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

const de_alerts_title = /** @type {(inputs: Alerts_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Benachrichtigungen`)
};

const ar_alerts_title = /** @type {(inputs: Alerts_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التنبيهات`)
};

const fr_alerts_title = /** @type {(inputs: Alerts_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alertes`)
};

const ko_alerts_title = /** @type {(inputs: Alerts_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`알림`)
};

/**
* | output |
* | --- |
* | "Alerts" |
*
* @param {Alerts_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const alerts_title = /** @type {((inputs?: Alerts_TitleInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_TitleInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_title(inputs)
	if (locale === "es") return es_alerts_title(inputs)
	if (locale === "de") return de_alerts_title(inputs)
	if (locale === "ar") return ar_alerts_title(inputs)
	if (locale === "fr") return fr_alerts_title(inputs)
	return ko_alerts_title(inputs)
});
export { alerts_title as "alerts.title" }