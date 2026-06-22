/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Aitutor_Step3title4Inputs */

const en_developerportal_integrationguide_aitutor_step3title4 = /** @type {(inputs: Developerportal_Integrationguide_Aitutor_Step3title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Track Learning Progress (Optional)`)
};

const es_developerportal_integrationguide_aitutor_step3title4 = /** @type {(inputs: Developerportal_Integrationguide_Aitutor_Step3title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Registrar Progreso de Aprendizaje (Opcional)`)
};

const fr_developerportal_integrationguide_aitutor_step3title4 = /** @type {(inputs: Developerportal_Integrationguide_Aitutor_Step3title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Suivre la Progression d'Apprentissage (Optionnel)`)
};

const ar_developerportal_integrationguide_aitutor_step3title4 = /** @type {(inputs: Developerportal_Integrationguide_Aitutor_Step3title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تتبع تقدم التعلم (اختياري)`)
};

/**
* | output |
* | --- |
* | "Track Learning Progress (Optional)" |
*
* @param {Developerportal_Integrationguide_Aitutor_Step3title4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_aitutor_step3title4 = /** @type {((inputs?: Developerportal_Integrationguide_Aitutor_Step3title4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Aitutor_Step3title4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_aitutor_step3title4(inputs)
	if (locale === "es") return es_developerportal_integrationguide_aitutor_step3title4(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_aitutor_step3title4(inputs)
	return ar_developerportal_integrationguide_aitutor_step3title4(inputs)
});
export { developerportal_integrationguide_aitutor_step3title4 as "developerPortal.integrationGuide.aiTutor.step3Title" }