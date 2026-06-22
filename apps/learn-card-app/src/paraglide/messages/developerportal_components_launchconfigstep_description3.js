/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Launchconfigstep_Description3Inputs */

const en_developerportal_components_launchconfigstep_description3 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configure the technical details for your integration`)
};

const es_developerportal_components_launchconfigstep_description3 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configura los detalles técnicos para tu integración`)
};

const fr_developerportal_components_launchconfigstep_description3 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configurez les détails techniques de votre intégration`)
};

const ar_developerportal_components_launchconfigstep_description3 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قم بتكوين التفاصيل الفنية لتكاملتك`)
};

/**
* | output |
* | --- |
* | "Configure the technical details for your integration" |
*
* @param {Developerportal_Components_Launchconfigstep_Description3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_launchconfigstep_description3 = /** @type {((inputs?: Developerportal_Components_Launchconfigstep_Description3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Launchconfigstep_Description3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_launchconfigstep_description3(inputs)
	if (locale === "es") return es_developerportal_components_launchconfigstep_description3(inputs)
	if (locale === "fr") return fr_developerportal_components_launchconfigstep_description3(inputs)
	return ar_developerportal_components_launchconfigstep_description3(inputs)
});
export { developerportal_components_launchconfigstep_description3 as "developerPortal.components.launchConfigStep.description" }