/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Learningprofile_Emptyaddcourse3Inputs */

const en_dashboard_learningprofile_emptyaddcourse3 = /** @type {(inputs: Dashboard_Learningprofile_Emptyaddcourse3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add a course to reveal your strengths.`)
};

const es_dashboard_learningprofile_emptyaddcourse3 = /** @type {(inputs: Dashboard_Learningprofile_Emptyaddcourse3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Agrega un curso para revelar tus fortalezas.`)
};

const fr_dashboard_learningprofile_emptyaddcourse3 = /** @type {(inputs: Dashboard_Learningprofile_Emptyaddcourse3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajoutez un cours pour révéler vos points forts.`)
};

const ar_dashboard_learningprofile_emptyaddcourse3 = /** @type {(inputs: Dashboard_Learningprofile_Emptyaddcourse3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أضف دورة لإظهار نقاط قوتك.`)
};

/**
* | output |
* | --- |
* | "Add a course to reveal your strengths." |
*
* @param {Dashboard_Learningprofile_Emptyaddcourse3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_learningprofile_emptyaddcourse3 = /** @type {((inputs?: Dashboard_Learningprofile_Emptyaddcourse3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Learningprofile_Emptyaddcourse3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_learningprofile_emptyaddcourse3(inputs)
	if (locale === "es") return es_dashboard_learningprofile_emptyaddcourse3(inputs)
	if (locale === "fr") return fr_dashboard_learningprofile_emptyaddcourse3(inputs)
	return ar_dashboard_learningprofile_emptyaddcourse3(inputs)
});
export { dashboard_learningprofile_emptyaddcourse3 as "dashboard.learningProfile.emptyAddCourse" }