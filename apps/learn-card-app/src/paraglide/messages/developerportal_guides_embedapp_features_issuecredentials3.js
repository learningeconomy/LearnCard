/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Features_Issuecredentials3Inputs */

const en_developerportal_guides_embedapp_features_issuecredentials3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Features_Issuecredentials3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issue Credentials`)
};

const es_developerportal_guides_embedapp_features_issuecredentials3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Features_Issuecredentials3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emitir Credenciales`)
};

const fr_developerportal_guides_embedapp_features_issuecredentials3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Features_Issuecredentials3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Émettre des Titres`)
};

const ar_developerportal_guides_embedapp_features_issuecredentials3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Features_Issuecredentials3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إصدار الشهادات`)
};

/**
* | output |
* | --- |
* | "Issue Credentials" |
*
* @param {Developerportal_Guides_Embedapp_Features_Issuecredentials3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_features_issuecredentials3 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Features_Issuecredentials3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Features_Issuecredentials3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_features_issuecredentials3(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_features_issuecredentials3(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_features_issuecredentials3(inputs)
	return ar_developerportal_guides_embedapp_features_issuecredentials3(inputs)
});
export { developerportal_guides_embedapp_features_issuecredentials3 as "developerPortal.guides.embedApp.features.issueCredentials" }