/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Requestdataconsentsetup_Readwritedata7Inputs */

const en_developerportal_guides_embedapp_requestdataconsentsetup_readwritedata7 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestdataconsentsetup_Readwritedata7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Read & Write Data (Server-Side)`)
};

const es_developerportal_guides_embedapp_requestdataconsentsetup_readwritedata7 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestdataconsentsetup_Readwritedata7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Leer y Escribir Datos (Servidor)`)
};

const fr_developerportal_guides_embedapp_requestdataconsentsetup_readwritedata7 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestdataconsentsetup_Readwritedata7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lire et Écrire des Données (Serveur)`)
};

const ar_developerportal_guides_embedapp_requestdataconsentsetup_readwritedata7 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestdataconsentsetup_Readwritedata7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قراءة وكتابة البيانات (الخادم)`)
};

/**
* | output |
* | --- |
* | "Read & Write Data (Server-Side)" |
*
* @param {Developerportal_Guides_Embedapp_Requestdataconsentsetup_Readwritedata7Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_requestdataconsentsetup_readwritedata7 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Requestdataconsentsetup_Readwritedata7Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Requestdataconsentsetup_Readwritedata7Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_requestdataconsentsetup_readwritedata7(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_requestdataconsentsetup_readwritedata7(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_requestdataconsentsetup_readwritedata7(inputs)
	return ar_developerportal_guides_embedapp_requestdataconsentsetup_readwritedata7(inputs)
});
export { developerportal_guides_embedapp_requestdataconsentsetup_readwritedata7 as "developerPortal.guides.embedApp.requestDataConsentSetup.readWriteData" }