/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Activity_MeanwhileInputs */

const en_dashboard_activity_meanwhile = /** @type {(inputs: Dashboard_Activity_MeanwhileInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Meanwhile`)
};

const es_dashboard_activity_meanwhile = /** @type {(inputs: Dashboard_Activity_MeanwhileInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mientras tanto`)
};

const fr_dashboard_activity_meanwhile = /** @type {(inputs: Dashboard_Activity_MeanwhileInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`En attendant`)
};

const ar_dashboard_activity_meanwhile = /** @type {(inputs: Dashboard_Activity_MeanwhileInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`في هذه الأثناء`)
};

/**
* | output |
* | --- |
* | "Meanwhile" |
*
* @param {Dashboard_Activity_MeanwhileInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_activity_meanwhile = /** @type {((inputs?: Dashboard_Activity_MeanwhileInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Activity_MeanwhileInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_activity_meanwhile(inputs)
	if (locale === "es") return es_dashboard_activity_meanwhile(inputs)
	if (locale === "fr") return fr_dashboard_activity_meanwhile(inputs)
	return ar_dashboard_activity_meanwhile(inputs)
});
export { dashboard_activity_meanwhile as "dashboard.activity.meanwhile" }