/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Developerportal_Onboarding_Templatebuilder_Importsuccess3Inputs */

const en_developerportal_onboarding_templatebuilder_importsuccess3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Importsuccess3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Created master template + ${i?.count} course boosts!`)
};

const es_developerportal_onboarding_templatebuilder_importsuccess3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Importsuccess3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`¡Plantilla maestra + ${i?.count} boosts de cursos creados!`)
};

const fr_developerportal_onboarding_templatebuilder_importsuccess3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Importsuccess3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Modèle maître + ${i?.count} boosts de cours créés !`)
};

const ar_developerportal_onboarding_templatebuilder_importsuccess3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Importsuccess3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`تم إنشاء القالب الرئيسي + ${i?.count} معززات دورة!`)
};

/**
* | output |
* | --- |
* | "Created master template + {count} course boosts!" |
*
* @param {Developerportal_Onboarding_Templatebuilder_Importsuccess3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_importsuccess3 = /** @type {((inputs: Developerportal_Onboarding_Templatebuilder_Importsuccess3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Importsuccess3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_importsuccess3(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_importsuccess3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_importsuccess3(inputs)
	return ar_developerportal_onboarding_templatebuilder_importsuccess3(inputs)
});
export { developerportal_onboarding_templatebuilder_importsuccess3 as "developerPortal.onboarding.templateBuilder.importSuccess" }