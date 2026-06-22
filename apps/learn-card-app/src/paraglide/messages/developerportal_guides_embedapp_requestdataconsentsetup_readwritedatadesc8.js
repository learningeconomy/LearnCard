/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Requestdataconsentsetup_Readwritedatadesc8Inputs */

const en_developerportal_guides_embedapp_requestdataconsentsetup_readwritedatadesc8 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestdataconsentsetup_Readwritedatadesc8Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`On your server, initialize with your API key to read shared credentials and send new ones.`)
};

const es_developerportal_guides_embedapp_requestdataconsentsetup_readwritedatadesc8 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestdataconsentsetup_Readwritedatadesc8Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`On your server, initialize with your API key to read shared credentials and send new ones.`)
};

const fr_developerportal_guides_embedapp_requestdataconsentsetup_readwritedatadesc8 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestdataconsentsetup_Readwritedatadesc8Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`On your server, initialize with your API key to read shared credentials and send new ones.`)
};

const ar_developerportal_guides_embedapp_requestdataconsentsetup_readwritedatadesc8 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestdataconsentsetup_Readwritedatadesc8Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`On your server, initialize with your API key to read shared credentials and send new ones.`)
};

/**
* | output |
* | --- |
* | "On your server, initialize with your API key to read shared credentials and send new ones." |
*
* @param {Developerportal_Guides_Embedapp_Requestdataconsentsetup_Readwritedatadesc8Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_requestdataconsentsetup_readwritedatadesc8 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Requestdataconsentsetup_Readwritedatadesc8Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Requestdataconsentsetup_Readwritedatadesc8Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_requestdataconsentsetup_readwritedatadesc8(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_requestdataconsentsetup_readwritedatadesc8(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_requestdataconsentsetup_readwritedatadesc8(inputs)
	return ar_developerportal_guides_embedapp_requestdataconsentsetup_readwritedatadesc8(inputs)
});
export { developerportal_guides_embedapp_requestdataconsentsetup_readwritedatadesc8 as "developerPortal.guides.embedApp.requestDataConsentSetup.readWriteDataDesc" }