/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Reviewstep_Privacypolicy3Inputs */

const en_developerportal_components_reviewstep_privacypolicy3 = /** @type {(inputs: Developerportal_Components_Reviewstep_Privacypolicy3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Privacy Policy`)
};

const es_developerportal_components_reviewstep_privacypolicy3 = /** @type {(inputs: Developerportal_Components_Reviewstep_Privacypolicy3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Política de Privacidad`)
};

const fr_developerportal_components_reviewstep_privacypolicy3 = /** @type {(inputs: Developerportal_Components_Reviewstep_Privacypolicy3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Politique de Confidentialité`)
};

const ar_developerportal_components_reviewstep_privacypolicy3 = /** @type {(inputs: Developerportal_Components_Reviewstep_Privacypolicy3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سياسة الخصوصية`)
};

/**
* | output |
* | --- |
* | "Privacy Policy" |
*
* @param {Developerportal_Components_Reviewstep_Privacypolicy3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_reviewstep_privacypolicy3 = /** @type {((inputs?: Developerportal_Components_Reviewstep_Privacypolicy3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Reviewstep_Privacypolicy3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_reviewstep_privacypolicy3(inputs)
	if (locale === "es") return es_developerportal_components_reviewstep_privacypolicy3(inputs)
	if (locale === "fr") return fr_developerportal_components_reviewstep_privacypolicy3(inputs)
	return ar_developerportal_components_reviewstep_privacypolicy3(inputs)
});
export { developerportal_components_reviewstep_privacypolicy3 as "developerPortal.components.reviewStep.privacyPolicy" }