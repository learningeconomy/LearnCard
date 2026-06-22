/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ completed: NonNullable<unknown>, total: NonNullable<unknown> }} Dashboard_Currentgoal_Progresssteps2Inputs */

const en_dashboard_currentgoal_progresssteps2 = /** @type {(inputs: Dashboard_Currentgoal_Progresssteps2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.completed} of ${i?.total} steps complete`)
};

const es_dashboard_currentgoal_progresssteps2 = /** @type {(inputs: Dashboard_Currentgoal_Progresssteps2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.completed} de ${i?.total} pasos completados`)
};

const fr_dashboard_currentgoal_progresssteps2 = /** @type {(inputs: Dashboard_Currentgoal_Progresssteps2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.completed} sur ${i?.total} étapes terminées`)
};

const ar_dashboard_currentgoal_progresssteps2 = /** @type {(inputs: Dashboard_Currentgoal_Progresssteps2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`اكتملت ${i?.completed} من ${i?.total} خطوة`)
};

/**
* | output |
* | --- |
* | "{completed} of {total} steps complete" |
*
* @param {Dashboard_Currentgoal_Progresssteps2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_currentgoal_progresssteps2 = /** @type {((inputs: Dashboard_Currentgoal_Progresssteps2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Currentgoal_Progresssteps2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_currentgoal_progresssteps2(inputs)
	if (locale === "es") return es_dashboard_currentgoal_progresssteps2(inputs)
	if (locale === "fr") return fr_dashboard_currentgoal_progresssteps2(inputs)
	return ar_dashboard_currentgoal_progresssteps2(inputs)
});
export { dashboard_currentgoal_progresssteps2 as "dashboard.currentGoal.progressSteps" }