/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Signingauthority_Createdfailed4Inputs */

const en_developerportal_integrationguide_signingauthority_createdfailed4 = /** @type {(inputs: Developerportal_Integrationguide_Signingauthority_Createdfailed4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to create signing authority`)
};

const es_developerportal_integrationguide_signingauthority_createdfailed4 = /** @type {(inputs: Developerportal_Integrationguide_Signingauthority_Createdfailed4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al crear la autoridad de firma`)
};

const fr_developerportal_integrationguide_signingauthority_createdfailed4 = /** @type {(inputs: Developerportal_Integrationguide_Signingauthority_Createdfailed4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de la création de l'autorité de signature`)
};

const ar_developerportal_integrationguide_signingauthority_createdfailed4 = /** @type {(inputs: Developerportal_Integrationguide_Signingauthority_Createdfailed4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل إنشاء سلطة التوقيع`)
};

/**
* | output |
* | --- |
* | "Failed to create signing authority" |
*
* @param {Developerportal_Integrationguide_Signingauthority_Createdfailed4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_signingauthority_createdfailed4 = /** @type {((inputs?: Developerportal_Integrationguide_Signingauthority_Createdfailed4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Signingauthority_Createdfailed4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_signingauthority_createdfailed4(inputs)
	if (locale === "es") return es_developerportal_integrationguide_signingauthority_createdfailed4(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_signingauthority_createdfailed4(inputs)
	return ar_developerportal_integrationguide_signingauthority_createdfailed4(inputs)
});
export { developerportal_integrationguide_signingauthority_createdfailed4 as "developerPortal.integrationGuide.signingAuthority.createdFailed" }