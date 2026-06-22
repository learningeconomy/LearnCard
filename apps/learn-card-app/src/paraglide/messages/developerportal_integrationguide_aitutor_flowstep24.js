/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Aitutor_Flowstep24Inputs */

const en_developerportal_integrationguide_aitutor_flowstep24 = /** @type {(inputs: Developerportal_Integrationguide_Aitutor_Flowstep24Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Topic selection modal appears (New Topic or Revisit)`)
};

const es_developerportal_integrationguide_aitutor_flowstep24 = /** @type {(inputs: Developerportal_Integrationguide_Aitutor_Flowstep24Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aparece el modal de selección de tema (Nuevo Tema o Revisitar)`)
};

const fr_developerportal_integrationguide_aitutor_flowstep24 = /** @type {(inputs: Developerportal_Integrationguide_Aitutor_Flowstep24Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La fenêtre modale de sélection du sujet apparaît (Nouveau Sujet ou Revoir)`)
};

const ar_developerportal_integrationguide_aitutor_flowstep24 = /** @type {(inputs: Developerportal_Integrationguide_Aitutor_Flowstep24Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تظهر نافذة اختيار الموضوع (موضوع جديد أو مراجعة)`)
};

/**
* | output |
* | --- |
* | "Topic selection modal appears (New Topic or Revisit)" |
*
* @param {Developerportal_Integrationguide_Aitutor_Flowstep24Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_aitutor_flowstep24 = /** @type {((inputs?: Developerportal_Integrationguide_Aitutor_Flowstep24Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Aitutor_Flowstep24Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_aitutor_flowstep24(inputs)
	if (locale === "es") return es_developerportal_integrationguide_aitutor_flowstep24(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_aitutor_flowstep24(inputs)
	return ar_developerportal_integrationguide_aitutor_flowstep24(inputs)
});
export { developerportal_integrationguide_aitutor_flowstep24 as "developerPortal.integrationGuide.aiTutor.flowStep2" }