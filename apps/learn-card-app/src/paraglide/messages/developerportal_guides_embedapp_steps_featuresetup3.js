/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Steps_Featuresetup3Inputs */

const en_developerportal_guides_embedapp_steps_featuresetup3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Steps_Featuresetup3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Feature Setup`)
};

const es_developerportal_guides_embedapp_steps_featuresetup3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Steps_Featuresetup3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configuración de Funciones`)
};

const fr_developerportal_guides_embedapp_steps_featuresetup3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Steps_Featuresetup3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configuration des Fonctionnalités`)
};

const ar_developerportal_guides_embedapp_steps_featuresetup3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Steps_Featuresetup3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إعداد الميزات`)
};

/**
* | output |
* | --- |
* | "Feature Setup" |
*
* @param {Developerportal_Guides_Embedapp_Steps_Featuresetup3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_steps_featuresetup3 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Steps_Featuresetup3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Steps_Featuresetup3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_steps_featuresetup3(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_steps_featuresetup3(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_steps_featuresetup3(inputs)
	return ar_developerportal_guides_embedapp_steps_featuresetup3(inputs)
});
export { developerportal_guides_embedapp_steps_featuresetup3 as "developerPortal.guides.embedApp.steps.featureSetup" }