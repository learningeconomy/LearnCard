/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Requestdataconsentsetup_Selectcontract6Inputs */

const en_developerportal_guides_embedapp_requestdataconsentsetup_selectcontract6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestdataconsentsetup_Selectcontract6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select or Create a Consent Contract`)
};

const es_developerportal_guides_embedapp_requestdataconsentsetup_selectcontract6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestdataconsentsetup_Selectcontract6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select or Crear a Consent Contract`)
};

const fr_developerportal_guides_embedapp_requestdataconsentsetup_selectcontract6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestdataconsentsetup_Selectcontract6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionner ou Créer un Contrat de Consentement`)
};

const ar_developerportal_guides_embedapp_requestdataconsentsetup_selectcontract6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestdataconsentsetup_Selectcontract6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select or إنشاء a Consent Contract`)
};

/**
* | output |
* | --- |
* | "Select or Create a Consent Contract" |
*
* @param {Developerportal_Guides_Embedapp_Requestdataconsentsetup_Selectcontract6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_requestdataconsentsetup_selectcontract6 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Requestdataconsentsetup_Selectcontract6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Requestdataconsentsetup_Selectcontract6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_requestdataconsentsetup_selectcontract6(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_requestdataconsentsetup_selectcontract6(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_requestdataconsentsetup_selectcontract6(inputs)
	return ar_developerportal_guides_embedapp_requestdataconsentsetup_selectcontract6(inputs)
});
export { developerportal_guides_embedapp_requestdataconsentsetup_selectcontract6 as "developerPortal.guides.embedApp.requestDataConsentSetup.selectContract" }