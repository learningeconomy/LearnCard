/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Gettingstarted_Installsdk4Inputs */

const en_developerportal_guides_embedapp_gettingstarted_installsdk4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Gettingstarted_Installsdk4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Install the SDK`)
};

const es_developerportal_guides_embedapp_gettingstarted_installsdk4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Gettingstarted_Installsdk4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Instalar el SDK`)
};

const fr_developerportal_guides_embedapp_gettingstarted_installsdk4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Gettingstarted_Installsdk4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Installer le SDK`)
};

const ar_developerportal_guides_embedapp_gettingstarted_installsdk4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Gettingstarted_Installsdk4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تثبيت SDK`)
};

/**
* | output |
* | --- |
* | "Install the SDK" |
*
* @param {Developerportal_Guides_Embedapp_Gettingstarted_Installsdk4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_gettingstarted_installsdk4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Gettingstarted_Installsdk4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Gettingstarted_Installsdk4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_gettingstarted_installsdk4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_gettingstarted_installsdk4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_gettingstarted_installsdk4(inputs)
	return ar_developerportal_guides_embedapp_gettingstarted_installsdk4(inputs)
});
export { developerportal_guides_embedapp_gettingstarted_installsdk4 as "developerPortal.guides.embedApp.gettingStarted.installSdk" }