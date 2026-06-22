/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Choosefeatures_Comingsoon4Inputs */

const en_developerportal_guides_embedapp_choosefeatures_comingsoon4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Choosefeatures_Comingsoon4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Coming Soon`)
};

const es_developerportal_guides_embedapp_choosefeatures_comingsoon4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Choosefeatures_Comingsoon4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Próximamente`)
};

const fr_developerportal_guides_embedapp_choosefeatures_comingsoon4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Choosefeatures_Comingsoon4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Prochainement`)
};

const ar_developerportal_guides_embedapp_choosefeatures_comingsoon4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Choosefeatures_Comingsoon4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قريباً`)
};

/**
* | output |
* | --- |
* | "Coming Soon" |
*
* @param {Developerportal_Guides_Embedapp_Choosefeatures_Comingsoon4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_choosefeatures_comingsoon4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Choosefeatures_Comingsoon4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Choosefeatures_Comingsoon4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_choosefeatures_comingsoon4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_choosefeatures_comingsoon4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_choosefeatures_comingsoon4(inputs)
	return ar_developerportal_guides_embedapp_choosefeatures_comingsoon4(inputs)
});
export { developerportal_guides_embedapp_choosefeatures_comingsoon4 as "developerPortal.guides.embedApp.chooseFeatures.comingSoon" }