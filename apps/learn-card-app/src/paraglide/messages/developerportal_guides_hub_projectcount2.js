/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Developerportal_Guides_Hub_Projectcount2Inputs */

const en_developerportal_guides_hub_projectcount2 = /** @type {(inputs: Developerportal_Guides_Hub_Projectcount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`You have ${i?.count} projects`)
};

const es_developerportal_guides_hub_projectcount2 = /** @type {(inputs: Developerportal_Guides_Hub_Projectcount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Tienes ${i?.count} proyectos`)
};

const fr_developerportal_guides_hub_projectcount2 = /** @type {(inputs: Developerportal_Guides_Hub_Projectcount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Vous avez ${i?.count} projets`)
};

const ar_developerportal_guides_hub_projectcount2 = /** @type {(inputs: Developerportal_Guides_Hub_Projectcount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`لديك ${i?.count} مشاريع`)
};

/**
* | output |
* | --- |
* | "You have {count} projects" |
*
* @param {Developerportal_Guides_Hub_Projectcount2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_hub_projectcount2 = /** @type {((inputs: Developerportal_Guides_Hub_Projectcount2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Hub_Projectcount2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_hub_projectcount2(inputs)
	if (locale === "es") return es_developerportal_guides_hub_projectcount2(inputs)
	if (locale === "fr") return fr_developerportal_guides_hub_projectcount2(inputs)
	return ar_developerportal_guides_hub_projectcount2(inputs)
});
export { developerportal_guides_hub_projectcount2 as "developerPortal.guides.hub.projectCount" }