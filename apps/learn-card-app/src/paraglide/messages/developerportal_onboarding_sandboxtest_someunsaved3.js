/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Sandboxtest_Someunsaved3Inputs */

const en_developerportal_onboarding_sandboxtest_someunsaved3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Someunsaved3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Some templates haven't been saved yet. Only saved templates can be tested.`)
};

const es_developerportal_onboarding_sandboxtest_someunsaved3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Someunsaved3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Algunas plantillas aún no se han guardado. Solo las plantillas guardadas se pueden probar.`)
};

const fr_developerportal_onboarding_sandboxtest_someunsaved3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Someunsaved3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Certains modèles n'ont pas encore été enregistrés. Seuls les modèles enregistrés peuvent être testés.`)
};

const ar_developerportal_onboarding_sandboxtest_someunsaved3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Someunsaved3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم حفظ بعض القوالب بعد. يمكن اختبار القوالب المحفوظة فقط.`)
};

/**
* | output |
* | --- |
* | "Some templates haven't been saved yet. Only saved templates can be tested." |
*
* @param {Developerportal_Onboarding_Sandboxtest_Someunsaved3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_sandboxtest_someunsaved3 = /** @type {((inputs?: Developerportal_Onboarding_Sandboxtest_Someunsaved3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Sandboxtest_Someunsaved3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_sandboxtest_someunsaved3(inputs)
	if (locale === "es") return es_developerportal_onboarding_sandboxtest_someunsaved3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_sandboxtest_someunsaved3(inputs)
	return ar_developerportal_onboarding_sandboxtest_someunsaved3(inputs)
});
export { developerportal_onboarding_sandboxtest_someunsaved3 as "developerPortal.onboarding.sandboxTest.someUnsaved" }