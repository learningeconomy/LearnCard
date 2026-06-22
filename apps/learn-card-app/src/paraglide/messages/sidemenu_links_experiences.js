/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidemenu_Links_ExperiencesInputs */

const en_sidemenu_links_experiences = /** @type {(inputs: Sidemenu_Links_ExperiencesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Experiences`)
};

const es_sidemenu_links_experiences = /** @type {(inputs: Sidemenu_Links_ExperiencesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Experiencias`)
};

const fr_sidemenu_links_experiences = /** @type {(inputs: Sidemenu_Links_ExperiencesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Expériences`)
};

const ar_sidemenu_links_experiences = /** @type {(inputs: Sidemenu_Links_ExperiencesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الخبرات`)
};

/**
* | output |
* | --- |
* | "Experiences" |
*
* @param {Sidemenu_Links_ExperiencesInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const sidemenu_links_experiences = /** @type {((inputs?: Sidemenu_Links_ExperiencesInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidemenu_Links_ExperiencesInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidemenu_links_experiences(inputs)
	if (locale === "es") return es_sidemenu_links_experiences(inputs)
	if (locale === "fr") return fr_sidemenu_links_experiences(inputs)
	return ar_sidemenu_links_experiences(inputs)
});
export { sidemenu_links_experiences as "sidemenu.links.experiences" }