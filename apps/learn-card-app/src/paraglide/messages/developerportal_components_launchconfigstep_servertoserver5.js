/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Launchconfigstep_Servertoserver5Inputs */

const en_developerportal_components_launchconfigstep_servertoserver5 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Servertoserver5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Server-to-Server Integration`)
};

const es_developerportal_components_launchconfigstep_servertoserver5 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Servertoserver5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Server-to-Server Integration`)
};

const fr_developerportal_components_launchconfigstep_servertoserver5 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Servertoserver5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Server-to-Server Integration`)
};

const ar_developerportal_components_launchconfigstep_servertoserver5 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Servertoserver5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Server-to-Server Integration`)
};

/**
* | output |
* | --- |
* | "Server-to-Server Integration" |
*
* @param {Developerportal_Components_Launchconfigstep_Servertoserver5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_launchconfigstep_servertoserver5 = /** @type {((inputs?: Developerportal_Components_Launchconfigstep_Servertoserver5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Launchconfigstep_Servertoserver5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_launchconfigstep_servertoserver5(inputs)
	if (locale === "es") return es_developerportal_components_launchconfigstep_servertoserver5(inputs)
	if (locale === "fr") return fr_developerportal_components_launchconfigstep_servertoserver5(inputs)
	return ar_developerportal_components_launchconfigstep_servertoserver5(inputs)
});
export { developerportal_components_launchconfigstep_servertoserver5 as "developerPortal.components.launchConfigStep.serverToServer" }