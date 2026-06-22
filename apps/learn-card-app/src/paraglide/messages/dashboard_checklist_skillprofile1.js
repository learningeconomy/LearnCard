/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Checklist_Skillprofile1Inputs */

const en_dashboard_checklist_skillprofile1 = /** @type {(inputs: Dashboard_Checklist_Skillprofile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fill out your skills profile`)
};

const es_dashboard_checklist_skillprofile1 = /** @type {(inputs: Dashboard_Checklist_Skillprofile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Completa tu perfil de habilidades`)
};

const fr_dashboard_checklist_skillprofile1 = /** @type {(inputs: Dashboard_Checklist_Skillprofile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Complétez votre profil de compétences`)
};

const ar_dashboard_checklist_skillprofile1 = /** @type {(inputs: Dashboard_Checklist_Skillprofile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أكمل ملف مهاراتك`)
};

/**
* | output |
* | --- |
* | "Fill out your skills profile" |
*
* @param {Dashboard_Checklist_Skillprofile1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_checklist_skillprofile1 = /** @type {((inputs?: Dashboard_Checklist_Skillprofile1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Checklist_Skillprofile1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_checklist_skillprofile1(inputs)
	if (locale === "es") return es_dashboard_checklist_skillprofile1(inputs)
	if (locale === "fr") return fr_dashboard_checklist_skillprofile1(inputs)
	return ar_dashboard_checklist_skillprofile1(inputs)
});
export { dashboard_checklist_skillprofile1 as "dashboard.checklist.skillProfile" }