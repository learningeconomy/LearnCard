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

const fr_alerts_markallread2 = /** @type {(inputs: Alerts_Markallread2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tout marquer comme lu`)
};

const ar_alerts_markallread2 = /** @type {(inputs: Alerts_Markallread2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحديد الكل كمقروء`)
};

/**
* | output |
* | --- |
* | "Mark all as read" |
*
* @param {Alerts_Markallread2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const alerts_markallread2 = /** @type {((inputs?: Alerts_Markallread2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_Markallread2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_markallread2(inputs)
	if (locale === "es") return es_alerts_markallread2(inputs)
	if (locale === "fr") return fr_alerts_markallread2(inputs)
	return ar_alerts_markallread2(inputs)
});
export { alerts_markallread2 as "alerts.markAllRead" }