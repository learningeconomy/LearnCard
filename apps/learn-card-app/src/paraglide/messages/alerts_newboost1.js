/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Alerts_Newboost1Inputs */

const en_alerts_newboost1 = /** @type {(inputs: Alerts_Newboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New Boost`)
};

const es_alerts_newboost1 = /** @type {(inputs: Alerts_Newboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nuevo Boost`)
};

const de_alerts_newboost1 = /** @type {(inputs: Alerts_Newboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Neuer Boost`)
};

const ar_alerts_newboost1 = /** @type {(inputs: Alerts_Newboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ترقية جديدة`)
};

const fr_alerts_newboost1 = /** @type {(inputs: Alerts_Newboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nouveau Boost`)
};

const ko_alerts_newboost1 = /** @type {(inputs: Alerts_Newboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`새 부스트`)
};

/**
* | output |
* | --- |
* | "New Boost" |
*
* @param {Alerts_Newboost1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const alerts_newboost1 = /** @type {((inputs?: Alerts_Newboost1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_Newboost1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_newboost1(inputs)
	if (locale === "es") return es_alerts_newboost1(inputs)
	if (locale === "de") return de_alerts_newboost1(inputs)
	if (locale === "ar") return ar_alerts_newboost1(inputs)
	if (locale === "fr") return fr_alerts_newboost1(inputs)
	return ko_alerts_newboost1(inputs)
});
export { alerts_newboost1 as "alerts.newBoost" }