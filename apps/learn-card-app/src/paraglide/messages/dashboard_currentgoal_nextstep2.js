/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Currentgoal_Nextstep2Inputs */

const en_dashboard_currentgoal_nextstep2 = /** @type {(inputs: Dashboard_Currentgoal_Nextstep2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Next step`)
};

const es_dashboard_currentgoal_nextstep2 = /** @type {(inputs: Dashboard_Currentgoal_Nextstep2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Siguiente paso`)
};

const fr_dashboard_currentgoal_nextstep2 = /** @type {(inputs: Dashboard_Currentgoal_Nextstep2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Étape suivante`)
};

const ar_dashboard_currentgoal_nextstep2 = /** @type {(inputs: Dashboard_Currentgoal_Nextstep2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الخطوة التالية`)
};

/**
* | output |
* | --- |
* | "Next step" |
*
* @param {Dashboard_Currentgoal_Nextstep2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_currentgoal_nextstep2 = /** @type {((inputs?: Dashboard_Currentgoal_Nextstep2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Currentgoal_Nextstep2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_currentgoal_nextstep2(inputs)
	if (locale === "es") return es_dashboard_currentgoal_nextstep2(inputs)
	if (locale === "fr") return fr_dashboard_currentgoal_nextstep2(inputs)
	return ar_dashboard_currentgoal_nextstep2(inputs)
});
export { dashboard_currentgoal_nextstep2 as "dashboard.currentGoal.nextStep" }