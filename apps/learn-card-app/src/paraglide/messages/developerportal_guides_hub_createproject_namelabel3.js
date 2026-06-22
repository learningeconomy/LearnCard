/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Hub_Createproject_Namelabel3Inputs */

const en_developerportal_guides_hub_createproject_namelabel3 = /** @type {(inputs: Developerportal_Guides_Hub_Createproject_Namelabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Name your project`)
};

const es_developerportal_guides_hub_createproject_namelabel3 = /** @type {(inputs: Developerportal_Guides_Hub_Createproject_Namelabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombra tu proyecto`)
};

const fr_developerportal_guides_hub_createproject_namelabel3 = /** @type {(inputs: Developerportal_Guides_Hub_Createproject_Namelabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nommez votre projet`)
};

const ar_developerportal_guides_hub_createproject_namelabel3 = /** @type {(inputs: Developerportal_Guides_Hub_Createproject_Namelabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سمِّ مشروعك`)
};

/**
* | output |
* | --- |
* | "Name your project" |
*
* @param {Developerportal_Guides_Hub_Createproject_Namelabel3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_hub_createproject_namelabel3 = /** @type {((inputs?: Developerportal_Guides_Hub_Createproject_Namelabel3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Hub_Createproject_Namelabel3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_hub_createproject_namelabel3(inputs)
	if (locale === "es") return es_developerportal_guides_hub_createproject_namelabel3(inputs)
	if (locale === "fr") return fr_developerportal_guides_hub_createproject_namelabel3(inputs)
	return ar_developerportal_guides_hub_createproject_namelabel3(inputs)
});
export { developerportal_guides_hub_createproject_namelabel3 as "developerPortal.guides.hub.createProject.nameLabel" }