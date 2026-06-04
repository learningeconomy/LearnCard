/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Alerts_Markallread2Inputs */

const en_alerts_markallread2 = /** @type {(inputs: Alerts_Markallread2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mark all as read`)
};

const es_alerts_markallread2 = /** @type {(inputs: Alerts_Markallread2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Marcar todo como leído`)
};

const de_alerts_markallread2 = /** @type {(inputs: Alerts_Markallread2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alle als gelesen markieren`)
};

const ar_alerts_markallread2 = /** @type {(inputs: Alerts_Markallread2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحديد الكل كمقروء`)
};

const fr_alerts_markallread2 = /** @type {(inputs: Alerts_Markallread2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tout marquer comme lu`)
};

const ko_alerts_markallread2 = /** @type {(inputs: Alerts_Markallread2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`모두 읽음으로 표시`)
};

/**
* | output |
* | --- |
* | "Mark all as read" |
*
* @param {Alerts_Markallread2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const alerts_markallread2 = /** @type {((inputs?: Alerts_Markallread2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_Markallread2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_markallread2(inputs)
	if (locale === "es") return es_alerts_markallread2(inputs)
	if (locale === "de") return de_alerts_markallread2(inputs)
	if (locale === "ar") return ar_alerts_markallread2(inputs)
	if (locale === "fr") return fr_alerts_markallread2(inputs)
	return ko_alerts_markallread2(inputs)
});
export { alerts_markallread2 as "alerts.markAllRead" }