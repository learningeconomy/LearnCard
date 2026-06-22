/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Templatebuilder_Childvalidatehint4Inputs */

const en_developerportal_onboarding_templatebuilder_childvalidatehint4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Childvalidatehint4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Click "Validate" in the builder to verify before saving`)
};

const es_developerportal_onboarding_templatebuilder_childvalidatehint4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Childvalidatehint4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Haz clic en "Validar" en el constructor para verificar antes de guardar`)
};

const fr_developerportal_onboarding_templatebuilder_childvalidatehint4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Childvalidatehint4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cliquez sur "Valider" dans le constructeur pour vérifier avant d'enregistrer`)
};

const ar_developerportal_onboarding_templatebuilder_childvalidatehint4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Childvalidatehint4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`انقر فوق "التحقق" في المنشئ للتحقق قبل الحفظ`)
};

/**
* | output |
* | --- |
* | "Click \"Validate\" in the builder to verify before saving" |
*
* @param {Developerportal_Onboarding_Templatebuilder_Childvalidatehint4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_childvalidatehint4 = /** @type {((inputs?: Developerportal_Onboarding_Templatebuilder_Childvalidatehint4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Childvalidatehint4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_childvalidatehint4(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_childvalidatehint4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_childvalidatehint4(inputs)
	return ar_developerportal_onboarding_templatebuilder_childvalidatehint4(inputs)
});
export { developerportal_onboarding_templatebuilder_childvalidatehint4 as "developerPortal.onboarding.templateBuilder.childValidateHint" }