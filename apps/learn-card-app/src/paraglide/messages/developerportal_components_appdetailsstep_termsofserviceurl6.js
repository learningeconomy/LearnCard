/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appdetailsstep_Termsofserviceurl6Inputs */

const en_developerportal_components_appdetailsstep_termsofserviceurl6 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Termsofserviceurl6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Terms of Service URL`)
};

const es_developerportal_components_appdetailsstep_termsofserviceurl6 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Termsofserviceurl6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL de Términos de Servicio`)
};

const fr_developerportal_components_appdetailsstep_termsofserviceurl6 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Termsofserviceurl6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL des Conditions d'Utilisation`)
};

const ar_developerportal_components_appdetailsstep_termsofserviceurl6 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Termsofserviceurl6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رابط شروط الخدمة`)
};

/**
* | output |
* | --- |
* | "Terms of Service URL" |
*
* @param {Developerportal_Components_Appdetailsstep_Termsofserviceurl6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdetailsstep_termsofserviceurl6 = /** @type {((inputs?: Developerportal_Components_Appdetailsstep_Termsofserviceurl6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdetailsstep_Termsofserviceurl6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdetailsstep_termsofserviceurl6(inputs)
	if (locale === "es") return es_developerportal_components_appdetailsstep_termsofserviceurl6(inputs)
	if (locale === "fr") return fr_developerportal_components_appdetailsstep_termsofserviceurl6(inputs)
	return ar_developerportal_components_appdetailsstep_termsofserviceurl6(inputs)
});
export { developerportal_components_appdetailsstep_termsofserviceurl6 as "developerPortal.components.appDetailsStep.termsOfServiceUrl" }