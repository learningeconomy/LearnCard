/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appdetailsstep_Privacypolicyurl5Inputs */

const en_developerportal_components_appdetailsstep_privacypolicyurl5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Privacypolicyurl5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Privacy Policy URL`)
};

const es_developerportal_components_appdetailsstep_privacypolicyurl5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Privacypolicyurl5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL de Política de Privacidad`)
};

const fr_developerportal_components_appdetailsstep_privacypolicyurl5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Privacypolicyurl5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL de la Politique de Confidentialité`)
};

const ar_developerportal_components_appdetailsstep_privacypolicyurl5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Privacypolicyurl5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رابط سياسة الخصوصية`)
};

/**
* | output |
* | --- |
* | "Privacy Policy URL" |
*
* @param {Developerportal_Components_Appdetailsstep_Privacypolicyurl5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdetailsstep_privacypolicyurl5 = /** @type {((inputs?: Developerportal_Components_Appdetailsstep_Privacypolicyurl5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdetailsstep_Privacypolicyurl5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdetailsstep_privacypolicyurl5(inputs)
	if (locale === "es") return es_developerportal_components_appdetailsstep_privacypolicyurl5(inputs)
	if (locale === "fr") return fr_developerportal_components_appdetailsstep_privacypolicyurl5(inputs)
	return ar_developerportal_components_appdetailsstep_privacypolicyurl5(inputs)
});
export { developerportal_components_appdetailsstep_privacypolicyurl5 as "developerPortal.components.appDetailsStep.privacyPolicyUrl" }