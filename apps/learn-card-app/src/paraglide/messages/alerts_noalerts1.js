/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Alerts_Noalerts1Inputs */

const en_alerts_noalerts1 = /** @type {(inputs: Alerts_Noalerts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No alerts yet`)
};

const es_alerts_noalerts1 = /** @type {(inputs: Alerts_Noalerts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no hay alertas`)
};

const fr_alerts_noalerts1 = /** @type {(inputs: Alerts_Noalerts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune alerte pour le moment`)
};

const ar_alerts_noalerts1 = /** @type {(inputs: Alerts_Noalerts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد تنبيهات بعد`)
};

/**
* | output |
* | --- |
* | "No alerts yet" |
*
* @param {Alerts_Noalerts1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const alerts_noalerts1 = /** @type {((inputs?: Alerts_Noalerts1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_Noalerts1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_noalerts1(inputs)
	if (locale === "es") return es_alerts_noalerts1(inputs)
	if (locale === "fr") return fr_alerts_noalerts1(inputs)
	return ar_alerts_noalerts1(inputs)
});
export { alerts_noalerts1 as "alerts.noAlerts" }