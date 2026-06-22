/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Steps_Yourapp3Inputs */

const en_developerportal_guides_embedapp_steps_yourapp3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Steps_Yourapp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your App`)
};

const es_developerportal_guides_embedapp_steps_yourapp3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Steps_Yourapp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tu Aplicación`)
};

const fr_developerportal_guides_embedapp_steps_yourapp3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Steps_Yourapp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre Application`)
};

const ar_developerportal_guides_embedapp_steps_yourapp3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Steps_Yourapp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تطبيقك`)
};

/**
* | output |
* | --- |
* | "Your App" |
*
* @param {Developerportal_Guides_Embedapp_Steps_Yourapp3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_steps_yourapp3 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Steps_Yourapp3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Steps_Yourapp3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_steps_yourapp3(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_steps_yourapp3(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_steps_yourapp3(inputs)
	return ar_developerportal_guides_embedapp_steps_yourapp3(inputs)
});
export { developerportal_guides_embedapp_steps_yourapp3 as "developerPortal.guides.embedApp.steps.yourApp" }