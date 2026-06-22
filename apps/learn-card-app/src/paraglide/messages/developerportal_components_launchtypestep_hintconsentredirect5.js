/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Launchtypestep_Hintconsentredirect5Inputs */

const en_developerportal_components_launchtypestep_hintconsentredirect5 = /** @type {(inputs: Developerportal_Components_Launchtypestep_Hintconsentredirect5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You'll configure the consent flow contract URI and callback URL.`)
};

const es_developerportal_components_launchtypestep_hintconsentredirect5 = /** @type {(inputs: Developerportal_Components_Launchtypestep_Hintconsentredirect5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You'll configure the consent flow contract URI and callback URL.`)
};

const fr_developerportal_components_launchtypestep_hintconsentredirect5 = /** @type {(inputs: Developerportal_Components_Launchtypestep_Hintconsentredirect5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You'll configure the consent flow contract URI and callback URL.`)
};

const ar_developerportal_components_launchtypestep_hintconsentredirect5 = /** @type {(inputs: Developerportal_Components_Launchtypestep_Hintconsentredirect5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You'll configure the consent flow contract URI and callback URL.`)
};

/**
* | output |
* | --- |
* | "You'll configure the consent flow contract URI and callback URL." |
*
* @param {Developerportal_Components_Launchtypestep_Hintconsentredirect5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_launchtypestep_hintconsentredirect5 = /** @type {((inputs?: Developerportal_Components_Launchtypestep_Hintconsentredirect5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Launchtypestep_Hintconsentredirect5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_launchtypestep_hintconsentredirect5(inputs)
	if (locale === "es") return es_developerportal_components_launchtypestep_hintconsentredirect5(inputs)
	if (locale === "fr") return fr_developerportal_components_launchtypestep_hintconsentredirect5(inputs)
	return ar_developerportal_components_launchtypestep_hintconsentredirect5(inputs)
});
export { developerportal_components_launchtypestep_hintconsentredirect5 as "developerPortal.components.launchTypeStep.hintConsentRedirect" }