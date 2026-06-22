/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Steps_Test2Inputs */

const en_developerportal_guides_embedclaim_steps_test2 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Steps_Test2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Test It`)
};

const es_developerportal_guides_embedclaim_steps_test2 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Steps_Test2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Probar`)
};

const fr_developerportal_guides_embedclaim_steps_test2 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Steps_Test2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tester`)
};

const ar_developerportal_guides_embedclaim_steps_test2 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Steps_Test2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختبار`)
};

/**
* | output |
* | --- |
* | "Test It" |
*
* @param {Developerportal_Guides_Embedclaim_Steps_Test2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_steps_test2 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Steps_Test2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Steps_Test2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_steps_test2(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_steps_test2(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_steps_test2(inputs)
	return ar_developerportal_guides_embedclaim_steps_test2(inputs)
});
export { developerportal_guides_embedclaim_steps_test2 as "developerPortal.guides.embedClaim.steps.test" }