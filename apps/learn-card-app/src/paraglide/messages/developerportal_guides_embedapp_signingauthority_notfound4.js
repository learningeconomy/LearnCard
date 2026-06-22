/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Signingauthority_Notfound4Inputs */

const en_developerportal_guides_embedapp_signingauthority_notfound4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Signingauthority_Notfound4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No signing authority found`)
};

const es_developerportal_guides_embedapp_signingauthority_notfound4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Signingauthority_Notfound4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se encontró autoridad de firma`)
};

const fr_developerportal_guides_embedapp_signingauthority_notfound4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Signingauthority_Notfound4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune autorité de signature trouvée`)
};

const ar_developerportal_guides_embedapp_signingauthority_notfound4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Signingauthority_Notfound4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم العثور على سلطة توقيع`)
};

/**
* | output |
* | --- |
* | "No signing authority found" |
*
* @param {Developerportal_Guides_Embedapp_Signingauthority_Notfound4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_signingauthority_notfound4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Signingauthority_Notfound4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Signingauthority_Notfound4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_signingauthority_notfound4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_signingauthority_notfound4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_signingauthority_notfound4(inputs)
	return ar_developerportal_guides_embedapp_signingauthority_notfound4(inputs)
});
export { developerportal_guides_embedapp_signingauthority_notfound4 as "developerPortal.guides.embedApp.signingAuthority.notFound" }