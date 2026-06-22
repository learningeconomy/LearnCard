/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Templatebuilder_Deletemasterandchildren5Inputs */

const en_developerportal_onboarding_templatebuilder_deletemasterandchildren5 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Deletemasterandchildren5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Delete Master Template & All Course Boosts`)
};

const es_developerportal_onboarding_templatebuilder_deletemasterandchildren5 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Deletemasterandchildren5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eliminar Plantilla Maestra y Todos los Boosts de Cursos`)
};

const fr_developerportal_onboarding_templatebuilder_deletemasterandchildren5 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Deletemasterandchildren5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Supprimer le Modèle Maître et Tous les Boosts de Cours`)
};

const ar_developerportal_onboarding_templatebuilder_deletemasterandchildren5 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Deletemasterandchildren5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حذف القالب الرئيسي وجميع معززات الدورة`)
};

/**
* | output |
* | --- |
* | "Delete Master Template & All Course Boosts" |
*
* @param {Developerportal_Onboarding_Templatebuilder_Deletemasterandchildren5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_deletemasterandchildren5 = /** @type {((inputs?: Developerportal_Onboarding_Templatebuilder_Deletemasterandchildren5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Deletemasterandchildren5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_deletemasterandchildren5(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_deletemasterandchildren5(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_deletemasterandchildren5(inputs)
	return ar_developerportal_onboarding_templatebuilder_deletemasterandchildren5(inputs)
});
export { developerportal_onboarding_templatebuilder_deletemasterandchildren5 as "developerPortal.onboarding.templateBuilder.deleteMasterAndChildren" }