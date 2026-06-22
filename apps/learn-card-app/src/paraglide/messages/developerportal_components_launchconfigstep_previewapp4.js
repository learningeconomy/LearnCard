/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Launchconfigstep_Previewapp4Inputs */

const en_developerportal_components_launchconfigstep_previewapp4 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Previewapp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Preview App`)
};

const es_developerportal_components_launchconfigstep_previewapp4 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Previewapp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vista Previa de la App`)
};

const fr_developerportal_components_launchconfigstep_previewapp4 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Previewapp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aperçu de l'App`)
};

const ar_developerportal_components_launchconfigstep_previewapp4 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Previewapp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معاينة التطبيق`)
};

/**
* | output |
* | --- |
* | "Preview App" |
*
* @param {Developerportal_Components_Launchconfigstep_Previewapp4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_launchconfigstep_previewapp4 = /** @type {((inputs?: Developerportal_Components_Launchconfigstep_Previewapp4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Launchconfigstep_Previewapp4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_launchconfigstep_previewapp4(inputs)
	if (locale === "es") return es_developerportal_components_launchconfigstep_previewapp4(inputs)
	if (locale === "fr") return fr_developerportal_components_launchconfigstep_previewapp4(inputs)
	return ar_developerportal_components_launchconfigstep_previewapp4(inputs)
});
export { developerportal_components_launchconfigstep_previewapp4 as "developerPortal.components.launchConfigStep.previewApp" }