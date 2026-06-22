/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Signingauthority_Notfound4Inputs */

const en_developerportal_integrationguide_signingauthority_notfound4 = /** @type {(inputs: Developerportal_Integrationguide_Signingauthority_Notfound4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No Signing Authority Found`)
};

const es_developerportal_integrationguide_signingauthority_notfound4 = /** @type {(inputs: Developerportal_Integrationguide_Signingauthority_Notfound4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se encontró Autoridad de Firma`)
};

const fr_developerportal_integrationguide_signingauthority_notfound4 = /** @type {(inputs: Developerportal_Integrationguide_Signingauthority_Notfound4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune Autorité de Signature Trouvée`)
};

const ar_developerportal_integrationguide_signingauthority_notfound4 = /** @type {(inputs: Developerportal_Integrationguide_Signingauthority_Notfound4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم العثور على سلطة توقيع`)
};

/**
* | output |
* | --- |
* | "No Signing Authority Found" |
*
* @param {Developerportal_Integrationguide_Signingauthority_Notfound4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_signingauthority_notfound4 = /** @type {((inputs?: Developerportal_Integrationguide_Signingauthority_Notfound4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Signingauthority_Notfound4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_signingauthority_notfound4(inputs)
	if (locale === "es") return es_developerportal_integrationguide_signingauthority_notfound4(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_signingauthority_notfound4(inputs)
	return ar_developerportal_integrationguide_signingauthority_notfound4(inputs)
});
export { developerportal_integrationguide_signingauthority_notfound4 as "developerPortal.integrationGuide.signingAuthority.notFound" }