/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Aitutor_Step3desc4Inputs */

const en_developerportal_integrationguide_aitutor_step3desc4 = /** @type {(inputs: Developerportal_Integrationguide_Aitutor_Step3desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issue credentials for completed learning milestones.`)
};

const es_developerportal_integrationguide_aitutor_step3desc4 = /** @type {(inputs: Developerportal_Integrationguide_Aitutor_Step3desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emite credenciales por hitos de aprendizaje completados.`)
};

const fr_developerportal_integrationguide_aitutor_step3desc4 = /** @type {(inputs: Developerportal_Integrationguide_Aitutor_Step3desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Émettez des identifiants pour les étapes d'apprentissage accomplies.`)
};

const ar_developerportal_integrationguide_aitutor_step3desc4 = /** @type {(inputs: Developerportal_Integrationguide_Aitutor_Step3desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إصدار بيانات الاعتماد لمراحل التعلم المكتملة.`)
};

/**
* | output |
* | --- |
* | "Issue credentials for completed learning milestones." |
*
* @param {Developerportal_Integrationguide_Aitutor_Step3desc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_aitutor_step3desc4 = /** @type {((inputs?: Developerportal_Integrationguide_Aitutor_Step3desc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Aitutor_Step3desc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_aitutor_step3desc4(inputs)
	if (locale === "es") return es_developerportal_integrationguide_aitutor_step3desc4(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_aitutor_step3desc4(inputs)
	return ar_developerportal_integrationguide_aitutor_step3desc4(inputs)
});
export { developerportal_integrationguide_aitutor_step3desc4 as "developerPortal.integrationGuide.aiTutor.step3Desc" }