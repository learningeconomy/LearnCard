/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Signingauthority_Checking3Inputs */

const en_developerportal_integrationguide_signingauthority_checking3 = /** @type {(inputs: Developerportal_Integrationguide_Signingauthority_Checking3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Checking signing authority...`)
};

const es_developerportal_integrationguide_signingauthority_checking3 = /** @type {(inputs: Developerportal_Integrationguide_Signingauthority_Checking3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verificando autoridad de firma...`)
};

const fr_developerportal_integrationguide_signingauthority_checking3 = /** @type {(inputs: Developerportal_Integrationguide_Signingauthority_Checking3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérification de l'autorité de signature...`)
};

const ar_developerportal_integrationguide_signingauthority_checking3 = /** @type {(inputs: Developerportal_Integrationguide_Signingauthority_Checking3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ التحقق من سلطة التوقيع...`)
};

/**
* | output |
* | --- |
* | "Checking signing authority..." |
*
* @param {Developerportal_Integrationguide_Signingauthority_Checking3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_signingauthority_checking3 = /** @type {((inputs?: Developerportal_Integrationguide_Signingauthority_Checking3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Signingauthority_Checking3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_signingauthority_checking3(inputs)
	if (locale === "es") return es_developerportal_integrationguide_signingauthority_checking3(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_signingauthority_checking3(inputs)
	return ar_developerportal_integrationguide_signingauthority_checking3(inputs)
});
export { developerportal_integrationguide_signingauthority_checking3 as "developerPortal.integrationGuide.signingAuthority.checking" }