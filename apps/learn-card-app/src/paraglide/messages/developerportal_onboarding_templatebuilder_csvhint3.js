/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Templatebuilder_Csvhint3Inputs */

const en_developerportal_onboarding_templatebuilder_csvhint3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvhint3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Upload a CSV of your courses to auto-generate a template with dynamic fields`)
};

const es_developerportal_onboarding_templatebuilder_csvhint3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvhint3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sube un CSV de tus cursos para generar automáticamente una plantilla con campos dinámicos`)
};

const fr_developerportal_onboarding_templatebuilder_csvhint3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvhint3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Téléchargez un CSV de vos cours pour générer automatiquement un modèle avec des champs dynamiques`)
};

const ar_developerportal_onboarding_templatebuilder_csvhint3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvhint3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قم برفع ملف CSV لدوراتك لإنشاء قالب تلقائياً مع حقول ديناميكية`)
};

/**
* | output |
* | --- |
* | "Upload a CSV of your courses to auto-generate a template with dynamic fields" |
*
* @param {Developerportal_Onboarding_Templatebuilder_Csvhint3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_csvhint3 = /** @type {((inputs?: Developerportal_Onboarding_Templatebuilder_Csvhint3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Csvhint3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_csvhint3(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_csvhint3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_csvhint3(inputs)
	return ar_developerportal_onboarding_templatebuilder_csvhint3(inputs)
});
export { developerportal_onboarding_templatebuilder_csvhint3 as "developerPortal.onboarding.templateBuilder.csvHint" }