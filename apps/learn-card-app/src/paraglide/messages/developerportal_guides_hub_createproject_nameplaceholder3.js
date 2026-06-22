/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Hub_Createproject_Nameplaceholder3Inputs */

const en_developerportal_guides_hub_createproject_nameplaceholder3 = /** @type {(inputs: Developerportal_Guides_Hub_Createproject_Nameplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`e.g. My Awesome App`)
};

const es_developerportal_guides_hub_createproject_nameplaceholder3 = /** @type {(inputs: Developerportal_Guides_Hub_Createproject_Nameplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ej. Mi App Increíble`)
};

const fr_developerportal_guides_hub_createproject_nameplaceholder3 = /** @type {(inputs: Developerportal_Guides_Hub_Createproject_Nameplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ex. Mon App Géniale`)
};

const ar_developerportal_guides_hub_createproject_nameplaceholder3 = /** @type {(inputs: Developerportal_Guides_Hub_Createproject_Nameplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مثال: تطبيقي الرائع`)
};

/**
* | output |
* | --- |
* | "e.g. My Awesome App" |
*
* @param {Developerportal_Guides_Hub_Createproject_Nameplaceholder3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_hub_createproject_nameplaceholder3 = /** @type {((inputs?: Developerportal_Guides_Hub_Createproject_Nameplaceholder3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Hub_Createproject_Nameplaceholder3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_hub_createproject_nameplaceholder3(inputs)
	if (locale === "es") return es_developerportal_guides_hub_createproject_nameplaceholder3(inputs)
	if (locale === "fr") return fr_developerportal_guides_hub_createproject_nameplaceholder3(inputs)
	return ar_developerportal_guides_hub_createproject_nameplaceholder3(inputs)
});
export { developerportal_guides_hub_createproject_nameplaceholder3 as "developerPortal.guides.hub.createProject.namePlaceholder" }