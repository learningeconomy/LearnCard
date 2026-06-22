/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Learningprofile_Buildingprofile2Inputs */

const en_dashboard_learningprofile_buildingprofile2 = /** @type {(inputs: Dashboard_Learningprofile_Buildingprofile2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your learning profile takes shape as you add courses, achievements, and experiences.`)
};

const es_dashboard_learningprofile_buildingprofile2 = /** @type {(inputs: Dashboard_Learningprofile_Buildingprofile2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tu perfil de aprendizaje toma forma a medida que agregas cursos, logros y experiencias.`)
};

const fr_dashboard_learningprofile_buildingprofile2 = /** @type {(inputs: Dashboard_Learningprofile_Buildingprofile2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre profil d'apprentissage se précise à mesure que vous ajoutez des cours, des réalisations et des expériences.`)
};

const ar_dashboard_learningprofile_buildingprofile2 = /** @type {(inputs: Dashboard_Learningprofile_Buildingprofile2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يتشكّل ملف تعلّمك كلما أضفت دورات وإنجازات وخبرات.`)
};

/**
* | output |
* | --- |
* | "Your learning profile takes shape as you add courses, achievements, and experiences." |
*
* @param {Dashboard_Learningprofile_Buildingprofile2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_learningprofile_buildingprofile2 = /** @type {((inputs?: Dashboard_Learningprofile_Buildingprofile2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Learningprofile_Buildingprofile2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_learningprofile_buildingprofile2(inputs)
	if (locale === "es") return es_dashboard_learningprofile_buildingprofile2(inputs)
	if (locale === "fr") return fr_dashboard_learningprofile_buildingprofile2(inputs)
	return ar_dashboard_learningprofile_buildingprofile2(inputs)
});
export { dashboard_learningprofile_buildingprofile2 as "dashboard.learningProfile.buildingProfile" }