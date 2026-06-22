/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Launchconfigstep_Appurldesc15Inputs */

const en_developerportal_components_launchconfigstep_appurldesc15 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Appurldesc15Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This URL will open in a new window when users launch your app.`)
};

const es_developerportal_components_launchconfigstep_appurldesc15 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Appurldesc15Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This URL will open in a new window when users launch your app.`)
};

const fr_developerportal_components_launchconfigstep_appurldesc15 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Appurldesc15Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This URL will open in a new window when users launch your app.`)
};

const ar_developerportal_components_launchconfigstep_appurldesc15 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Appurldesc15Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This URL will open in a new window when users launch your app.`)
};

/**
* | output |
* | --- |
* | "This URL will open in a new window when users launch your app." |
*
* @param {Developerportal_Components_Launchconfigstep_Appurldesc15Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_launchconfigstep_appurldesc15 = /** @type {((inputs?: Developerportal_Components_Launchconfigstep_Appurldesc15Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Launchconfigstep_Appurldesc15Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_launchconfigstep_appurldesc15(inputs)
	if (locale === "es") return es_developerportal_components_launchconfigstep_appurldesc15(inputs)
	if (locale === "fr") return fr_developerportal_components_launchconfigstep_appurldesc15(inputs)
	return ar_developerportal_components_launchconfigstep_appurldesc15(inputs)
});
export { developerportal_components_launchconfigstep_appurldesc15 as "developerPortal.components.launchConfigStep.appUrlDesc1" }