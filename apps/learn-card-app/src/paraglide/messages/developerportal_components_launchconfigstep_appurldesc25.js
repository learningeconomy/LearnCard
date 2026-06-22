/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Launchconfigstep_Appurldesc25Inputs */

const en_developerportal_components_launchconfigstep_appurldesc25 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Appurldesc25Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Users will be redirected to this URL.`)
};

const es_developerportal_components_launchconfigstep_appurldesc25 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Appurldesc25Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Users will be redirected to this URL.`)
};

const fr_developerportal_components_launchconfigstep_appurldesc25 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Appurldesc25Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Users will be redirected to this URL.`)
};

const ar_developerportal_components_launchconfigstep_appurldesc25 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Appurldesc25Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Users will be redirected to this URL.`)
};

/**
* | output |
* | --- |
* | "Users will be redirected to this URL." |
*
* @param {Developerportal_Components_Launchconfigstep_Appurldesc25Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_launchconfigstep_appurldesc25 = /** @type {((inputs?: Developerportal_Components_Launchconfigstep_Appurldesc25Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Launchconfigstep_Appurldesc25Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_launchconfigstep_appurldesc25(inputs)
	if (locale === "es") return es_developerportal_components_launchconfigstep_appurldesc25(inputs)
	if (locale === "fr") return fr_developerportal_components_launchconfigstep_appurldesc25(inputs)
	return ar_developerportal_components_launchconfigstep_appurldesc25(inputs)
});
export { developerportal_components_launchconfigstep_appurldesc25 as "developerPortal.components.launchConfigStep.appUrlDesc2" }