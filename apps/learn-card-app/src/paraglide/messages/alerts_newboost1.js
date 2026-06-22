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

const fr_alerts_newboost1 = /** @type {(inputs: Alerts_Newboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nouveau Boost`)
};

const ar_alerts_newboost1 = /** @type {(inputs: Alerts_Newboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ترقية جديدة`)
};

/**
* | output |
* | --- |
* | "New Boost" |
*
* @param {Alerts_Newboost1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const alerts_newboost1 = /** @type {((inputs?: Alerts_Newboost1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_Newboost1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_newboost1(inputs)
	if (locale === "es") return es_alerts_newboost1(inputs)
	if (locale === "fr") return fr_alerts_newboost1(inputs)
	return ar_alerts_newboost1(inputs)
});
export { alerts_newboost1 as "alerts.newBoost" }