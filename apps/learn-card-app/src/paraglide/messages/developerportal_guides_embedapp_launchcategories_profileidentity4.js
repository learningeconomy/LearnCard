/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Launchcategories_Profileidentity4Inputs */

const en_developerportal_guides_embedapp_launchcategories_profileidentity4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchcategories_Profileidentity4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Profile & Identity`)
};

const es_developerportal_guides_embedapp_launchcategories_profileidentity4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchcategories_Profileidentity4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Perfil e Identidad`)
};

const fr_developerportal_guides_embedapp_launchcategories_profileidentity4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchcategories_Profileidentity4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Profil & Identité`)
};

const ar_developerportal_guides_embedapp_launchcategories_profileidentity4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchcategories_Profileidentity4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الملف الشخصي والهوية`)
};

/**
* | output |
* | --- |
* | "Profile & Identity" |
*
* @param {Developerportal_Guides_Embedapp_Launchcategories_Profileidentity4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_launchcategories_profileidentity4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Launchcategories_Profileidentity4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Launchcategories_Profileidentity4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_launchcategories_profileidentity4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_launchcategories_profileidentity4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_launchcategories_profileidentity4(inputs)
	return ar_developerportal_guides_embedapp_launchcategories_profileidentity4(inputs)
});
export { developerportal_guides_embedapp_launchcategories_profileidentity4 as "developerPortal.guides.embedApp.launchCategories.profileIdentity" }