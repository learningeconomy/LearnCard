/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Scopeoptions_Readonly4Inputs */

const en_developerportal_integrationguide_scopeoptions_readonly4 = /** @type {(inputs: Developerportal_Integrationguide_Scopeoptions_Readonly4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Read Only`)
};

const es_developerportal_integrationguide_scopeoptions_readonly4 = /** @type {(inputs: Developerportal_Integrationguide_Scopeoptions_Readonly4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solo Lectura`)
};

const fr_developerportal_integrationguide_scopeoptions_readonly4 = /** @type {(inputs: Developerportal_Integrationguide_Scopeoptions_Readonly4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lecture Seule`)
};

const ar_developerportal_integrationguide_scopeoptions_readonly4 = /** @type {(inputs: Developerportal_Integrationguide_Scopeoptions_Readonly4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قراءة فقط`)
};

/**
* | output |
* | --- |
* | "Read Only" |
*
* @param {Developerportal_Integrationguide_Scopeoptions_Readonly4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_scopeoptions_readonly4 = /** @type {((inputs?: Developerportal_Integrationguide_Scopeoptions_Readonly4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Scopeoptions_Readonly4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_scopeoptions_readonly4(inputs)
	if (locale === "es") return es_developerportal_integrationguide_scopeoptions_readonly4(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_scopeoptions_readonly4(inputs)
	return ar_developerportal_integrationguide_scopeoptions_readonly4(inputs)
});
export { developerportal_integrationguide_scopeoptions_readonly4 as "developerPortal.integrationGuide.scopeOptions.readOnly" }