/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Launchconfigstep_Selectcontracttoview6Inputs */

const en_developerportal_components_launchconfigstep_selectcontracttoview6 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Selectcontracttoview6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select a contract to view its permissions`)
};

const es_developerportal_components_launchconfigstep_selectcontracttoview6 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Selectcontracttoview6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select a contract to view its permissions`)
};

const fr_developerportal_components_launchconfigstep_selectcontracttoview6 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Selectcontracttoview6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select a contract to view its permissions`)
};

const ar_developerportal_components_launchconfigstep_selectcontracttoview6 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Selectcontracttoview6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select a contract to view its permissions`)
};

/**
* | output |
* | --- |
* | "Select a contract to view its permissions" |
*
* @param {Developerportal_Components_Launchconfigstep_Selectcontracttoview6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_launchconfigstep_selectcontracttoview6 = /** @type {((inputs?: Developerportal_Components_Launchconfigstep_Selectcontracttoview6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Launchconfigstep_Selectcontracttoview6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_launchconfigstep_selectcontracttoview6(inputs)
	if (locale === "es") return es_developerportal_components_launchconfigstep_selectcontracttoview6(inputs)
	if (locale === "fr") return fr_developerportal_components_launchconfigstep_selectcontracttoview6(inputs)
	return ar_developerportal_components_launchconfigstep_selectcontracttoview6(inputs)
});
export { developerportal_components_launchconfigstep_selectcontracttoview6 as "developerPortal.components.launchConfigStep.selectContractToView" }