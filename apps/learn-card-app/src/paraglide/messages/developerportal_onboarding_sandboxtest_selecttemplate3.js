/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Sandboxtest_Selecttemplate3Inputs */

const en_developerportal_onboarding_sandboxtest_selecttemplate3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Selecttemplate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select Template to Test`)
};

const es_developerportal_onboarding_sandboxtest_selecttemplate3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Selecttemplate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seleccionar Plantilla para Probar`)
};

const fr_developerportal_onboarding_sandboxtest_selecttemplate3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Selecttemplate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionner un Modèle à Tester`)
};

const ar_developerportal_onboarding_sandboxtest_selecttemplate3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Selecttemplate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختيار قالب للاختبار`)
};

/**
* | output |
* | --- |
* | "Select Template to Test" |
*
* @param {Developerportal_Onboarding_Sandboxtest_Selecttemplate3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_sandboxtest_selecttemplate3 = /** @type {((inputs?: Developerportal_Onboarding_Sandboxtest_Selecttemplate3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Sandboxtest_Selecttemplate3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_sandboxtest_selecttemplate3(inputs)
	if (locale === "es") return es_developerportal_onboarding_sandboxtest_selecttemplate3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_sandboxtest_selecttemplate3(inputs)
	return ar_developerportal_onboarding_sandboxtest_selecttemplate3(inputs)
});
export { developerportal_onboarding_sandboxtest_selecttemplate3 as "developerPortal.onboarding.sandboxTest.selectTemplate" }