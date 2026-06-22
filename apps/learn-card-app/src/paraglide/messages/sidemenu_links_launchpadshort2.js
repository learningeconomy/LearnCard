/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidemenu_Links_Launchpadshort2Inputs */

const en_sidemenu_links_launchpadshort2 = /** @type {(inputs: Sidemenu_Links_Launchpadshort2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Apps`)
};

const es_sidemenu_links_launchpadshort2 = /** @type {(inputs: Sidemenu_Links_Launchpadshort2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Apps`)
};

const fr_sidemenu_links_launchpadshort2 = /** @type {(inputs: Sidemenu_Links_Launchpadshort2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Applis`)
};

const ar_sidemenu_links_launchpadshort2 = /** @type {(inputs: Sidemenu_Links_Launchpadshort2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تطبيقات`)
};

/**
* | output |
* | --- |
* | "Apps" |
*
* @param {Sidemenu_Links_Launchpadshort2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const sidemenu_links_launchpadshort2 = /** @type {((inputs?: Sidemenu_Links_Launchpadshort2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidemenu_Links_Launchpadshort2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidemenu_links_launchpadshort2(inputs)
	if (locale === "es") return es_sidemenu_links_launchpadshort2(inputs)
	if (locale === "fr") return fr_sidemenu_links_launchpadshort2(inputs)
	return ar_sidemenu_links_launchpadshort2(inputs)
});
export { sidemenu_links_launchpadshort2 as "sidemenu.links.launchPadShort" }