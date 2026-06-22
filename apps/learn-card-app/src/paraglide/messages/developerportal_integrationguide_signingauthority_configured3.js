/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Signingauthority_Configured3Inputs */

const en_developerportal_integrationguide_signingauthority_configured3 = /** @type {(inputs: Developerportal_Integrationguide_Signingauthority_Configured3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Signing Authority Configured`)
};

const es_developerportal_integrationguide_signingauthority_configured3 = /** @type {(inputs: Developerportal_Integrationguide_Signingauthority_Configured3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Autoridad de Firma Configurada`)
};

const fr_developerportal_integrationguide_signingauthority_configured3 = /** @type {(inputs: Developerportal_Integrationguide_Signingauthority_Configured3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Autorité de Signature Configurée`)
};

const ar_developerportal_integrationguide_signingauthority_configured3 = /** @type {(inputs: Developerportal_Integrationguide_Signingauthority_Configured3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم تكوين سلطة التوقيع`)
};

/**
* | output |
* | --- |
* | "Signing Authority Configured" |
*
* @param {Developerportal_Integrationguide_Signingauthority_Configured3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_signingauthority_configured3 = /** @type {((inputs?: Developerportal_Integrationguide_Signingauthority_Configured3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Signingauthority_Configured3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_signingauthority_configured3(inputs)
	if (locale === "es") return es_developerportal_integrationguide_signingauthority_configured3(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_signingauthority_configured3(inputs)
	return ar_developerportal_integrationguide_signingauthority_configured3(inputs)
});
export { developerportal_integrationguide_signingauthority_configured3 as "developerPortal.integrationGuide.signingAuthority.configured" }