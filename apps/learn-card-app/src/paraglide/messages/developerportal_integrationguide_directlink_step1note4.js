/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Directlink_Step1note4Inputs */

const en_developerportal_integrationguide_directlink_step1note4 = /** @type {(inputs: Developerportal_Integrationguide_Directlink_Step1note4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This URL is configured in the Launch Configuration step.`)
};

const es_developerportal_integrationguide_directlink_step1note4 = /** @type {(inputs: Developerportal_Integrationguide_Directlink_Step1note4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Esta URL se configura en el paso de Configuración de Lanzamiento.`)
};

const fr_developerportal_integrationguide_directlink_step1note4 = /** @type {(inputs: Developerportal_Integrationguide_Directlink_Step1note4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cette URL est configurée lors de l'étape de Configuration de Lancement.`)
};

const ar_developerportal_integrationguide_directlink_step1note4 = /** @type {(inputs: Developerportal_Integrationguide_Directlink_Step1note4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم تكوين عنوان URL هذا في خطوة تكوين الإطلاق.`)
};

/**
* | output |
* | --- |
* | "This URL is configured in the Launch Configuration step." |
*
* @param {Developerportal_Integrationguide_Directlink_Step1note4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_directlink_step1note4 = /** @type {((inputs?: Developerportal_Integrationguide_Directlink_Step1note4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Directlink_Step1note4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_directlink_step1note4(inputs)
	if (locale === "es") return es_developerportal_integrationguide_directlink_step1note4(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_directlink_step1note4(inputs)
	return ar_developerportal_integrationguide_directlink_step1note4(inputs)
});
export { developerportal_integrationguide_directlink_step1note4 as "developerPortal.integrationGuide.directLink.step1Note" }