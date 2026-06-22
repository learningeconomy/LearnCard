/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Aitutor_Step1redirect4Inputs */

const en_developerportal_integrationguide_aitutor_step1redirect4 = /** @type {(inputs: Developerportal_Integrationguide_Aitutor_Step1redirect4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Users will be redirected to:`)
};

const es_developerportal_integrationguide_aitutor_step1redirect4 = /** @type {(inputs: Developerportal_Integrationguide_Aitutor_Step1redirect4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Los usuarios serán redirigidos a:`)
};

const fr_developerportal_integrationguide_aitutor_step1redirect4 = /** @type {(inputs: Developerportal_Integrationguide_Aitutor_Step1redirect4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Les utilisateurs seront redirigés vers :`)
};

const ar_developerportal_integrationguide_aitutor_step1redirect4 = /** @type {(inputs: Developerportal_Integrationguide_Aitutor_Step1redirect4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ستتم إعادة توجيه المستخدمين إلى:`)
};

/**
* | output |
* | --- |
* | "Users will be redirected to:" |
*
* @param {Developerportal_Integrationguide_Aitutor_Step1redirect4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_aitutor_step1redirect4 = /** @type {((inputs?: Developerportal_Integrationguide_Aitutor_Step1redirect4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Aitutor_Step1redirect4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_aitutor_step1redirect4(inputs)
	if (locale === "es") return es_developerportal_integrationguide_aitutor_step1redirect4(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_aitutor_step1redirect4(inputs)
	return ar_developerportal_integrationguide_aitutor_step1redirect4(inputs)
});
export { developerportal_integrationguide_aitutor_step1redirect4 as "developerPortal.integrationGuide.aiTutor.step1Redirect" }