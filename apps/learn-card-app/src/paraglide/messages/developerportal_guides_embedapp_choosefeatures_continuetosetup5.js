/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Choosefeatures_Continuetosetup5Inputs */

const en_developerportal_guides_embedapp_choosefeatures_continuetosetup5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Choosefeatures_Continuetosetup5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continue to Setup`)
};

const es_developerportal_guides_embedapp_choosefeatures_continuetosetup5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Choosefeatures_Continuetosetup5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuar to Setup`)
};

const fr_developerportal_guides_embedapp_choosefeatures_continuetosetup5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Choosefeatures_Continuetosetup5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuer to Setup`)
};

const ar_developerportal_guides_embedapp_choosefeatures_continuetosetup5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Choosefeatures_Continuetosetup5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`متابعة to Setup`)
};

/**
* | output |
* | --- |
* | "Continue to Setup" |
*
* @param {Developerportal_Guides_Embedapp_Choosefeatures_Continuetosetup5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_choosefeatures_continuetosetup5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Choosefeatures_Continuetosetup5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Choosefeatures_Continuetosetup5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_choosefeatures_continuetosetup5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_choosefeatures_continuetosetup5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_choosefeatures_continuetosetup5(inputs)
	return ar_developerportal_guides_embedapp_choosefeatures_continuetosetup5(inputs)
});
export { developerportal_guides_embedapp_choosefeatures_continuetosetup5 as "developerPortal.guides.embedApp.chooseFeatures.continueToSetup" }