/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Quickactions_Skillscaption2Inputs */

const en_dashboard_quickactions_skillscaption2 = /** @type {(inputs: Dashboard_Quickactions_Skillscaption2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Skills you've collected`)
};

const es_dashboard_quickactions_skillscaption2 = /** @type {(inputs: Dashboard_Quickactions_Skillscaption2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Habilidades que has reunido`)
};

const fr_dashboard_quickactions_skillscaption2 = /** @type {(inputs: Dashboard_Quickactions_Skillscaption2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Les compétences que vous avez réunies`)
};

const ar_dashboard_quickactions_skillscaption2 = /** @type {(inputs: Dashboard_Quickactions_Skillscaption2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المهارات التي جمعتها`)
};

/**
* | output |
* | --- |
* | "Skills you've collected" |
*
* @param {Dashboard_Quickactions_Skillscaption2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_quickactions_skillscaption2 = /** @type {((inputs?: Dashboard_Quickactions_Skillscaption2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Quickactions_Skillscaption2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_quickactions_skillscaption2(inputs)
	if (locale === "es") return es_dashboard_quickactions_skillscaption2(inputs)
	if (locale === "fr") return fr_dashboard_quickactions_skillscaption2(inputs)
	return ar_dashboard_quickactions_skillscaption2(inputs)
});
export { dashboard_quickactions_skillscaption2 as "dashboard.quickActions.skillsCaption" }