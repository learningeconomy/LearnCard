/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Sidebar_Nolistingsfound4Inputs */

const en_appstoreadmin_sidebar_nolistingsfound4 = /** @type {(inputs: Appstoreadmin_Sidebar_Nolistingsfound4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No listings found`)
};

const es_appstoreadmin_sidebar_nolistingsfound4 = /** @type {(inputs: Appstoreadmin_Sidebar_Nolistingsfound4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se encontraron listados`)
};

const fr_appstoreadmin_sidebar_nolistingsfound4 = /** @type {(inputs: Appstoreadmin_Sidebar_Nolistingsfound4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune annonce trouvée`)
};

const ar_appstoreadmin_sidebar_nolistingsfound4 = /** @type {(inputs: Appstoreadmin_Sidebar_Nolistingsfound4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم العثور على قوائم`)
};

/**
* | output |
* | --- |
* | "No listings found" |
*
* @param {Appstoreadmin_Sidebar_Nolistingsfound4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_sidebar_nolistingsfound4 = /** @type {((inputs?: Appstoreadmin_Sidebar_Nolistingsfound4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Sidebar_Nolistingsfound4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_sidebar_nolistingsfound4(inputs)
	if (locale === "es") return es_appstoreadmin_sidebar_nolistingsfound4(inputs)
	if (locale === "fr") return fr_appstoreadmin_sidebar_nolistingsfound4(inputs)
	return ar_appstoreadmin_sidebar_nolistingsfound4(inputs)
});
export { appstoreadmin_sidebar_nolistingsfound4 as "appStoreAdmin.sidebar.noListingsFound" }