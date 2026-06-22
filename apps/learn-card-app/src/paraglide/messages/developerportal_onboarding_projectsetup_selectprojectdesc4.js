/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Projectsetup_Selectprojectdesc4Inputs */

const en_developerportal_onboarding_projectsetup_selectprojectdesc4 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Selectprojectdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choose an existing project or create a new one`)
};

const es_developerportal_onboarding_projectsetup_selectprojectdesc4 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Selectprojectdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Elige un proyecto existente o crea uno nuevo`)
};

const fr_developerportal_onboarding_projectsetup_selectprojectdesc4 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Selectprojectdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choisissez un projet existant ou créez-en un nouveau`)
};

const ar_developerportal_onboarding_projectsetup_selectprojectdesc4 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Selectprojectdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر مشروعاً موجوداً أو أنشئ مشروعاً جديداً`)
};

/**
* | output |
* | --- |
* | "Choose an existing project or create a new one" |
*
* @param {Developerportal_Onboarding_Projectsetup_Selectprojectdesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_projectsetup_selectprojectdesc4 = /** @type {((inputs?: Developerportal_Onboarding_Projectsetup_Selectprojectdesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Projectsetup_Selectprojectdesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_projectsetup_selectprojectdesc4(inputs)
	if (locale === "es") return es_developerportal_onboarding_projectsetup_selectprojectdesc4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_projectsetup_selectprojectdesc4(inputs)
	return ar_developerportal_onboarding_projectsetup_selectprojectdesc4(inputs)
});
export { developerportal_onboarding_projectsetup_selectprojectdesc4 as "developerPortal.onboarding.projectSetup.selectProjectDesc" }