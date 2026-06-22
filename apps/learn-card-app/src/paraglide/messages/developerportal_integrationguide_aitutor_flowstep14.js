/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Aitutor_Flowstep14Inputs */

const en_developerportal_integrationguide_aitutor_flowstep14 = /** @type {(inputs: Developerportal_Integrationguide_Aitutor_Flowstep14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User clicks "Open" on your AI Tutor app`)
};

const es_developerportal_integrationguide_aitutor_flowstep14 = /** @type {(inputs: Developerportal_Integrationguide_Aitutor_Flowstep14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`El usuario hace clic en "Abrir" en tu aplicación de Tutor IA`)
};

const fr_developerportal_integrationguide_aitutor_flowstep14 = /** @type {(inputs: Developerportal_Integrationguide_Aitutor_Flowstep14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`L'utilisateur clique sur "Ouvrir" dans votre application de Tuteur IA`)
};

const ar_developerportal_integrationguide_aitutor_flowstep14 = /** @type {(inputs: Developerportal_Integrationguide_Aitutor_Flowstep14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ينقر المستخدم على "فتح" في تطبيق المعلم الذكي الخاص بك`)
};

/**
* | output |
* | --- |
* | "User clicks \"Open\" on your AI Tutor app" |
*
* @param {Developerportal_Integrationguide_Aitutor_Flowstep14Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_aitutor_flowstep14 = /** @type {((inputs?: Developerportal_Integrationguide_Aitutor_Flowstep14Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Aitutor_Flowstep14Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_aitutor_flowstep14(inputs)
	if (locale === "es") return es_developerportal_integrationguide_aitutor_flowstep14(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_aitutor_flowstep14(inputs)
	return ar_developerportal_integrationguide_aitutor_flowstep14(inputs)
});
export { developerportal_integrationguide_aitutor_flowstep14 as "developerPortal.integrationGuide.aiTutor.flowStep1" }