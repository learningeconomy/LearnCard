/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidemenu_Viewsharedboosts2Inputs */

const en_sidemenu_viewsharedboosts2 = /** @type {(inputs: Sidemenu_Viewsharedboosts2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`View Shared Boosts`)
};

const es_sidemenu_viewsharedboosts2 = /** @type {(inputs: Sidemenu_Viewsharedboosts2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ver Boosts Compartidos`)
};

const fr_sidemenu_viewsharedboosts2 = /** @type {(inputs: Sidemenu_Viewsharedboosts2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voir les Boosts partagés`)
};

const ar_sidemenu_viewsharedboosts2 = /** @type {(inputs: Sidemenu_Viewsharedboosts2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`View Shared Boosts`)
};

/**
* | output |
* | --- |
* | "View Shared Boosts" |
*
* @param {Sidemenu_Viewsharedboosts2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const sidemenu_viewsharedboosts2 = /** @type {((inputs?: Sidemenu_Viewsharedboosts2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidemenu_Viewsharedboosts2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidemenu_viewsharedboosts2(inputs)
	if (locale === "es") return es_sidemenu_viewsharedboosts2(inputs)
	if (locale === "fr") return fr_sidemenu_viewsharedboosts2(inputs)
	return ar_sidemenu_viewsharedboosts2(inputs)
});
export { sidemenu_viewsharedboosts2 as "sidemenu.viewSharedBoosts" }