/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidemenu_Links_Launchpad1Inputs */

const en_sidemenu_links_launchpad1 = /** @type {(inputs: Sidemenu_Links_Launchpad1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Apps`)
};

const es_sidemenu_links_launchpad1 = /** @type {(inputs: Sidemenu_Links_Launchpad1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aplicaciones`)
};

const fr_sidemenu_links_launchpad1 = /** @type {(inputs: Sidemenu_Links_Launchpad1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Applications`)
};

const ar_sidemenu_links_launchpad1 = /** @type {(inputs: Sidemenu_Links_Launchpad1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التطبيقات`)
};

/**
* | output |
* | --- |
* | "Apps" |
*
* @param {Sidemenu_Links_Launchpad1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const sidemenu_links_launchpad1 = /** @type {((inputs?: Sidemenu_Links_Launchpad1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidemenu_Links_Launchpad1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidemenu_links_launchpad1(inputs)
	if (locale === "es") return es_sidemenu_links_launchpad1(inputs)
	if (locale === "fr") return fr_sidemenu_links_launchpad1(inputs)
	return ar_sidemenu_links_launchpad1(inputs)
});
export { sidemenu_links_launchpad1 as "sidemenu.links.launchPad" }