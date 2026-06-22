/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Hub_Comingsoon2Inputs */

const en_developerportal_guides_hub_comingsoon2 = /** @type {(inputs: Developerportal_Guides_Hub_Comingsoon2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Coming Soon`)
};

const es_developerportal_guides_hub_comingsoon2 = /** @type {(inputs: Developerportal_Guides_Hub_Comingsoon2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Próximamente`)
};

const fr_developerportal_guides_hub_comingsoon2 = /** @type {(inputs: Developerportal_Guides_Hub_Comingsoon2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Prochainement`)
};

const ar_developerportal_guides_hub_comingsoon2 = /** @type {(inputs: Developerportal_Guides_Hub_Comingsoon2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قريباً`)
};

/**
* | output |
* | --- |
* | "Coming Soon" |
*
* @param {Developerportal_Guides_Hub_Comingsoon2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_hub_comingsoon2 = /** @type {((inputs?: Developerportal_Guides_Hub_Comingsoon2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Hub_Comingsoon2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_hub_comingsoon2(inputs)
	if (locale === "es") return es_developerportal_guides_hub_comingsoon2(inputs)
	if (locale === "fr") return fr_developerportal_guides_hub_comingsoon2(inputs)
	return ar_developerportal_guides_hub_comingsoon2(inputs)
});
export { developerportal_guides_hub_comingsoon2 as "developerPortal.guides.hub.comingSoon" }