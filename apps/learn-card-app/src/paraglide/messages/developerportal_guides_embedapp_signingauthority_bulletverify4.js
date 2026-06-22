/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Signingauthority_Bulletverify4Inputs */

const en_developerportal_guides_embedapp_signingauthority_bulletverify4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Signingauthority_Bulletverify4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Allows anyone to verify credentials you issue`)
};

const es_developerportal_guides_embedapp_signingauthority_bulletverify4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Signingauthority_Bulletverify4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Permite que cualquiera verifique las credenciales que emites`)
};

const fr_developerportal_guides_embedapp_signingauthority_bulletverify4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Signingauthority_Bulletverify4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Allows anyone to verify credentials you issue`)
};

const ar_developerportal_guides_embedapp_signingauthority_bulletverify4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Signingauthority_Bulletverify4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Allows anyone to verify credentials you issue`)
};

/**
* | output |
* | --- |
* | "Allows anyone to verify credentials you issue" |
*
* @param {Developerportal_Guides_Embedapp_Signingauthority_Bulletverify4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_signingauthority_bulletverify4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Signingauthority_Bulletverify4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Signingauthority_Bulletverify4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_signingauthority_bulletverify4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_signingauthority_bulletverify4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_signingauthority_bulletverify4(inputs)
	return ar_developerportal_guides_embedapp_signingauthority_bulletverify4(inputs)
});
export { developerportal_guides_embedapp_signingauthority_bulletverify4 as "developerPortal.guides.embedApp.signingAuthority.bulletVerify" }