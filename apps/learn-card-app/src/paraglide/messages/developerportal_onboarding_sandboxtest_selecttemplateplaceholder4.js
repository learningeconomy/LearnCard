/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Sandboxtest_Selecttemplateplaceholder4Inputs */

const en_developerportal_onboarding_sandboxtest_selecttemplateplaceholder4 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Selecttemplateplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select a template`)
};

const es_developerportal_onboarding_sandboxtest_selecttemplateplaceholder4 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Selecttemplateplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Selecciona una plantilla`)
};

const fr_developerportal_onboarding_sandboxtest_selecttemplateplaceholder4 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Selecttemplateplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionnez un modèle`)
};

const ar_developerportal_onboarding_sandboxtest_selecttemplateplaceholder4 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Selecttemplateplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر قالباً`)
};

/**
* | output |
* | --- |
* | "Select a template" |
*
* @param {Developerportal_Onboarding_Sandboxtest_Selecttemplateplaceholder4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_sandboxtest_selecttemplateplaceholder4 = /** @type {((inputs?: Developerportal_Onboarding_Sandboxtest_Selecttemplateplaceholder4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Sandboxtest_Selecttemplateplaceholder4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_sandboxtest_selecttemplateplaceholder4(inputs)
	if (locale === "es") return es_developerportal_onboarding_sandboxtest_selecttemplateplaceholder4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_sandboxtest_selecttemplateplaceholder4(inputs)
	return ar_developerportal_onboarding_sandboxtest_selecttemplateplaceholder4(inputs)
});
export { developerportal_onboarding_sandboxtest_selecttemplateplaceholder4 as "developerPortal.onboarding.sandboxTest.selectTemplatePlaceholder" }