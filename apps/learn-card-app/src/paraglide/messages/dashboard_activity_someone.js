/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Activity_SomeoneInputs */

const en_dashboard_activity_someone = /** @type {(inputs: Dashboard_Activity_SomeoneInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Someone`)
};

const es_dashboard_activity_someone = /** @type {(inputs: Dashboard_Activity_SomeoneInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alguien`)
};

const fr_dashboard_activity_someone = /** @type {(inputs: Dashboard_Activity_SomeoneInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Quelqu'un`)
};

const ar_dashboard_activity_someone = /** @type {(inputs: Dashboard_Activity_SomeoneInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`شخص ما`)
};

/**
* | output |
* | --- |
* | "Someone" |
*
* @param {Dashboard_Activity_SomeoneInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_activity_someone = /** @type {((inputs?: Dashboard_Activity_SomeoneInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Activity_SomeoneInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_activity_someone(inputs)
	if (locale === "es") return es_dashboard_activity_someone(inputs)
	if (locale === "fr") return fr_dashboard_activity_someone(inputs)
	return ar_dashboard_activity_someone(inputs)
});
export { dashboard_activity_someone as "dashboard.activity.someone" }