/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Sandboxtest_Templatesnotsaveddesc5Inputs */

const en_developerportal_onboarding_sandboxtest_templatesnotsaveddesc5 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Templatesnotsaveddesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Go back to the Templates step and save your templates before testing.`)
};

const es_developerportal_onboarding_sandboxtest_templatesnotsaveddesc5 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Templatesnotsaveddesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vuelve al paso de Plantillas y guarda tus plantillas antes de probar.`)
};

const fr_developerportal_onboarding_sandboxtest_templatesnotsaveddesc5 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Templatesnotsaveddesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Revenez à l'étape Modèles et enregistrez vos modèles avant de tester.`)
};

const ar_developerportal_onboarding_sandboxtest_templatesnotsaveddesc5 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Templatesnotsaveddesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عد إلى خطوة القوالب واحفظ قوالبك قبل الاختبار.`)
};

/**
* | output |
* | --- |
* | "Go back to the Templates step and save your templates before testing." |
*
* @param {Developerportal_Onboarding_Sandboxtest_Templatesnotsaveddesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_sandboxtest_templatesnotsaveddesc5 = /** @type {((inputs?: Developerportal_Onboarding_Sandboxtest_Templatesnotsaveddesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Sandboxtest_Templatesnotsaveddesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_sandboxtest_templatesnotsaveddesc5(inputs)
	if (locale === "es") return es_developerportal_onboarding_sandboxtest_templatesnotsaveddesc5(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_sandboxtest_templatesnotsaveddesc5(inputs)
	return ar_developerportal_onboarding_sandboxtest_templatesnotsaveddesc5(inputs)
});
export { developerportal_onboarding_sandboxtest_templatesnotsaveddesc5 as "developerPortal.onboarding.sandboxTest.templatesNotSavedDesc" }