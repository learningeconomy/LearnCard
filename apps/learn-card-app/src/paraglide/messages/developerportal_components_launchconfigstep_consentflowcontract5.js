/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Launchconfigstep_Consentflowcontract5Inputs */

const en_developerportal_components_launchconfigstep_consentflowcontract5 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Consentflowcontract5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Consent Flow Contract`)
};

const es_developerportal_components_launchconfigstep_consentflowcontract5 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Consentflowcontract5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contrato de Flujo de Consentimiento`)
};

const fr_developerportal_components_launchconfigstep_consentflowcontract5 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Consentflowcontract5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contrat de Flux de Consentement`)
};

const ar_developerportal_components_launchconfigstep_consentflowcontract5 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Consentflowcontract5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عقد تدفق الموافقة`)
};

/**
* | output |
* | --- |
* | "Consent Flow Contract" |
*
* @param {Developerportal_Components_Launchconfigstep_Consentflowcontract5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_launchconfigstep_consentflowcontract5 = /** @type {((inputs?: Developerportal_Components_Launchconfigstep_Consentflowcontract5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Launchconfigstep_Consentflowcontract5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_launchconfigstep_consentflowcontract5(inputs)
	if (locale === "es") return es_developerportal_components_launchconfigstep_consentflowcontract5(inputs)
	if (locale === "fr") return fr_developerportal_components_launchconfigstep_consentflowcontract5(inputs)
	return ar_developerportal_components_launchconfigstep_consentflowcontract5(inputs)
});
export { developerportal_components_launchconfigstep_consentflowcontract5 as "developerPortal.components.launchConfigStep.consentFlowContract" }