/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Aitutor_Flowstep34Inputs */

const en_developerportal_integrationguide_aitutor_flowstep34 = /** @type {(inputs: Developerportal_Integrationguide_Aitutor_Flowstep34Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User enters or selects a learning topic`)
};

const es_developerportal_integrationguide_aitutor_flowstep34 = /** @type {(inputs: Developerportal_Integrationguide_Aitutor_Flowstep34Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`El usuario ingresa o selecciona un tema de aprendizaje`)
};

const fr_developerportal_integrationguide_aitutor_flowstep34 = /** @type {(inputs: Developerportal_Integrationguide_Aitutor_Flowstep34Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`L'utilisateur saisit ou sélectionne un sujet d'apprentissage`)
};

const ar_developerportal_integrationguide_aitutor_flowstep34 = /** @type {(inputs: Developerportal_Integrationguide_Aitutor_Flowstep34Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يقوم المستخدم بإدخال أو تحديد موضوع تعليمي`)
};

/**
* | output |
* | --- |
* | "User enters or selects a learning topic" |
*
* @param {Developerportal_Integrationguide_Aitutor_Flowstep34Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_aitutor_flowstep34 = /** @type {((inputs?: Developerportal_Integrationguide_Aitutor_Flowstep34Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Aitutor_Flowstep34Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_aitutor_flowstep34(inputs)
	if (locale === "es") return es_developerportal_integrationguide_aitutor_flowstep34(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_aitutor_flowstep34(inputs)
	return ar_developerportal_integrationguide_aitutor_flowstep34(inputs)
});
export { developerportal_integrationguide_aitutor_flowstep34 as "developerPortal.integrationGuide.aiTutor.flowStep3" }