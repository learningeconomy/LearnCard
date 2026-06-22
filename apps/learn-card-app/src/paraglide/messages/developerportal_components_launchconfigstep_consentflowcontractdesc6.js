/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Launchconfigstep_Consentflowcontractdesc6Inputs */

const en_developerportal_components_launchconfigstep_consentflowcontractdesc6 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Consentflowcontractdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select a consent flow contract to request data sharing permissions when users install your app. Consent is automatically withdrawn when users uninstall.`)
};

const es_developerportal_components_launchconfigstep_consentflowcontractdesc6 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Consentflowcontractdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select a consent flow contract to request data sharing permissions when users install your app. Consent is automatically withdrawn when users uninstall.`)
};

const fr_developerportal_components_launchconfigstep_consentflowcontractdesc6 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Consentflowcontractdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select a consent flow contract to request data sharing permissions when users install your app. Consent is automatically withdrawn when users uninstall.`)
};

const ar_developerportal_components_launchconfigstep_consentflowcontractdesc6 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Consentflowcontractdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select a consent flow contract to request data sharing permissions when users install your app. Consent is automatically withdrawn when users uninstall.`)
};

/**
* | output |
* | --- |
* | "Select a consent flow contract to request data sharing permissions when users install your app. Consent is automatically withdrawn when users uninstall." |
*
* @param {Developerportal_Components_Launchconfigstep_Consentflowcontractdesc6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_launchconfigstep_consentflowcontractdesc6 = /** @type {((inputs?: Developerportal_Components_Launchconfigstep_Consentflowcontractdesc6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Launchconfigstep_Consentflowcontractdesc6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_launchconfigstep_consentflowcontractdesc6(inputs)
	if (locale === "es") return es_developerportal_components_launchconfigstep_consentflowcontractdesc6(inputs)
	if (locale === "fr") return fr_developerportal_components_launchconfigstep_consentflowcontractdesc6(inputs)
	return ar_developerportal_components_launchconfigstep_consentflowcontractdesc6(inputs)
});
export { developerportal_components_launchconfigstep_consentflowcontractdesc6 as "developerPortal.components.launchConfigStep.consentFlowContractDesc" }