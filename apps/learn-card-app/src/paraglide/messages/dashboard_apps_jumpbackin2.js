/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Apps_Jumpbackin2Inputs */

const en_dashboard_apps_jumpbackin2 = /** @type {(inputs: Dashboard_Apps_Jumpbackin2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Jump back in`)
};

const es_dashboard_apps_jumpbackin2 = /** @type {(inputs: Dashboard_Apps_Jumpbackin2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retoma donde lo dejaste`)
};

const fr_dashboard_apps_jumpbackin2 = /** @type {(inputs: Dashboard_Apps_Jumpbackin2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reprenez où vous en étiez`)
};

const ar_dashboard_apps_jumpbackin2 = /** @type {(inputs: Dashboard_Apps_Jumpbackin2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عُد إلى ما كنت عليه`)
};

/**
* | output |
* | --- |
* | "Jump back in" |
*
* @param {Dashboard_Apps_Jumpbackin2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_apps_jumpbackin2 = /** @type {((inputs?: Dashboard_Apps_Jumpbackin2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Apps_Jumpbackin2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_apps_jumpbackin2(inputs)
	if (locale === "es") return es_dashboard_apps_jumpbackin2(inputs)
	if (locale === "fr") return fr_dashboard_apps_jumpbackin2(inputs)
	return ar_dashboard_apps_jumpbackin2(inputs)
});
export { dashboard_apps_jumpbackin2 as "dashboard.apps.jumpBackIn" }