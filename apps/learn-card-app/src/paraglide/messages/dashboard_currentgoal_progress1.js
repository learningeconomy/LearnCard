/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ completed: NonNullable<unknown>, total: NonNullable<unknown> }} Dashboard_Currentgoal_Progress1Inputs */

const en_dashboard_currentgoal_progress1 = /** @type {(inputs: Dashboard_Currentgoal_Progress1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.completed} of ${i?.total}`)
};

const es_dashboard_currentgoal_progress1 = /** @type {(inputs: Dashboard_Currentgoal_Progress1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.completed} de ${i?.total}`)
};

const fr_dashboard_currentgoal_progress1 = /** @type {(inputs: Dashboard_Currentgoal_Progress1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.completed} sur ${i?.total}`)
};

const ar_dashboard_currentgoal_progress1 = /** @type {(inputs: Dashboard_Currentgoal_Progress1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.completed} من ${i?.total}`)
};

/**
* | output |
* | --- |
* | "{completed} of {total}" |
*
* @param {Dashboard_Currentgoal_Progress1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_currentgoal_progress1 = /** @type {((inputs: Dashboard_Currentgoal_Progress1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Currentgoal_Progress1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_currentgoal_progress1(inputs)
	if (locale === "es") return es_dashboard_currentgoal_progress1(inputs)
	if (locale === "fr") return fr_dashboard_currentgoal_progress1(inputs)
	return ar_dashboard_currentgoal_progress1(inputs)
});
export { dashboard_currentgoal_progress1 as "dashboard.currentGoal.progress" }