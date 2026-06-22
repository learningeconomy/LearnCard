/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Apps_Suggestedlabel1Inputs */

const en_dashboard_apps_suggestedlabel1 = /** @type {(inputs: Dashboard_Apps_Suggestedlabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Suggested for you`)
};

const es_dashboard_apps_suggestedlabel1 = /** @type {(inputs: Dashboard_Apps_Suggestedlabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sugerencias para ti`)
};

const fr_dashboard_apps_suggestedlabel1 = /** @type {(inputs: Dashboard_Apps_Suggestedlabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Suggéré pour vous`)
};

const ar_dashboard_apps_suggestedlabel1 = /** @type {(inputs: Dashboard_Apps_Suggestedlabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مُقترح لك`)
};

/**
* | output |
* | --- |
* | "Suggested for you" |
*
* @param {Dashboard_Apps_Suggestedlabel1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_apps_suggestedlabel1 = /** @type {((inputs?: Dashboard_Apps_Suggestedlabel1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Apps_Suggestedlabel1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_apps_suggestedlabel1(inputs)
	if (locale === "es") return es_dashboard_apps_suggestedlabel1(inputs)
	if (locale === "fr") return fr_dashboard_apps_suggestedlabel1(inputs)
	return ar_dashboard_apps_suggestedlabel1(inputs)
});
export { dashboard_apps_suggestedlabel1 as "dashboard.apps.suggestedLabel" }