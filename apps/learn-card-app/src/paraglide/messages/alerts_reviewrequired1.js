/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Alerts_Reviewrequired1Inputs */

const en_alerts_reviewrequired1 = /** @type {(inputs: Alerts_Reviewrequired1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Review Required`)
};

const es_alerts_reviewrequired1 = /** @type {(inputs: Alerts_Reviewrequired1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Revisión requerida`)
};

const fr_alerts_reviewrequired1 = /** @type {(inputs: Alerts_Reviewrequired1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérification requise`)
};

const ar_alerts_reviewrequired1 = /** @type {(inputs: Alerts_Reviewrequired1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مراجعة مطلوبة`)
};

/**
* | output |
* | --- |
* | "Review Required" |
*
* @param {Alerts_Reviewrequired1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const alerts_reviewrequired1 = /** @type {((inputs?: Alerts_Reviewrequired1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_Reviewrequired1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_reviewrequired1(inputs)
	if (locale === "es") return es_alerts_reviewrequired1(inputs)
	if (locale === "fr") return fr_alerts_reviewrequired1(inputs)
	return ar_alerts_reviewrequired1(inputs)
});
export { alerts_reviewrequired1 as "alerts.reviewRequired" }