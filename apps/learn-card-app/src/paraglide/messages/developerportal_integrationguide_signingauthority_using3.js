/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Developerportal_Integrationguide_Signingauthority_Using3Inputs */

const en_developerportal_integrationguide_signingauthority_using3 = /** @type {(inputs: Developerportal_Integrationguide_Signingauthority_Using3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Using: ${i?.name}`)
};

const es_developerportal_integrationguide_signingauthority_using3 = /** @type {(inputs: Developerportal_Integrationguide_Signingauthority_Using3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Usando: ${i?.name}`)
};

const fr_developerportal_integrationguide_signingauthority_using3 = /** @type {(inputs: Developerportal_Integrationguide_Signingauthority_Using3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Utilisation : ${i?.name}`)
};

const ar_developerportal_integrationguide_signingauthority_using3 = /** @type {(inputs: Developerportal_Integrationguide_Signingauthority_Using3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`الاستخدام: ${i?.name}`)
};

/**
* | output |
* | --- |
* | "Using: {name}" |
*
* @param {Developerportal_Integrationguide_Signingauthority_Using3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_signingauthority_using3 = /** @type {((inputs: Developerportal_Integrationguide_Signingauthority_Using3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Signingauthority_Using3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_signingauthority_using3(inputs)
	if (locale === "es") return es_developerportal_integrationguide_signingauthority_using3(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_signingauthority_using3(inputs)
	return ar_developerportal_integrationguide_signingauthority_using3(inputs)
});
export { developerportal_integrationguide_signingauthority_using3 as "developerPortal.integrationGuide.signingAuthority.using" }