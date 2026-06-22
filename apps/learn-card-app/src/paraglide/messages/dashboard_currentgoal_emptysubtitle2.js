/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Currentgoal_Emptysubtitle2Inputs */

const en_dashboard_currentgoal_emptysubtitle2 = /** @type {(inputs: Dashboard_Currentgoal_Emptysubtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Set a goal and we'll help you build the path to get there.`)
};

const es_dashboard_currentgoal_emptysubtitle2 = /** @type {(inputs: Dashboard_Currentgoal_Emptysubtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Define una meta y te ayudaremos a construir el camino para alcanzarla.`)
};

const fr_dashboard_currentgoal_emptysubtitle2 = /** @type {(inputs: Dashboard_Currentgoal_Emptysubtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Définissez un objectif et nous vous aiderons à construire le parcours pour y arriver.`)
};

const ar_dashboard_currentgoal_emptysubtitle2 = /** @type {(inputs: Dashboard_Currentgoal_Emptysubtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حدد هدفًا وسنساعدك في بناء المسار للوصول إليه.`)
};

/**
* | output |
* | --- |
* | "Set a goal and we'll help you build the path to get there." |
*
* @param {Dashboard_Currentgoal_Emptysubtitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_currentgoal_emptysubtitle2 = /** @type {((inputs?: Dashboard_Currentgoal_Emptysubtitle2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Currentgoal_Emptysubtitle2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_currentgoal_emptysubtitle2(inputs)
	if (locale === "es") return es_dashboard_currentgoal_emptysubtitle2(inputs)
	if (locale === "fr") return fr_dashboard_currentgoal_emptysubtitle2(inputs)
	return ar_dashboard_currentgoal_emptysubtitle2(inputs)
});
export { dashboard_currentgoal_emptysubtitle2 as "dashboard.currentGoal.emptySubtitle" }