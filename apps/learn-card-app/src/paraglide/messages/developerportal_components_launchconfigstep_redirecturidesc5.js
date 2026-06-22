/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Launchconfigstep_Redirecturidesc5Inputs */

const en_developerportal_components_launchconfigstep_redirecturidesc5 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Redirecturidesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Where users will be redirected after granting consent. This can override the contract's redirect URL.`)
};

const es_developerportal_components_launchconfigstep_redirecturidesc5 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Redirecturidesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Where users will be redirected after granting consent. This can override the contract's redirect URL.`)
};

const fr_developerportal_components_launchconfigstep_redirecturidesc5 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Redirecturidesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Where users will be redirected after granting consent. This can override the contract's redirect URL.`)
};

const ar_developerportal_components_launchconfigstep_redirecturidesc5 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Redirecturidesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Where users will be redirected after granting consent. This can override the contract's redirect URL.`)
};

/**
* | output |
* | --- |
* | "Where users will be redirected after granting consent. This can override the contract's redirect URL." |
*
* @param {Developerportal_Components_Launchconfigstep_Redirecturidesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_launchconfigstep_redirecturidesc5 = /** @type {((inputs?: Developerportal_Components_Launchconfigstep_Redirecturidesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Launchconfigstep_Redirecturidesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_launchconfigstep_redirecturidesc5(inputs)
	if (locale === "es") return es_developerportal_components_launchconfigstep_redirecturidesc5(inputs)
	if (locale === "fr") return fr_developerportal_components_launchconfigstep_redirecturidesc5(inputs)
	return ar_developerportal_components_launchconfigstep_redirecturidesc5(inputs)
});
export { developerportal_components_launchconfigstep_redirecturidesc5 as "developerPortal.components.launchConfigStep.redirectUriDesc" }