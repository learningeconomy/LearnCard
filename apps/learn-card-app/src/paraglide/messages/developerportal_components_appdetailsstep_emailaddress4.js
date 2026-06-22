/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appdetailsstep_Emailaddress4Inputs */

const en_developerportal_components_appdetailsstep_emailaddress4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Emailaddress4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Email address`)
};

const es_developerportal_components_appdetailsstep_emailaddress4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Emailaddress4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dirección de correo electrónico`)
};

const fr_developerportal_components_appdetailsstep_emailaddress4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Emailaddress4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Adresse e-mail`)
};

const ar_developerportal_components_appdetailsstep_emailaddress4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Emailaddress4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عنوان البريد الإلكتروني`)
};

/**
* | output |
* | --- |
* | "Email address" |
*
* @param {Developerportal_Components_Appdetailsstep_Emailaddress4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdetailsstep_emailaddress4 = /** @type {((inputs?: Developerportal_Components_Appdetailsstep_Emailaddress4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdetailsstep_Emailaddress4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdetailsstep_emailaddress4(inputs)
	if (locale === "es") return es_developerportal_components_appdetailsstep_emailaddress4(inputs)
	if (locale === "fr") return fr_developerportal_components_appdetailsstep_emailaddress4(inputs)
	return ar_developerportal_components_appdetailsstep_emailaddress4(inputs)
});
export { developerportal_components_appdetailsstep_emailaddress4 as "developerPortal.components.appDetailsStep.emailAddress" }