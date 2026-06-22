/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Production_Checklistsigning2Inputs */

const en_developerportal_onboarding_production_checklistsigning2 = /** @type {(inputs: Developerportal_Onboarding_Production_Checklistsigning2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Signing authority configured`)
};

const es_developerportal_onboarding_production_checklistsigning2 = /** @type {(inputs: Developerportal_Onboarding_Production_Checklistsigning2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Autoridad de firma configurada`)
};

const fr_developerportal_onboarding_production_checklistsigning2 = /** @type {(inputs: Developerportal_Onboarding_Production_Checklistsigning2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Autorité de signature configurée`)
};

const ar_developerportal_onboarding_production_checklistsigning2 = /** @type {(inputs: Developerportal_Onboarding_Production_Checklistsigning2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم تكوين سلطة التوقيع`)
};

/**
* | output |
* | --- |
* | "Signing authority configured" |
*
* @param {Developerportal_Onboarding_Production_Checklistsigning2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_production_checklistsigning2 = /** @type {((inputs?: Developerportal_Onboarding_Production_Checklistsigning2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Production_Checklistsigning2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_production_checklistsigning2(inputs)
	if (locale === "es") return es_developerportal_onboarding_production_checklistsigning2(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_production_checklistsigning2(inputs)
	return ar_developerportal_onboarding_production_checklistsigning2(inputs)
});
export { developerportal_onboarding_production_checklistsigning2 as "developerPortal.onboarding.production.checklistSigning" }