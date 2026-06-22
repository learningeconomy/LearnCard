/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Launchconfigstep_Skipinstallation4Inputs */

const en_developerportal_components_launchconfigstep_skipinstallation4 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Skipinstallation4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Skip Installation`)
};

const es_developerportal_components_launchconfigstep_skipinstallation4 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Skipinstallation4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Saltar Instalación`)
};

const fr_developerportal_components_launchconfigstep_skipinstallation4 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Skipinstallation4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ignorer l'Installation`)
};

const ar_developerportal_components_launchconfigstep_skipinstallation4 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Skipinstallation4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تخطي التثبيت`)
};

/**
* | output |
* | --- |
* | "Skip Installation" |
*
* @param {Developerportal_Components_Launchconfigstep_Skipinstallation4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_launchconfigstep_skipinstallation4 = /** @type {((inputs?: Developerportal_Components_Launchconfigstep_Skipinstallation4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Launchconfigstep_Skipinstallation4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_launchconfigstep_skipinstallation4(inputs)
	if (locale === "es") return es_developerportal_components_launchconfigstep_skipinstallation4(inputs)
	if (locale === "fr") return fr_developerportal_components_launchconfigstep_skipinstallation4(inputs)
	return ar_developerportal_components_launchconfigstep_skipinstallation4(inputs)
});
export { developerportal_components_launchconfigstep_skipinstallation4 as "developerPortal.components.launchConfigStep.skipInstallation" }