/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Signingauthority_Createdsuccess4Inputs */

const en_developerportal_integrationguide_signingauthority_createdsuccess4 = /** @type {(inputs: Developerportal_Integrationguide_Signingauthority_Createdsuccess4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Signing authority created successfully`)
};

const es_developerportal_integrationguide_signingauthority_createdsuccess4 = /** @type {(inputs: Developerportal_Integrationguide_Signingauthority_Createdsuccess4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Autoridad de firma creada exitosamente`)
};

const fr_developerportal_integrationguide_signingauthority_createdsuccess4 = /** @type {(inputs: Developerportal_Integrationguide_Signingauthority_Createdsuccess4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Autorité de signature créée avec succès`)
};

const ar_developerportal_integrationguide_signingauthority_createdsuccess4 = /** @type {(inputs: Developerportal_Integrationguide_Signingauthority_Createdsuccess4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم إنشاء سلطة التوقيع بنجاح`)
};

/**
* | output |
* | --- |
* | "Signing authority created successfully" |
*
* @param {Developerportal_Integrationguide_Signingauthority_Createdsuccess4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_signingauthority_createdsuccess4 = /** @type {((inputs?: Developerportal_Integrationguide_Signingauthority_Createdsuccess4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Signingauthority_Createdsuccess4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_signingauthority_createdsuccess4(inputs)
	if (locale === "es") return es_developerportal_integrationguide_signingauthority_createdsuccess4(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_signingauthority_createdsuccess4(inputs)
	return ar_developerportal_integrationguide_signingauthority_createdsuccess4(inputs)
});
export { developerportal_integrationguide_signingauthority_createdsuccess4 as "developerPortal.integrationGuide.signingAuthority.createdSuccess" }