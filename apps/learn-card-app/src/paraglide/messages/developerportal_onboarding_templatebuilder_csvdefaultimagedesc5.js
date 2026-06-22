/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Templatebuilder_Csvdefaultimagedesc5Inputs */

const en_developerportal_onboarding_templatebuilder_csvdefaultimagedesc5 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvdefaultimagedesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This image will be used for all credentials unless overridden by a CSV column`)
};

const es_developerportal_onboarding_templatebuilder_csvdefaultimagedesc5 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvdefaultimagedesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Esta imagen se usará para todas las credenciales a menos que una columna CSV la anule`)
};

const fr_developerportal_onboarding_templatebuilder_csvdefaultimagedesc5 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvdefaultimagedesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cette image sera utilisée pour tous les credentials sauf si une colonne CSV la remplace`)
};

const ar_developerportal_onboarding_templatebuilder_csvdefaultimagedesc5 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvdefaultimagedesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سيتم استخدام هذه الصورة لجميع بيانات الاعتماد ما لم يتم تجاوزها بواسطة عمود CSV`)
};

/**
* | output |
* | --- |
* | "This image will be used for all credentials unless overridden by a CSV column" |
*
* @param {Developerportal_Onboarding_Templatebuilder_Csvdefaultimagedesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_csvdefaultimagedesc5 = /** @type {((inputs?: Developerportal_Onboarding_Templatebuilder_Csvdefaultimagedesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Csvdefaultimagedesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_csvdefaultimagedesc5(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_csvdefaultimagedesc5(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_csvdefaultimagedesc5(inputs)
	return ar_developerportal_onboarding_templatebuilder_csvdefaultimagedesc5(inputs)
});
export { developerportal_onboarding_templatebuilder_csvdefaultimagedesc5 as "developerPortal.onboarding.templateBuilder.csvDefaultImageDesc" }