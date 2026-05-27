/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidemenu_Footer_Ownyourdata2Inputs */

const en_sidemenu_footer_ownyourdata2 = /** @type {(inputs: Sidemenu_Footer_Ownyourdata2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You own your own data.`)
};

const es_sidemenu_footer_ownyourdata2 = /** @type {(inputs: Sidemenu_Footer_Ownyourdata2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tú eres dueño de tus propios datos.`)
};

const de_sidemenu_footer_ownyourdata2 = /** @type {(inputs: Sidemenu_Footer_Ownyourdata2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Deine Daten gehören dir.`)
};

const ar_sidemenu_footer_ownyourdata2 = /** @type {(inputs: Sidemenu_Footer_Ownyourdata2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنت تملك بياناتك الخاصة.`)
};

/**
* | output |
* | --- |
* | "You own your own data." |
*
* @param {Sidemenu_Footer_Ownyourdata2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" }} options
* @returns {LocalizedString}
*/
const sidemenu_footer_ownyourdata2 = /** @type {((inputs?: Sidemenu_Footer_Ownyourdata2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidemenu_Footer_Ownyourdata2Inputs, { locale?: "en" | "es" | "de" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidemenu_footer_ownyourdata2(inputs)
	if (locale === "es") return es_sidemenu_footer_ownyourdata2(inputs)
	if (locale === "de") return de_sidemenu_footer_ownyourdata2(inputs)
	return ar_sidemenu_footer_ownyourdata2(inputs)
});
export { sidemenu_footer_ownyourdata2 as "sidemenu.footer.ownYourData" }