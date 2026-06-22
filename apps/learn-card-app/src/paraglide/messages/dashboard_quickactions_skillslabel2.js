/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Quickactions_Skillslabel2Inputs */

const en_dashboard_quickactions_skillslabel2 = /** @type {(inputs: Dashboard_Quickactions_Skillslabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`See Skills`)
};

const es_dashboard_quickactions_skillslabel2 = /** @type {(inputs: Dashboard_Quickactions_Skillslabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ver habilidades`)
};

const fr_dashboard_quickactions_skillslabel2 = /** @type {(inputs: Dashboard_Quickactions_Skillslabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voir les compétences`)
};

const ar_dashboard_quickactions_skillslabel2 = /** @type {(inputs: Dashboard_Quickactions_Skillslabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عرض المهارات`)
};

/**
* | output |
* | --- |
* | "See Skills" |
*
* @param {Dashboard_Quickactions_Skillslabel2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_quickactions_skillslabel2 = /** @type {((inputs?: Dashboard_Quickactions_Skillslabel2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Quickactions_Skillslabel2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_quickactions_skillslabel2(inputs)
	if (locale === "es") return es_dashboard_quickactions_skillslabel2(inputs)
	if (locale === "fr") return fr_dashboard_quickactions_skillslabel2(inputs)
	return ar_dashboard_quickactions_skillslabel2(inputs)
});
export { dashboard_quickactions_skillslabel2 as "dashboard.quickActions.skillsLabel" }