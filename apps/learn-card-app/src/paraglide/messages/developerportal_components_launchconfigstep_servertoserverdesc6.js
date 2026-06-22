/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Launchconfigstep_Servertoserverdesc6Inputs */

const en_developerportal_components_launchconfigstep_servertoserverdesc6 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Servertoserverdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use the Universal Inbox API to issue credentials directly from your server. No additional configuration needed — see the integration guide for setup steps.`)
};

const es_developerportal_components_launchconfigstep_servertoserverdesc6 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Servertoserverdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use the Universal Inbox API to issue credentials directly from your server. No additional configuration needed — see the integration guide for setup steps.`)
};

const fr_developerportal_components_launchconfigstep_servertoserverdesc6 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Servertoserverdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use the Universal Inbox API to issue credentials directly from your server. No additional configuration needed — see the integration guide for setup steps.`)
};

const ar_developerportal_components_launchconfigstep_servertoserverdesc6 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Servertoserverdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use the Universal Inbox API to issue credentials directly from your server. No additional configuration needed — see the integration guide for setup steps.`)
};

/**
* | output |
* | --- |
* | "Use the Universal Inbox API to issue credentials directly from your server. No additional configuration needed — see the integration guide for setup steps." |
*
* @param {Developerportal_Components_Launchconfigstep_Servertoserverdesc6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_launchconfigstep_servertoserverdesc6 = /** @type {((inputs?: Developerportal_Components_Launchconfigstep_Servertoserverdesc6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Launchconfigstep_Servertoserverdesc6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_launchconfigstep_servertoserverdesc6(inputs)
	if (locale === "es") return es_developerportal_components_launchconfigstep_servertoserverdesc6(inputs)
	if (locale === "fr") return fr_developerportal_components_launchconfigstep_servertoserverdesc6(inputs)
	return ar_developerportal_components_launchconfigstep_servertoserverdesc6(inputs)
});
export { developerportal_components_launchconfigstep_servertoserverdesc6 as "developerPortal.components.launchConfigStep.serverToServerDesc" }