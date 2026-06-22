/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Launchconfigstep_Aitutorurlplaceholder6Inputs */

const en_developerportal_components_launchconfigstep_aitutorurlplaceholder6 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Aitutorurlplaceholder6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://yourtutor.com`)
};

const es_developerportal_components_launchconfigstep_aitutorurlplaceholder6 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Aitutorurlplaceholder6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://tututor.com`)
};

const fr_developerportal_components_launchconfigstep_aitutorurlplaceholder6 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Aitutorurlplaceholder6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://votretuteur.com`)
};

const ar_developerportal_components_launchconfigstep_aitutorurlplaceholder6 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Aitutorurlplaceholder6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://yourtutor.com`)
};

/**
* | output |
* | --- |
* | "https://yourtutor.com" |
*
* @param {Developerportal_Components_Launchconfigstep_Aitutorurlplaceholder6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_launchconfigstep_aitutorurlplaceholder6 = /** @type {((inputs?: Developerportal_Components_Launchconfigstep_Aitutorurlplaceholder6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Launchconfigstep_Aitutorurlplaceholder6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_launchconfigstep_aitutorurlplaceholder6(inputs)
	if (locale === "es") return es_developerportal_components_launchconfigstep_aitutorurlplaceholder6(inputs)
	if (locale === "fr") return fr_developerportal_components_launchconfigstep_aitutorurlplaceholder6(inputs)
	return ar_developerportal_components_launchconfigstep_aitutorurlplaceholder6(inputs)
});
export { developerportal_components_launchconfigstep_aitutorurlplaceholder6 as "developerPortal.components.launchConfigStep.aiTutorUrlPlaceholder" }