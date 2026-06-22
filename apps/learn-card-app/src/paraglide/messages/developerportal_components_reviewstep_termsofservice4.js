/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Reviewstep_Termsofservice4Inputs */

const en_developerportal_components_reviewstep_termsofservice4 = /** @type {(inputs: Developerportal_Components_Reviewstep_Termsofservice4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Terms of Service`)
};

const es_developerportal_components_reviewstep_termsofservice4 = /** @type {(inputs: Developerportal_Components_Reviewstep_Termsofservice4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Términos de Servicio`)
};

const fr_developerportal_components_reviewstep_termsofservice4 = /** @type {(inputs: Developerportal_Components_Reviewstep_Termsofservice4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Conditions d'Utilisation`)
};

const ar_developerportal_components_reviewstep_termsofservice4 = /** @type {(inputs: Developerportal_Components_Reviewstep_Termsofservice4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`شروط الخدمة`)
};

/**
* | output |
* | --- |
* | "Terms of Service" |
*
* @param {Developerportal_Components_Reviewstep_Termsofservice4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_reviewstep_termsofservice4 = /** @type {((inputs?: Developerportal_Components_Reviewstep_Termsofservice4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Reviewstep_Termsofservice4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_reviewstep_termsofservice4(inputs)
	if (locale === "es") return es_developerportal_components_reviewstep_termsofservice4(inputs)
	if (locale === "fr") return fr_developerportal_components_reviewstep_termsofservice4(inputs)
	return ar_developerportal_components_reviewstep_termsofservice4(inputs)
});
export { developerportal_components_reviewstep_termsofservice4 as "developerPortal.components.reviewStep.termsOfService" }