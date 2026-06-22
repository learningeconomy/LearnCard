/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidemenu_Links_PersonalizeInputs */

const en_sidemenu_links_personalize = /** @type {(inputs: Sidemenu_Links_PersonalizeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Personalize`)
};

const es_sidemenu_links_personalize = /** @type {(inputs: Sidemenu_Links_PersonalizeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Personalizar`)
};

const fr_sidemenu_links_personalize = /** @type {(inputs: Sidemenu_Links_PersonalizeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Personnaliser`)
};

const ar_sidemenu_links_personalize = /** @type {(inputs: Sidemenu_Links_PersonalizeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تخصيص`)
};

/**
* | output |
* | --- |
* | "Personalize" |
*
* @param {Sidemenu_Links_PersonalizeInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const sidemenu_links_personalize = /** @type {((inputs?: Sidemenu_Links_PersonalizeInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidemenu_Links_PersonalizeInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidemenu_links_personalize(inputs)
	if (locale === "es") return es_sidemenu_links_personalize(inputs)
	if (locale === "fr") return fr_sidemenu_links_personalize(inputs)
	return ar_sidemenu_links_personalize(inputs)
});
export { sidemenu_links_personalize as "sidemenu.links.personalize" }