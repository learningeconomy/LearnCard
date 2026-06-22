/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Signingauthority_Createdefault4Inputs */

const en_developerportal_integrationguide_signingauthority_createdefault4 = /** @type {(inputs: Developerportal_Integrationguide_Signingauthority_Createdefault4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create Default Signing Authority`)
};

const es_developerportal_integrationguide_signingauthority_createdefault4 = /** @type {(inputs: Developerportal_Integrationguide_Signingauthority_Createdefault4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear Autoridad de Firma por Defecto`)
};

const fr_developerportal_integrationguide_signingauthority_createdefault4 = /** @type {(inputs: Developerportal_Integrationguide_Signingauthority_Createdefault4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer l'Autorité de Signature par Défaut`)
};

const ar_developerportal_integrationguide_signingauthority_createdefault4 = /** @type {(inputs: Developerportal_Integrationguide_Signingauthority_Createdefault4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء سلطة توقيع افتراضية`)
};

/**
* | output |
* | --- |
* | "Create Default Signing Authority" |
*
* @param {Developerportal_Integrationguide_Signingauthority_Createdefault4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_signingauthority_createdefault4 = /** @type {((inputs?: Developerportal_Integrationguide_Signingauthority_Createdefault4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Signingauthority_Createdefault4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_signingauthority_createdefault4(inputs)
	if (locale === "es") return es_developerportal_integrationguide_signingauthority_createdefault4(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_signingauthority_createdefault4(inputs)
	return ar_developerportal_integrationguide_signingauthority_createdefault4(inputs)
});
export { developerportal_integrationguide_signingauthority_createdefault4 as "developerPortal.integrationGuide.signingAuthority.createDefault" }