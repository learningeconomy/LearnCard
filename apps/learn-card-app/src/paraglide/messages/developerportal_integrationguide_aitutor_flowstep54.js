/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Aitutor_Flowstep54Inputs */

const en_developerportal_integrationguide_aitutor_flowstep54 = /** @type {(inputs: Developerportal_Integrationguide_Aitutor_Flowstep54Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your AI tutor starts the personalized session`)
};

const es_developerportal_integrationguide_aitutor_flowstep54 = /** @type {(inputs: Developerportal_Integrationguide_Aitutor_Flowstep54Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tu tutor IA inicia la sesión personalizada`)
};

const fr_developerportal_integrationguide_aitutor_flowstep54 = /** @type {(inputs: Developerportal_Integrationguide_Aitutor_Flowstep54Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre tuteur IA démarre la session personnalisée`)
};

const ar_developerportal_integrationguide_aitutor_flowstep54 = /** @type {(inputs: Developerportal_Integrationguide_Aitutor_Flowstep54Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يبدأ المعلم الذكي الخاص بك الجلسة المخصصة`)
};

/**
* | output |
* | --- |
* | "Your AI tutor starts the personalized session" |
*
* @param {Developerportal_Integrationguide_Aitutor_Flowstep54Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_aitutor_flowstep54 = /** @type {((inputs?: Developerportal_Integrationguide_Aitutor_Flowstep54Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Aitutor_Flowstep54Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_aitutor_flowstep54(inputs)
	if (locale === "es") return es_developerportal_integrationguide_aitutor_flowstep54(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_aitutor_flowstep54(inputs)
	return ar_developerportal_integrationguide_aitutor_flowstep54(inputs)
});
export { developerportal_integrationguide_aitutor_flowstep54 as "developerPortal.integrationGuide.aiTutor.flowStep5" }