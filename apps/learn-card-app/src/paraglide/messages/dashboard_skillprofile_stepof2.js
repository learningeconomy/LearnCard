/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ current: NonNullable<unknown>, total: NonNullable<unknown> }} Dashboard_Skillprofile_Stepof2Inputs */

const en_dashboard_skillprofile_stepof2 = /** @type {(inputs: Dashboard_Skillprofile_Stepof2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Step ${i?.current} of ${i?.total}`)
};

const es_dashboard_skillprofile_stepof2 = /** @type {(inputs: Dashboard_Skillprofile_Stepof2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Paso ${i?.current} de ${i?.total}`)
};

const fr_dashboard_skillprofile_stepof2 = /** @type {(inputs: Dashboard_Skillprofile_Stepof2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Étape ${i?.current} sur ${i?.total}`)
};

const ar_dashboard_skillprofile_stepof2 = /** @type {(inputs: Dashboard_Skillprofile_Stepof2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`الخطوة ${i?.current} من ${i?.total}`)
};

/**
* | output |
* | --- |
* | "Step {current} of {total}" |
*
* @param {Dashboard_Skillprofile_Stepof2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_skillprofile_stepof2 = /** @type {((inputs: Dashboard_Skillprofile_Stepof2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Skillprofile_Stepof2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_skillprofile_stepof2(inputs)
	if (locale === "es") return es_dashboard_skillprofile_stepof2(inputs)
	if (locale === "fr") return fr_dashboard_skillprofile_stepof2(inputs)
	return ar_dashboard_skillprofile_stepof2(inputs)
});
export { dashboard_skillprofile_stepof2 as "dashboard.skillProfile.stepOf" }