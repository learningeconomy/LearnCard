/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Gettingstarted_Selectorcreateapp6Inputs */

const en_developerportal_guides_embedapp_gettingstarted_selectorcreateapp6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Gettingstarted_Selectorcreateapp6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select or Create Your App`)
};

const es_developerportal_guides_embedapp_gettingstarted_selectorcreateapp6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Gettingstarted_Selectorcreateapp6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select or Crear Tu Aplicación`)
};

const fr_developerportal_guides_embedapp_gettingstarted_selectorcreateapp6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Gettingstarted_Selectorcreateapp6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select or Create Votre Application`)
};

const ar_developerportal_guides_embedapp_gettingstarted_selectorcreateapp6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Gettingstarted_Selectorcreateapp6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select or إنشاء تطبيقك`)
};

/**
* | output |
* | --- |
* | "Select or Create Your App" |
*
* @param {Developerportal_Guides_Embedapp_Gettingstarted_Selectorcreateapp6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_gettingstarted_selectorcreateapp6 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Gettingstarted_Selectorcreateapp6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Gettingstarted_Selectorcreateapp6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_gettingstarted_selectorcreateapp6(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_gettingstarted_selectorcreateapp6(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_gettingstarted_selectorcreateapp6(inputs)
	return ar_developerportal_guides_embedapp_gettingstarted_selectorcreateapp6(inputs)
});
export { developerportal_guides_embedapp_gettingstarted_selectorcreateapp6 as "developerPortal.guides.embedApp.gettingStarted.selectOrCreateApp" }